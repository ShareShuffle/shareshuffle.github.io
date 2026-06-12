// Shared ShareShuffle helpers for web/PWA pages.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC-IdAGNybUmS4LPqQX-WrOVtIDPPl8ZzE",
  authDomain: "shareshuffle-c7f96.firebaseapp.com",
  projectId: "shareshuffle-c7f96",
  storageBucket: "shareshuffle-c7f96.firebasestorage.app",
  messagingSenderId: "507028011652",
  appId: "1:507028011652:web:97c161c63b7940af0f60d1",
  measurementId: "G-C8W9TBP705"
};

export const SHARE_BASE_URL = "https://shfl.me/";
export const SHELF_BASE_URL = "https://shelfmix.com/";

export const AFFILIATE_CONFIG = {
  amazon: { tag: "shareshuffle-20" },
  walmart: {
    publisherId: "1936697",
    campaignId: "565706",
    creativeId: "9383",
    sourceId: "imp_000011112222333344"
  }
};

export function makeShortId(length = 5) {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz";
  let id = "";
  for (let i = 0; i < length; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function makeSlug(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 48);
}

export function extractPrimaryUrl(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return "";

  // Pull every URL-like thing from messy share text, then choose the URL
  // most likely to be the actual product link. Amazon share sheets often
  // include text like "Rich sent you this from Amazon.com — amzn.to/abc".
  const matches = raw.match(/https?:\/\/[^\s<>"']+|\b(?:amzn\.to|a\.co|walmart\.com|www\.walmart\.com|amazon\.com|www\.amazon\.com|target\.com|www\.target\.com|bestbuy\.com|www\.bestbuy\.com|ebay\.com|www\.ebay\.com)\/[^\s<>"']+/gi) || [];

  const normalized = matches
    .map((url) => url.startsWith("http") ? url : `https://${url}`)
    .map((url) => url.replace(/[).,;!?]+$/g, ""));

  if (!normalized.length) return "";

  const scoreUrl = (candidate) => {
    try {
      const url = new URL(candidate);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      let score = 0;

      // Prefer real share/product short links over incidental domain mentions.
      if (host === "amzn.to" || host === "a.co") score += 100;
      if (host === "amazon.com" || host.endsWith(".amazon.com")) score += 80;
      if (host === "walmart.com" || host.endsWith(".walmart.com")) score += 75;
      if (host === "target.com" || host.endsWith(".target.com")) score += 70;
      if (host === "bestbuy.com" || host.endsWith(".bestbuy.com")) score += 70;
      if (host === "ebay.com" || host.endsWith(".ebay.com")) score += 70;

      // Prefer URLs that look like product links.
      if (/\/(?:dp|gp\/product|ip|p|itm)\//i.test(url.pathname)) score += 15;
      if (url.pathname.length > 1) score += 5;

      return score;
    } catch {
      return 0;
    }
  };

  return normalized
    .map((url, index) => ({ url, index, score: scoreUrl(url) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.url || normalized[0];
}

export function getAffiliateMerchant(originalUrl = "") {
  try {
    const hostname = new URL(originalUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname === "amazon.com" || hostname.endsWith(".amazon.com") || hostname === "amzn.to" || hostname === "a.co") return "amazon";
    if (hostname === "walmart.com" || hostname.endsWith(".walmart.com") || hostname.includes("goto.walmart.com")) return "walmart";
    if (hostname === "target.com" || hostname.endsWith(".target.com")) return "target";
    if (hostname === "bestbuy.com" || hostname.endsWith(".bestbuy.com")) return "bestbuy";
    if (hostname === "ebay.com" || hostname.endsWith(".ebay.com")) return "ebay";
    return "direct";
  } catch { return "direct"; }
}

export function buildAmazonAffiliateUrl(originalUrl) {
  try {
    const url = new URL(originalUrl);

    // Ethics-first behavior:
    // - Long Amazon URLs that already have an affiliate tag keep that tag.
    // - Short Amazon share links (amzn.to/a.co) may not reveal whether a tag is
    //   hidden behind the redirect, so we add ours only when no visible tag exists.
    if (!url.searchParams.has("tag")) {
      url.searchParams.set("tag", AFFILIATE_CONFIG.amazon.tag);
    }

    return url.toString();
  } catch { return originalUrl; }
}

export function buildWalmartAffiliateUrl(originalUrl) {
  try {
    const destinationUrl = new URL(originalUrl);
    if (destinationUrl.hostname.includes("goto.walmart.com")) return destinationUrl.toString();
    const { publisherId, campaignId, creativeId, sourceId } = AFFILIATE_CONFIG.walmart;
    const redirectUrl = new URL(`https://goto.walmart.com/c/${publisherId}/${campaignId}/${creativeId}`);
    redirectUrl.searchParams.set("u", destinationUrl.toString());
    if (sourceId) redirectUrl.searchParams.set("subId1", sourceId);
    return redirectUrl.toString();
  } catch { return originalUrl; }
}

export function buildAffiliateUrl(originalUrl = "") {
  const merchant = getAffiliateMerchant(originalUrl);
  if (merchant === "amazon") return buildAmazonAffiliateUrl(originalUrl);
  if (merchant === "walmart") return buildWalmartAffiliateUrl(originalUrl);
  return originalUrl;
}

export function neutralizeText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\./g, "․")
    .replace(/:/g, "꞉")
    .replace(/\//g, "⁄")
    .replace(/&/g, "＆")
    .replace(/@/g, "＠")
    .replace(/\?/g, "？")
    .replace(/=/g, "＝")
    .replace(/#/g, "＃")
    .replace(/%/g, "％")
    .replace(/\+/g, "＋")
    .replace(/</g, "‹")
    .replace(/>/g, "›");
}

export function cleanTitle(title = "") {
  let value = neutralizeText(title).trim();

  value = value
    .replace(/^(Amazon[․.]com|Amazon|Walmart[․.]com|Walmart|Target|Best Buy|eBay[․.]com|eBay)\s*[:꞉|｜\-–—]\s*/i, "")
    .replace(/\s*[:꞉|｜]\s*(Amazon|Amazon[․.]com|Walmart|Walmart[․.]com|Target|Best Buy|eBay|eBay[․.]com)\s*$/i, "")
    .replace(/\s*[:꞉|｜]\s*(Home\s*＆\s*Kitchen|Home\s*&\s*Kitchen|Electronics|Clothing,\s*Shoes\s*＆\s*Jewelry|Clothing,\s*Shoes\s*&\s*Jewelry|Musical Instruments|Amazon Luxury|Sports\s*＆\s*Outdoors|Sports\s*&\s*Outdoors|Tools\s*＆\s*Home Improvement|Tools\s*&\s*Home Improvement|Office Products|Beauty\s*＆\s*Personal Care|Beauty\s*&\s*Personal Care|Health\s*＆\s*Household|Health\s*&\s*Household|Toys\s*＆\s*Games|Toys\s*&\s*Games|Patio,\s*Lawn\s*＆\s*Garden|Patio,\s*Lawn\s*&\s*Garden|Automotive)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return value || "Shared find";
}

export function smartTruncate(value = "", maxLength = 90) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, Math.max(0, maxLength - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > Math.min(40, maxLength / 2) ? slice.slice(0, lastSpace) : slice;
  return trimmed.replace(/[\s,;:.-]+$/g, "") + "…";
}


export function normalizePublicToken(value = "") {
  return makeSlug(String(value || "").replace(/^@+/, ""));
}

export function normalizeHandle(value = "") {
  return normalizePublicToken(value);
}

export function normalizeShelfSlug(value = "") {
  return makeSlug(value);
}

export function isShareId(value = "") {
  return /^[23456789abcdefghjkmnpqrstuvwxyz]{5}$/i.test(String(value || "").trim());
}

export function canonicalShareId(value = "") {
  const id = String(value || "").trim().toLowerCase();
  return isShareId(id) ? id : "";
}

export function normalizeRoutePath(pathname = "") {
  const parts = String(pathname || "")
    .split("/")
    .filter(Boolean)
    .map(part => decodeURIComponent(part).trim())
    .filter(Boolean)
    .map(part => part.startsWith("@") ? `@${normalizeHandle(part)}` : normalizePublicToken(part));
  return parts.length ? `/${parts.join("/")}` : "/";
}

export function buildShareUrl(id = "") {
  const shareId = canonicalShareId(id) || String(id || "").trim().toLowerCase();
  return `${SHARE_BASE_URL}${shareId}`;
}

export function buildShelfUrl({ handleSlug = "", shelfSlug = "" } = {}) {
  const handle = normalizeHandle(handleSlug);
  const shelf = normalizeShelfSlug(shelfSlug);
  if (handle && shelf) return `${SHELF_BASE_URL}${handle}/${shelf}`;
  if (shelf) return `https://shareshuffle.com/shelf.html?s=${encodeURIComponent(shelf)}`;
  if (handle) return `${SHELF_BASE_URL}${handle}`;
  return "";
}

export function buildHandleShareUrl({ handleSlug = "", shelfSlug = "", id = "" } = {}) {
  const handle = normalizeHandle(handleSlug);
  const shareId = canonicalShareId(id) || String(id || "").trim().toLowerCase();

  // Keep individual item links as short as possible for text/iMessage.
  // Shelves/profiles get the richer ShelfMix routes; item shares are SHFL.ME/a2c4e.
  return buildShareUrl(shareId);
}

export function routeToDestination({ hostname = "", pathname = "/", search = "" } = {}) {
  const path = normalizeRoutePath(pathname);
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(search || "");

  // Existing explicit pages still work when requested directly.
  if (!parts.length) return { href: "/", replace: false, canonicalPath: "/" };

  const first = parts[0] || "";
  if (["app", "share.html", "shelf.html", "index.html", "status.html", "_status", "_build", "img", "getpreview", "ogimage"].includes(first)) return null;
  if (/^(?:i-|~|-)[23456789abcdefghjkmnpqrstuvwxyz]{5}$/i.test(first)) return null;

  // Root short links: /A2C4E, /a2c4e, /A2c4E all resolve to the same share.
  if (parts.length === 1 && isShareId(first)) {
    const id = canonicalShareId(first);
    return { href: `/share.html?id=${encodeURIComponent(id)}`, replace: true, canonicalPath: `/${id}` };
  }

  // Current username routes use @ so 1–2 character early-adopter names are safe.
  // /@rich, /@Rich, /@RICH normalize to /@rich.
  if (first.startsWith("@")) {
    const handle = normalizeHandle(first);
    const second = normalizeShelfSlug(parts[1] || "");
    const third = canonicalShareId(parts[2] || "");

    if (third) {
      return { href: `/share.html?id=${encodeURIComponent(third)}&u=${encodeURIComponent(handle)}&s=${encodeURIComponent(second)}`, replace: true, canonicalPath: `/@${handle}/${second}/${third}` };
    }
    if (second && isShareId(second)) {
      const id = canonicalShareId(second);
      return { href: `/share.html?id=${encodeURIComponent(id)}&u=${encodeURIComponent(handle)}`, replace: true, canonicalPath: `/@${handle}/${id}` };
    }
    if (second) {
      return { href: `/shelf.html?u=${encodeURIComponent(handle)}&s=${encodeURIComponent(second)}`, replace: true, canonicalPath: `/@${handle}/${second}` };
    }
    return { href: `/shelf.html?u=${encodeURIComponent(handle)}`, replace: true, canonicalPath: `/@${handle}` };
  }

  // Future no-@ username routes. Because 5-char share IDs are reserved above,
  // /rich can eventually become a profile while /a2c4e stays a share.
  if (/^[a-z0-9][a-z0-9-]{0,23}$/.test(first)) {
    const handle = normalizeHandle(first);
    const second = normalizeShelfSlug(parts[1] || "");
    const third = canonicalShareId(parts[2] || "");
    if (third) return { href: `/share.html?id=${encodeURIComponent(third)}&u=${encodeURIComponent(handle)}&s=${encodeURIComponent(second)}`, replace: true, canonicalPath: `/${handle}/${second}/${third}` };
    if (second) return { href: `/shelf.html?u=${encodeURIComponent(handle)}&s=${encodeURIComponent(second)}`, replace: true, canonicalPath: `/${handle}/${second}` };
    return { href: `/shelf.html?u=${encodeURIComponent(handle)}`, replace: true, canonicalPath: `/${handle}` };
  }

  return null;
}

export function buildMessage({ title, note, shareUrl }) {
  const cleanProductTitle = smartTruncate(cleanTitle(title), 86);
  const cleanNote = smartTruncate(neutralizeText(note).trim(), 150);
  const cleanShareUrl = String(shareUrl || "").replace(/^https?:\/\//, "").replace(/\/+$/g, "").toLowerCase();
  return [
    "Shared via Shuffle:",
    cleanNote ? `“${cleanNote}”` : "",
    cleanNote && cleanProductTitle ? "" : "",
    cleanProductTitle || "",
    cleanShareUrl || ""
  ].filter((line) => line !== null && line !== undefined).join("
").replace(/
{3,}/g, "

").trim();
}

export function titleFromUrl(url = "") {
  const merchant = getAffiliateMerchant(url);
  const names = { amazon: "Amazon", walmart: "Walmart", target: "Target", bestbuy: "Best Buy", ebay: "eBay" };
  return `Shared find${names[merchant] ? ` from ${names[merchant]}` : ""}`;
}
