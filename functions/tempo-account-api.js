import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";

if (getApps().length === 0) initializeApp();

const auth = getAuth();
const db = getFirestore();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inviteFile = path.join(__dirname, "tempo-invites.generated.json");

const KNOWN_PROPERTY_IDS = [
  "tempo",
  "shareshuffle",
  "linkwombat",
  "lnkdx",
  "duetloop",
  "metromance",
  "breger",
  "eternalroute66",
  "charlie",
];

function loadInvites() {
  if (!fs.existsSync(inviteFile)) return { version: 2, invites: [] };
  const parsed = JSON.parse(fs.readFileSync(inviteFile, "utf8"));
  if (!Array.isArray(parsed.invites)) {
    throw new Error("tempo-invites.generated.json must contain an invites array");
  }
  return parsed;
}

function sendJson(res, status, payload) {
  res.status(status);
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.json(payload);
}

function methodNotAllowed(res, allowed) {
  res.set("Allow", allowed.join(", "));
  sendJson(res, 405, { ok: false, error: "method_not_allowed" });
}

function cleanPath(req) {
  return String(req.path || "/")
    .replace(/^\/api\/account\/?/, "")
    .replace(/^\/+|\/+$/g, "");
}

function cleanText(value, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeHandle(value) {
  return cleanText(value, 64).toLowerCase();
}

function validHandle(value) {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);
}

function validProperty(value) {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);
}

function validRedirectPath(value) {
  const pathValue = cleanText(value || "/", 300);
  return pathValue.startsWith("/") && !pathValue.startsWith("//")
    ? pathValue
    : "/";
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token || ""), "utf8")
    .digest("hex");
}

function normalizeInvite(raw) {
  const property = cleanText(raw?.property, 64).toLowerCase();
  const handle = normalizeHandle(raw?.handle);
  const tokenHash = cleanText(raw?.tokenHash, 128).toLowerCase();
  const parsedMaxClaims = Number(raw?.maxClaims ?? 1);
  const maxClaims =
    Number.isInteger(parsedMaxClaims) && parsedMaxClaims > 0
      ? Math.min(parsedMaxClaims, 10000)
      : 1;

  const features = Array.isArray(raw?.features)
    ? [...new Set(raw.features.map((value) => cleanText(value, 80)).filter(Boolean))]
    : [];

  const inviteId =
    cleanText(raw?.id, 160) ||
    `${property || "unknown"}-${handle || tokenHash.slice(0, 12)}`;

  return {
    id: inviteId,
    tokenHash,
    property,
    handle: handle || null,
    reservedFor: cleanText(raw?.reservedFor, 160) || null,
    relationship: cleanText(raw?.relationship, 160) || null,
    purpose: cleanText(raw?.purpose, 300) || null,
    role: cleanText(raw?.role || "member", 100) || "member",
    features,
    badge: cleanText(raw?.badge, 100) || null,
    cohort: cleanText(raw?.cohort, 120) || null,
    priceWaived: Boolean(raw?.priceWaived),
    publicProfileEnabled: Boolean(raw?.publicProfileEnabled),
    publicLinkListingEnabled: Boolean(raw?.publicLinkListingEnabled),
    allowedEmail: cleanText(raw?.allowedEmail, 320).toLowerCase() || null,
    allowedDomain: cleanText(raw?.allowedDomain, 240)
      .toLowerCase()
      .replace(/^@/, "") || null,
    maxClaims,
    expiresAt: cleanText(raw?.expiresAt, 80) || null,
    revokedAt: cleanText(raw?.revokedAt, 80) || null,
    redirectPath: validRedirectPath(raw?.redirectPath || "/"),
    createdAt: cleanText(raw?.createdAt, 80) || null,
  };
}

function findInvite(token) {
  const tokenHash = hashToken(token);
  const invite = loadInvites().invites
    .map(normalizeInvite)
    .find((candidate) => candidate.tokenHash === tokenHash);
  return invite ? { invite, tokenHash } : null;
}

function claimCountFromSummary(data = {}) {
  const explicit = Number(data.claimCount);
  if (Number.isInteger(explicit) && explicit >= 0) return explicit;
  return data.claimedByUid ? 1 : 0;
}

