/**
 * LinkWombat username policy for an ES module Firebase Functions project.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reservedPath = path.resolve(
  __dirname,
  "../config/linkwombat-reserved-usernames.json",
);
const pricingPath = path.resolve(
  __dirname,
  "../config/linkwombat-username-pricing.json",
);

const RESERVED = JSON.parse(fs.readFileSync(reservedPath, "utf8"));
const PRICING = JSON.parse(fs.readFileSync(pricingPath, "utf8"));

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateUsername(value) {
  const username = normalizeUsername(value);

  if (!username) {
    return { ok: false, username, reason: "empty" };
  }

  if (!USERNAME_RE.test(username)) {
    return { ok: false, username, reason: "invalid_characters" };
  }

  if (username.length > 40) {
    return { ok: false, username, reason: "too_long" };
  }

  return { ok: true, username };
}

export function getReservation(username) {
  const normalized = normalizeUsername(username);

  if (Object.prototype.hasOwnProperty.call(RESERVED.reserved, normalized)) {
    return {
      type: "person",
      username: normalized,
      ...RESERVED.reserved[normalized],
    };
  }

  if (RESERVED.system.includes(normalized)) {
    return {
      type: "system",
      username: normalized,
      publicClaimBlocked: true,
      priceWaived: false,
      status: "reserved",
    };
  }

  return null;
}

export function getUsernamePrice(username) {
  const normalized = normalizeUsername(username);
  const length = normalized.length;
  const reservation = getReservation(normalized);

  if (reservation) {
    return {
      username: normalized,
      length,
      priceCents: reservation.priceWaived ? 0 : null,
      currency: PRICING.currency,
      billing: PRICING.billing,
      claimableByPublic: false,
      reservation,
    };
  }

  const tier = PRICING.tiers.find((item) => {
    const maxMatches =
      item.maxLength === null || length <= item.maxLength;
    return length >= item.minLength && maxMatches;
  });

  if (!tier) {
    throw new Error(`No username pricing tier for length ${length}`);
  }

  return {
    username: normalized,
    length,
    priceCents: tier.priceCents,
    currency: PRICING.currency,
    billing: PRICING.billing,
    claimableByPublic: tier.priceCents !== null,
    reservation: null,
  };
}
