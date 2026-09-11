/**
 * LinkWombat username policy.
 *
 * Keep this module free of Firebase-specific code so it can be used by
 * Cloud Functions, admin tools, and tests.
 */
const RESERVED = require("../config/linkwombat-reserved-usernames.json");
const PRICING = require("../config/linkwombat-username-pricing.json");

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateUsername(value) {
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

function getReservation(username) {
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

function getUsernamePrice(username) {
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
    const maxMatches = item.maxLength === null || length <= item.maxLength;
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

module.exports = {
  normalizeUsername,
  validateUsername,
  getReservation,
  getUsernamePrice,
};