function invitationState(invite, summaryData = {}) {
  if (invite.revokedAt) return "revoked";

  if (invite.expiresAt) {
    const expiration = Date.parse(invite.expiresAt);
    if (Number.isFinite(expiration) && Date.now() > expiration) {
      return "expired";
    }
  }

  if (claimCountFromSummary(summaryData) >= invite.maxClaims) {
    return "exhausted";
  }

  return "available";
}

function safeInvitation(invite) {
  return {
    id: invite.id,
    property: invite.property,
    handle: invite.handle,
    reservedFor: invite.reservedFor,
    purpose: invite.purpose,
    role: invite.role,
    features: invite.features,
    badge: invite.badge,
    cohort: invite.cohort,
    priceWaived: invite.priceWaived,
    emailRestricted: Boolean(invite.allowedEmail || invite.allowedDomain),
    maxClaims: invite.maxClaims,
    expiresAt: invite.expiresAt,
    redirectPath: invite.redirectPath,
  };
}

async function requireUser(req) {
  const header = String(req.get("authorization") || "");
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    const error = new Error("missing_authentication");
    error.status = 401;
    throw error;
  }

  try {
    return await auth.verifyIdToken(match[1], true);
  } catch {
    const error = new Error("invalid_authentication");
    error.status = 401;
    throw error;
  }
}

async function readAccount(uid) {
  const accountSnap = await db.collection("tempoAccounts").doc(uid).get();
  const handlesSnap = await db
    .collection("tempoHandles")
    .where("ownerUid", "==", uid)
    .get();

  const membershipSnaps = await Promise.all(
    KNOWN_PROPERTY_IDS.map(async (property) => {
      const snap = await db
        .collection("tempoProperties")
        .doc(property)
        .collection("members")
        .doc(uid)
        .get();
      return snap.exists ? { property, ...snap.data() } : null;
    }),
  );

  return {
    account: accountSnap.exists ? accountSnap.data() : null,
    handles: handlesSnap.docs.map((doc) => ({
      handle: doc.id,
      ...doc.data(),
    })),
    memberships: membershipSnaps.filter(Boolean),
  };
}

async function ensureAccount(user) {
  const ref = db.collection("tempoAccounts").doc(user.uid);
  const existing = await ref.get();
  const now = FieldValue.serverTimestamp();

  const data = {
    uid: user.uid,
    email: user.email || null,
    emailVerified: Boolean(user.email_verified),
    displayName: user.name || null,
    photoURL: user.picture || null,
    provider: user.firebase?.sign_in_provider || null,
    updatedAt: now,
    lastSignInAt: now,
  };

  if (!existing.exists) data.createdAt = now;
  await ref.set(data, { merge: true });
}

function requireMatchingProperty(req, invite) {
  const requested = cleanText(req.get("x-tempo-property"), 64).toLowerCase();
  if (requested && requested !== invite.property) {
    const error = new Error("invitation_belongs_to_another_product");
    error.status = 400;
    throw error;
  }
}

async function handlePreview(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const token = cleanText(req.body?.token, 400);
  if (token.length < 20 || token.length > 300) {
    return sendJson(res, 400, { ok: false, error: "invalid_invitation" });
  }

  const found = findInvite(token);
  if (!found) {
    return sendJson(res, 404, {
      ok: false,
      error: "invitation_not_found",
    });
  }

  requireMatchingProperty(req, found.invite);

  const summarySnap = await db
    .collection("tempoInviteClaims")
    .doc(found.tokenHash)
    .get();
  const summary = summarySnap.exists ? summarySnap.data() : {};
  const status = invitationState(found.invite, summary);
  const claimCount = claimCountFromSummary(summary);

  return sendJson(res, 200, {
    ok: true,
    available: status === "available",
    status,
    invitation: safeInvitation(found.invite),
    claimsUsed: claimCount,
    claimsRemaining: Math.max(0, found.invite.maxClaims - claimCount),
  });
}

async function handleMe(req, res, user) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  await ensureAccount(user);
  const result = await readAccount(user.uid);

  return sendJson(res, 200, {
    ok: true,
    user: {
      uid: user.uid,
      email: user.email || null,
      emailVerified: Boolean(user.email_verified),
      displayName: user.name || null,
      photoURL: user.picture || null,
    },
    ...result,
  });
}

