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
export const SHELF_BASE_URL = "https://shareshuffle.com/shelf.html?s=";

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
  const chars = "23456789abcdefghjklmnpqrstuvwxyz";
  let id = "";
  for (let i = 0; i < length; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function makeSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 48);
}

export function extractPrimaryUrl(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const matches = raw.match(/https?:\/\/[^\s<>"']+|\b(?:amzn\.to|a\.co|walmart\.com|www\.walmart\.com|amazon\.com|www\.amazon\.com|target\.com|www\.target\.com|bestbuy\.com|www\.bestbuy\.com|ebay\.com|www\.ebay\.com)\/[^\s<>"']+/gi) || [];
  const normalized = matches.map((url) => url.startsWith("http") ? url : `https://${url}`)
    .map((url) => url.replace(/[).,;!?]+$/g, ""));

  const preferred = normalized.find((url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
      return ["amzn.to","a.co","amazon.com","walmart.com","target.com","bestbuy.com","ebay.com"].some(d => host === d || host.endsWith(`.${d}`));
    } catch { return false; }
  });
  return preferred || normalized[0] || "";
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
    url.searchParams.set("tag", AFFILIATE_CONFIG.amazon.tag);
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
  return neutralizeText(title)
    .replace(/^Amazon[․.]com\s*[:|\-–—]?\s*/i, "")
    .replace(/^Walmart[․.]com\s*[:|\-–—]?\s*/i, "")
    .replace(/^eBay[․.]com\s*[:|\-–—]?\s*/i, "")
    .replace(/^Target\s*[:|\-–—]?\s*/i, "")
    .replace(/^Best Buy\s*[:|\-–—]?\s*/i, "")
    .replace(/\s*[:|]\s*(Amazon|Walmart|Target|Best Buy|eBay)\s*$/i, "")
    .trim();
}

export function smartTruncate(value = "", maxLength = 90) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, Math.max(0, maxLength - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > Math.min(40, maxLength / 2) ? slice.slice(0, lastSpace) : slice;
  return trimmed.replace(/[\s,;:.-]+$/g, "") + "…";
}

export function buildMessage({ title, note, shareUrl }) {
  const cleanProductTitle = smartTruncate(cleanTitle(title), 90);
  const cleanNote = smartTruncate(neutralizeText(note).trim(), 140);
  const cleanShareUrl = String(shareUrl || "").replace(/^https?:\/\//, "");
  return [
    "🔗 Shared via ShareShuffle",
    cleanNote ? `📝 ${cleanNote}` : "",
    cleanProductTitle ? `🛍️ ${cleanProductTitle}` : "",
    cleanShareUrl ? `🔗 ${cleanShareUrl}` : ""
  ].filter(Boolean).join("\n");
}

export function titleFromUrl(url = "") {
  const merchant = getAffiliateMerchant(url);
  const names = { amazon: "Amazon", walmart: "Walmart", target: "Target", bestbuy: "Best Buy", ebay: "eBay" };
  return `Shared find${names[merchant] ? ` from ${names[merchant]}` : ""}`;
}
