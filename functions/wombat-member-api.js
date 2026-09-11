import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";

if (getApps().length === 0) initializeApp();

const auth = getAuth();
const db = getFirestore();

function sendJson(res, status, payload) {
  res.status(status);
  res.set("Cache-Control", "no-store");
  res.set("X-Content-Type-Options", "nosniff");
  res.json(payload);
}

function methodNotAllowed(res, allowed) {
  res.set("Allow", allowed.join(", "));
  sendJson(res, 405, { ok: false, error: "method_not_allowed" });
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

function normalizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_.+&@]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validSegment(value) {
  return (
    value.length >= 1 &&
    value.length <= 80 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)
  );
}

function validateDestination(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["https:", "http:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function getOwnedHandle(uid, requestedHandle = "") {
  const requested = normalizeSegment(requestedHandle);
  if (requested) {
    const snap = await db.collection("tempoHandles").doc(requested).get();
    const data = snap.exists ? snap.data() : null;
    if (
      data?.ownerUid === uid &&
      data?.status === "active" &&
      data?.property === "linkwombat"
    ) {
      return requested;
    }
    return null;
  }

  const snap = await db.collection("tempoHandles").where("ownerUid", "==", uid).get();
  const match = snap.docs.find((doc) => {
    const data = doc.data();
    return data.status === "active" && data.property === "linkwombat";
  });
  return match?.id || null;
}

async function listLinks(req, res, user) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const handle = await getOwnedHandle(user.uid, String(req.query.handle || ""));
  if (!handle) {
    return sendJson(res, 403, {
      ok: false,
      error: "linkwombat_handle_required",
    });
  }

  const snap = await db
    .collection("wombatMemberLinks")
    .where("ownerUid", "==", user.uid)
    .get();

  const links = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((link) => link.handle === handle && link.status === "active")
    .sort((a, b) => String(a.slug || "").localeCompare(String(b.slug || "")))
    .map((link) => ({
      id: link.id,
      handle: link.handle,
      slug: link.slug,
      destination: link.destination,
      title: link.title || null,
      shortUrl: `https://wombat.to/${handle}/${link.slug}`,
    }));

  return sendJson(res, 200, { ok: true, handle, links });
}

async function saveLink(req, res, user) {
  if (!["POST", "PUT"].includes(req.method)) {
    return methodNotAllowed(res, ["POST", "PUT"]);
  }

  const handle = await getOwnedHandle(user.uid, req.body?.handle || "");
  if (!handle) {
    return sendJson(res, 403, {
      ok: false,
      error: "linkwombat_handle_required",
    });
  }

  const slug = normalizeSegment(req.body?.slug);
  const destination = validateDestination(req.body?.destination);
  const title = String(req.body?.title || "").trim().slice(0, 160);

  if (!validSegment(slug)) {
    return sendJson(res, 400, {
      ok: false,
      error: "invalid_slug",
      suggestedSlug: slug || null,
    });
  }

  if (!destination) {
    return sendJson(res, 400, {
      ok: false,
      error: "invalid_destination",
    });
  }

  const id = `${handle}__${slug}`;
  const ref = db.collection("wombatMemberLinks").doc(id);

  try {
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists && existing.data().ownerUid !== user.uid) {
        const error = new Error("link_unavailable");
        error.status = 409;
        throw error;
      }

      const now = FieldValue.serverTimestamp();
      const data = {
        id,
        handle,
        slug,
        destination,
        title: title || null,
        ownerUid: user.uid,
        status: "active",
        publicListingEnabled: false,
        updatedAt: now,
      };
      if (!existing.exists) data.createdAt = now;
      transaction.set(ref, data, { merge: true });
    });
  } catch (error) {
    const status = Number(error.status) || 500;
    return sendJson(res, status, {
      ok: false,
      error: status < 500 ? error.message : "save_failed",
    });
  }

  return sendJson(res, 200, {
    ok: true,
    link: {
      id,
      handle,
      slug,
      destination,
      title: title || null,
      shortUrl: `https://wombat.to/${handle}/${slug}`,
    },
  });
}