async function handleClaim(req, res, user) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const token = cleanText(req.body?.token, 400);
  if (token.length < 20 || token.length > 300) {
    return sendJson(res, 400, { ok: false, error: "invalid_invitation" });
  }

  const found = findInvite(token);
  if (!found) {
    return sendJson(res, 404, {
      ok: false,
      error: "invitation_not_found",
    });
  }

  const { invite, tokenHash } = found;
  requireMatchingProperty(req, invite);

  if (!validProperty(invite.property)) {
    return sendJson(res, 500, {
      ok: false,
      error: "invalid_invitation_configuration",
    });
  }

  if (invite.handle && !validHandle(invite.handle)) {
    return sendJson(res, 500, {
      ok: false,
      error: "invalid_invitation_configuration",
    });
  }

  if (invite.handle && invite.maxClaims !== 1) {
    return sendJson(res, 500, {
      ok: false,
      error: "handle_invitation_must_be_single_use",
    });
  }

  const email = cleanText(user.email, 320).toLowerCase();
  if (invite.allowedEmail && email !== invite.allowedEmail) {
    return sendJson(res, 403, {
      ok: false,
      error: "invitation_requires_another_email",
    });
  }

  if (
    invite.allowedDomain &&
    !email.endsWith(`@${invite.allowedDomain}`)
  ) {
    return sendJson(res, 403, {
      ok: false,
      error: "invitation_requires_email_domain",
    });
  }

  const summaryRef = db.collection("tempoInviteClaims").doc(tokenHash);
  const userClaimRef = summaryRef.collection("users").doc(user.uid);
  const accountRef = db.collection("tempoAccounts").doc(user.uid);
  const handleRef = invite.handle
    ? db.collection("tempoHandles").doc(invite.handle)
    : null;
  const memberRef = db
    .collection("tempoProperties")
    .doc(invite.property)
    .collection("members")
    .doc(user.uid);

  try {
    await db.runTransaction(async (transaction) => {
      const reads = [
        transaction.get(summaryRef),
        transaction.get(userClaimRef),
        transaction.get(accountRef),
        transaction.get(memberRef),
      ];

      if (handleRef) reads.push(transaction.get(handleRef));

      const snapshots = await Promise.all(reads);
      const summarySnap = snapshots[0];
      const userClaimSnap = snapshots[1];
      const accountSnap = snapshots[2];
      const memberSnap = snapshots[3];
      const handleSnap = handleRef ? snapshots[4] : null;

      const summaryData = summarySnap.exists ? summarySnap.data() : {};
      const state = invitationState(invite, summaryData);
      const legacySameUser =
        summaryData.claimedByUid &&
        summaryData.claimedByUid === user.uid;
      const alreadyClaimed = userClaimSnap.exists || legacySameUser;
      const priorCount = claimCountFromSummary(summaryData);

      if (!alreadyClaimed && state === "revoked") {
        const error = new Error("invitation_revoked");
        error.status = 410;
        throw error;
      }

      if (!alreadyClaimed && state === "expired") {
        const error = new Error("invitation_expired");
        error.status = 410;
        throw error;
      }

      if (!alreadyClaimed && priorCount >= invite.maxClaims) {
        const error = new Error("invitation_fully_claimed");
        error.status = 409;
        throw error;
      }

      if (
        handleRef &&
        handleSnap.exists &&
        handleSnap.data().ownerUid !== user.uid
      ) {
        const error = new Error("handle_unavailable");
        error.status = 409;
        throw error;
      }

      const now = FieldValue.serverTimestamp();
      const accountData = {
        uid: user.uid,
        email: user.email || null,
        emailVerified: Boolean(user.email_verified),
        displayName: user.name || invite.reservedFor || null,
        photoURL: user.picture || null,
        provider: user.firebase?.sign_in_provider || null,
        updatedAt: now,
        lastSignInAt: now,
      };

      if (!accountSnap.exists) accountData.createdAt = now;
      transaction.set(accountRef, accountData, { merge: true });

      if (handleRef) {
        const handleData = {
          handle: invite.handle,
          ownerUid: user.uid,
          property: invite.property,
          status: "active",
          reservedFor: invite.reservedFor,
          relationship: invite.relationship,
          purpose: invite.purpose,
          priceWaived: invite.priceWaived,
          publicProfileEnabled: invite.publicProfileEnabled,
          publicLinkListingEnabled: invite.publicLinkListingEnabled,
          updatedAt: now,
          claimedAt: now,
        };

        if (!handleSnap.exists) handleData.createdAt = now;
        transaction.set(handleRef, handleData, { merge: true });
      }

      const existingMember = memberSnap.exists ? memberSnap.data() : {};
      const roles = new Set(
        Array.isArray(existingMember.roles)
          ? existingMember.roles
          : existingMember.role
            ? [existingMember.role]
            : [],
      );
      roles.add(invite.role);

      const features = new Set(
        Array.isArray(existingMember.features)
          ? existingMember.features
          : [],
      );
      invite.features.forEach((feature) => features.add(feature));

      const memberData = {
        uid: user.uid,
        property: invite.property,
        role: invite.role,
        roles: [...roles],
        status: "active",
        handle: invite.handle || existingMember.handle || null,
        features: [...features],
        badge: invite.badge || existingMember.badge || null,
        cohort: invite.cohort || existingMember.cohort || null,
        priceWaived:
          invite.priceWaived || Boolean(existingMember.priceWaived),
        invitationId: invite.id,
        updatedAt: now,
        joinedAt: existingMember.joinedAt || now,
      };

      if (!memberSnap.exists) memberData.createdAt = now;
      transaction.set(memberRef, memberData, { merge: true });

      const nextCount = alreadyClaimed ? priorCount : priorCount + 1;
      const summaryUpdate = {
        tokenHash,
        invitationId: invite.id,
        property: invite.property,
        handle: invite.handle,
        reservedFor: invite.reservedFor,
        maxClaims: invite.maxClaims,
        claimCount: nextCount,
        status: nextCount >= invite.maxClaims ? "fully-claimed" : "active",
        updatedAt: now,
      };

      if (!summarySnap.exists) summaryUpdate.createdAt = now;
      if (invite.maxClaims === 1) {
        summaryUpdate.claimedByUid = user.uid;
        summaryUpdate.claimedByEmail = user.email || null;
        summaryUpdate.claimedAt = now;
      }

      transaction.set(summaryRef, summaryUpdate, { merge: true });

      const userClaimData = {
        uid: user.uid,
        email: user.email || null,
        invitationId: invite.id,
        property: invite.property,
        role: invite.role,
        handle: invite.handle,
        features: invite.features,
        claimedAt: now,
        updatedAt: now,
      };

      if (!userClaimSnap.exists) userClaimData.createdAt = now;
      transaction.set(userClaimRef, userClaimData, { merge: true });
    });
  } catch (error) {
    const status = Number(error.status) || 500;
    return sendJson(res, status, {
      ok: false,
      error: status < 500 ? error.message : "claim_failed",
    });
  }

  return sendJson(res, 200, {
    ok: true,
    claimed: {
      invitationId: invite.id,
      property: invite.property,
      handle: invite.handle,
      role: invite.role,
      features: invite.features,
      badge: invite.badge,
      cohort: invite.cohort,
      reservedFor: invite.reservedFor,
      redirectPath: invite.redirectPath,
    },
    ...(await readAccount(user.uid)),
  });
}

export const tempoAccountApi = onRequest(
  {
    region: "us-central1",
    cors: false,
    timeoutSeconds: 30,
    memory: "256MiB",
    invoker: "public",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    try {
      const route = cleanPath(req);

      if (route === "preview") {
        await handlePreview(req, res);
        return;
      }

      const user = await requireUser(req);

      if (route === "" || route === "me") {
        await handleMe(req, res, user);
        return;
      }

      if (route === "claim") {
        await handleClaim(req, res, user);
        return;
      }

      sendJson(res, 404, { ok: false, error: "not_found" });
    } catch (error) {
      const status = Number(error.status) || 500;
      sendJson(res, status, {
        ok: false,
        error: status < 500 ? error.message : "account_service_error",
      });
    }
  },
);