async function deleteLink(req, res, user) {
  if (req.method !== "DELETE") return methodNotAllowed(res, ["DELETE"]);

  const handle = await getOwnedHandle(user.uid, req.body?.handle || "");
  const slug = normalizeSegment(req.body?.slug);
  if (!handle || !validSegment(slug)) {
    return sendJson(res, 400, { ok: false, error: "invalid_link" });
  }

  const ref = db.collection("wombatMemberLinks").doc(`${handle}__${slug}`);
  const snap = await ref.get();

  if (!snap.exists) {
    return sendJson(res, 404, { ok: false, error: "link_not_found" });
  }
  if (snap.data().ownerUid !== user.uid) {
    return sendJson(res, 403, { ok: false, error: "not_link_owner" });
  }

  await ref.delete();
  return sendJson(res, 200, { ok: true, deleted: { handle, slug } });
}

export const wombatMemberApi = onRequest(
  {
    region: "us-central1",
    cors: false,
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    try {
      const user = await requireUser(req);
      const route = String(req.path || "")
        .replace(/^\/api\/member-links\/?/, "")
        .replace(/^\/+|\/+$/g, "");

      if (route === "" || route === "list") {
        await listLinks(req, res, user);
        return;
      }
      if (route === "save") {
        await saveLink(req, res, user);
        return;
      }
      if (route === "delete") {
        await deleteLink(req, res, user);
        return;
      }

      sendJson(res, 404, { ok: false, error: "not_found" });
    } catch (error) {
      const status = Number(error.status) || 500;
      sendJson(res, status, {
        ok: false,
        error: status < 500 ? error.message : "member_link_service_error",
      });
    }
  },
);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const wombatMemberResolve = onRequest(
  {
    region: "us-central1",
    cors: false,
    timeoutSeconds: 15,
    memory: "256MiB",
  },
  async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.status(405).set("Allow", "GET, HEAD").end();
      return;
    }

    let parts;
    try {
      parts = String(req.path || "/")
        .split("/")
        .filter(Boolean)
        .map((part) => decodeURIComponent(part).toLowerCase());
    } catch {
      res.status(400).set("Cache-Control", "no-store").send("Bad request");
      return;
    }

    if (
      ![1, 2].includes(parts.length) ||
      parts.some((part) => !validSegment(part))
    ) {
      res.status(404).set("Cache-Control", "no-store").send("Not found");
      return;
    }

    const handle = parts[0];
    const handleSnap = await db.collection("tempoHandles").doc(handle).get();
    const handleData = handleSnap.exists ? handleSnap.data() : null;

    if (parts.length === 1) {
      const active =
        handleData?.status === "active" &&
        handleData?.property === "linkwombat";

      res
        .status(active ? 200 : 404)
        .set("Cache-Control", "no-store")
        .set("Content-Type", "text/html; charset=utf-8")
        .send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${active ? "Unlisted namespace" : "Reserved username"} | LinkWombat</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;display:grid;min-height:100vh;place-items:center;background:#fffaf0;color:#172033}main{max-width:38rem;padding:2rem;text-align:center}a{color:#9a4d00;font-weight:700}</style>
</head><body><main>
<h1>${active ? "This is an unlisted LinkWombat namespace." : "This LinkWombat username is reserved."}</h1>
<p><strong>${escapeHtml(handle)}</strong> does not publish a public list of links.</p>
<p><a href="https://linkwombat.com/">Visit LinkWombat</a></p>
</main></body></html>`);
      return;
    }

    const slug = parts[1];
    const linkSnap = await db
      .collection("wombatMemberLinks")
      .doc(`${handle}__${slug}`)
      .get();

    const linkData = linkSnap.exists ? linkSnap.data() : null;
    const valid =
      handleData?.status === "active" &&
      handleData?.property === "linkwombat" &&
      linkData?.status === "active" &&
      linkData?.handle === handle &&
      linkData?.slug === slug &&
      linkData?.ownerUid === handleData?.ownerUid;

    if (!valid) {
      res
        .status(404)
        .set("Cache-Control", "no-store")
        .set("Content-Type", "text/html; charset=utf-8")
        .send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link not found | LinkWombat</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;display:grid;min-height:100vh;place-items:center;background:#fffaf0;color:#172033}main{max-width:38rem;padding:2rem;text-align:center}a{color:#9a4d00;font-weight:700}</style>
</head><body><main><h1>That little link wandered off.</h1>
<p><strong>${escapeHtml(handle)}/${escapeHtml(slug)}</strong> is not active.</p>
<p><a href="https://linkwombat.com/">Visit LinkWombat</a></p></main></body></html>`);
      return;
    }

    res
      .status(302)
      .set("Cache-Control", "private, no-store, max-age=0")
      .set("Location", linkData.destination)
      .end();
  },
);
