import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";
import crypto from "crypto";

initializeApp();
const db = getFirestore();
const storage = getStorage();
const BRAVE_SEARCH_API_KEY = defineSecret("BRAVE_SEARCH_API_KEY");

const BUILD_INFO = {
  build: "2026.06.19-open-buttons-internal-routes-59",
  createdAt: "2026-06-18T18:05:00Z",
  patch: "hyphen-only-public-urls-53",
  functions: ["getPreview", "imageRescue", "rescueImage", "renderRoute", "ogImage", "shareImage", "cardImage", "shelfCardImage", "uploadShareImage", "shelfData", "shareData", "trackShareClick", "addShareToShelf", "getBuildInfo"]
};

const MAX_HTML_BYTES = 900000;
const TIMEOUT_MS = 9000;

const BROWSER_HEADERS = {
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "pragma": "no-cache"
};

const MOBILE_HEADERS = {
  ...BROWSER_HEADERS,
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
};

function getAllowedOrigin(origin = "") {
  const allowedExact = new Set([
    "https://shareshuffle.com",
    "https://www.shareshuffle.com",
    "https://shfl.me",
    "https://www.shfl.me",
    "https://shareshuffle.com/shelf.html",
    "https://www.shareshuffle.com/shelf.html",
    "https://shareshuffle-c7f96.web.app",
    "https://shareshuffle-c7f96.firebaseapp.com",
    "https://rchwms.github.io"
  ]);
  if (allowedExact.has(origin)) return origin;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return origin;
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return origin;
  return "https://shareshuffle.com";
}

function sendJson(res, status, payload) {
  res.set("Access-Control-Allow-Origin", getAllowedOrigin(res.req?.headers?.origin || ""));
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Cache-Control", "no-store, max-age=0");
  res.status(status).json(payload);
}

function setCors(res, methods = "GET, OPTIONS") {
  res.set("Access-Control-Allow-Origin", getAllowedOrigin(res.req?.headers?.origin || ""));
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", methods);
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

function sendCorsJson(res, status, payload, methods = "GET, OPTIONS") {
  setCors(res, methods);
  res.set("Cache-Control", "no-store, max-age=0");
  res.status(status).json(payload);
}

function isAllowedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!/^https?:$/.test(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) return false;
    if (/^(10|127|169\.254|172\.(1[6-9]|2\d|3[0-1])|192\.168)\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function hostOf(rawUrl = "") {
  try { return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

function isAmazonHost(rawUrl = "") {
  const host = hostOf(rawUrl);
  return host === "amazon.com" || host.endsWith(".amazon.com") || host === "a.co" || host === "amzn.to";
}

function isWalmartHost(rawUrl = "") {
  const host = hostOf(rawUrl);
  return host === "walmart.com" || host.endsWith(".walmart.com");
}

function isWalmartBlockedUrl(url = "") {
  try {
    const parsed = new URL(url);
    return isWalmartHost(url) && /\/blocked\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function decodeWalmartBlockedUrl(url = "") {
  try {
    const parsed = new URL(url);
    if (!isWalmartBlockedUrl(url)) return "";
    const encoded = parsed.searchParams.get("url") || "";
    if (!encoded) return "";
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const decodedPath = Buffer.from(padded, "base64").toString("utf8");
    if (!decodedPath || /\/blocked\/?/i.test(decodedPath)) return "";
    const restored = decodedPath.startsWith("http")
      ? decodedPath
      : `https://www.walmart.com${decodedPath.startsWith("/") ? "" : "/"}${decodedPath}`;
    return isAllowedUrl(restored) ? restored : "";
  } catch {
    return "";
  }
}

function publicFinalUrl(finalUrl = "", requestedUrl = "") {
  return isWalmartBlockedUrl(finalUrl) ? (decodeWalmartBlockedUrl(finalUrl) || requestedUrl || finalUrl) : finalUrl;
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function pickMeta(html, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i");
    const match = html.match(re);
    if (match) return decodeEntities(match[1] || match[2] || "");
  }
  return "";
}

function pickById(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = "<[^>]+id=[\\\"']" + escaped + "[\\\"'][^>]*>([\\\\s\\\\S]*?)<\\/[^>]+>";
  const match = html.match(new RegExp(pattern, "i"));
  return decodeEntities((match?.[1] || "").replace(/<[^>]+>/g, " "));
}

function pickJsonLdProductName(html = "") {
  const scripts = [...String(html || "").matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    const raw = decodeEntities(script[1] || "");
    try {
      const parsed = JSON.parse(raw);
      const stack = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (stack.length) {
        const item = stack.shift();
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item)) { stack.push(...item); continue; }
        if (item["@graph"]) stack.push(...(Array.isArray(item["@graph"]) ? item["@graph"] : [item["@graph"]]));
        const type = String(Array.isArray(item["@type"]) ? item["@type"].join(" ") : item["@type"] || "").toLowerCase();
        const name = decodeEntities(item.name || item.headline || "");
        if (name && (!type || /product|thing|creativework/.test(type))) return name;
      }
    } catch {}
    const loose = raw.match(/"name"\s*:\s*"([^"\n]{3,300})"/i)?.[1];
    if (loose) return decodeEntities(loose);
  }
  return "";
}

function decodeLooseJsonString(value = "") {
  const raw = String(value || "");
  if (!raw) return "";
  try {
    return decodeEntities(JSON.parse(`"${raw.replace(/"/g, '\\"')}"`));
  } catch {
    return decodeEntities(raw.replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\\\//g, "/"));
  }
}

function looksLikeUsefulAmazonTitle(value = "") {
  const text = decodeEntities(String(value || "")).replace(/\s+/g, " ").trim();
  if (text.length < 8 || text.length > 260) return false;
  if (isBadAmazonTitle(text) || /amazon\.(com|co)|customer reviews|ratings|prime|sponsored|visit the store/i.test(text)) return false;
  if (/^https?:/i.test(text)) return false;
  return /[a-z]/i.test(text);
}


function cleanAmazonTitleCandidate(value = "") {
  return decodeLooseJsonString(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*[:|｜]\s*Amazon(?:\.com)?\s*$/i, "")
    .replace(/\s+-\s+Amazon(?:\.com)?\s*$/i, "")
    .replace(/^Amazon(?:\.com)?\s*[:|｜-]\s*/i, "")
    .trim();
}

function amazonTitleScore(value = "") {
  const text = cleanAmazonTitleCandidate(value);
  if (!looksLikeUsefulAmazonTitle(text)) return -9999;
  if (/sponsored|limited time deal|bought in past month|price history|select from|prime today|hear the highlights|customer images|review|rating|storefront/i.test(text)) return -9999;
  let score = Math.min(160, text.length);
  if (/bluetooth|speaker|wireless|portable|stereo|audio|bass|pedal|effect|gatorade|powder|cooling|hydration|book|tool|guitar|amp/i.test(text)) score += 80;
  if (/\b(for|with|pack|portable|wireless|zero|effect|bass|speaker|bluetooth)\b/i.test(text)) score += 30;
  if (/[,]/.test(text)) score += 10;
  if (/^.{8,80}$/.test(text)) score += 20;
  if (/^.{160,}$/.test(text)) score -= 45;
  return score;
}

function pushAmazonTitleCandidate(values, value) {
  const clean = cleanAmazonTitleCandidate(value || "");
  if (looksLikeUsefulAmazonTitle(clean)) values.push(clean);
}

function pickAmazonVisibleTitle(html = "") {
  const source = String(html || "");
  const values = [];
  const decoded = decodeEntities(source);

  // Common Amazon title shapes, including mobile/AW pages and escaped state blobs.
  const patterns = [
    /id=["']productTitle["'][^>]*>([\s\S]{3,500}?)<\//gi,
    /class=["'][^"']*product-title-word-break[^"']*["'][^>]*>([\s\S]{3,500}?)<\//gi,
    /data-asin-title=["']([^"']{8,360})["']/gi,
    /(?:"|&quot;)(?:productTitle|titleDisplay|displayTitle|item_name|itemName|asinTitle|title)(?:"|&quot;)\s*:\s*(?:"|&quot;)([^"\n]{8,360})(?:"|&quot;)/gi,
    /(?:productTitle|titleDisplay|displayTitle|item_name|itemName|asinTitle|title)\\?"\s*:\s*\\?"([^"\n]{8,360})\\?"/gi,
    /aria-label=["']([^"']{8,360}(?:Bluetooth|Speaker|Wireless|Portable|Bass|Pedal|Effect|Gatorade|Powder)[^"']{0,120})["']/gi,
    /alt=["']([^"']{8,360}(?:Bluetooth|Speaker|Wireless|Portable|Bass|Pedal|Effect|Gatorade|Powder)[^"']{0,120})["']/gi
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(decoded))) pushAmazonTitleCandidate(values, m[1] || "");
  }

  // Last resort: look at stripped visible text for product-like lines.
  const text = decoded
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\s+/g, " ");
  const visibleRe = /([A-Za-z0-9][A-Za-z0-9 '\-–—,&()]{10,220}\b(?:Bluetooth|Speaker|Wireless|Portable|Bass|Pedal|Effect|Gatorade|Powder|Cooling|Bottle|Book)\b[A-Za-z0-9 '\-–—,&()]{0,160})/gi;
  let vm;
  while ((vm = visibleRe.exec(text))) pushAmazonTitleCandidate(values, vm[1] || "");

  const unique = [...new Map(values.map(v => [v.toLowerCase(), v])).values()];
  unique.sort((a, b) => amazonTitleScore(b) - amazonTitleScore(a));
  return unique[0] || "";
}

function titleFromAmazonQuery(url = "") {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("keywords") || parsed.searchParams.get("k") || parsed.searchParams.get("field-keywords") || parsed.searchParams.get("rh") || "";
    const clean = String(raw || "").replace(/[+,|]+/g, " ").replace(/\s+/g, " ").trim();
    if (!clean || clean.length < 4) return "";
    return clean.replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch { return ""; }
}

function pickAmazonAttrTitle(html = "") {
  const values = [];
  const tagRe = /<(?:img|span|h1|div|input)\b[^>]*(?:alt|title|aria-label|value)=['"]([^'"]{8,360})['"][^>]*>/gi;
  let match;
  while ((match = tagRe.exec(String(html || "")))) {
    const value = decodeLooseJsonString(match[1] || "").replace(/\s+/g, " ").trim();
    if (looksLikeUsefulAmazonTitle(value)) values.push(value);
  }
  values.sort((a, b) => {
    const score = (v) => (/speaker|bluetooth|portable|wireless|product|effect|pedal|gatorade|powder|pack/i.test(v) ? 10 : 0) + Math.min(80, v.length);
    return score(b) - score(a);
  });
  return values[0] || "";
}

function pickAmazonProductTitle(html = "") {
  const candidates = [
    pickById(html, "productTitle"),
    pickJsonLdProductName(html),
    pickAmazonVisibleTitle(html),
    decodeLooseJsonString(html.match(/"productTitle"\s*:\s*"([^"\n]{3,300})"/i)?.[1] || ""),
    decodeLooseJsonString(html.match(/"titleDisplay"\s*:\s*"([^"\n]{3,300})"/i)?.[1] || ""),
    decodeLooseJsonString(html.match(/"displayTitle"\s*:\s*"([^"\n]{3,300})"/i)?.[1] || ""),
    decodeLooseJsonString(html.match(/"item_name"\s*:\s*"([^"\n]{3,300})"/i)?.[1] || ""),
    decodeLooseJsonString(html.match(/"name"\s*:\s*"([^"\n]{3,300})"/i)?.[1] || ""),
    pickAmazonAttrTitle(html),
    decodeLooseJsonString(html.match(/"title"\s*:\s*"([^"\n]{3,300})"/i)?.[1] || "")
  ];
  return candidates
    .map((value) => cleanAmazonTitleCandidate(value || ""))
    .filter(looksLikeUsefulAmazonTitle)
    .sort((a, b) => amazonTitleScore(b) - amazonTitleScore(a))[0] || "";
}

function pickTitle(html) {
  return (
    pickMeta(html, ["og:title", "twitter:title"]) ||
    pickById(html, "productTitle") ||
    pickJsonLdProductName(html) ||
    pickById(html, "title") ||
    decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")
  );
}

function absolutize(candidate, baseUrl) {
  try { return new URL(candidate, baseUrl).toString(); } catch { return ""; }
}

function numericAttr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']?(\\d{2,5})["']?`, "i"));
  return match ? Number(match[1]) || 0 : 0;
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] || "";
}

function bestFromSrcset(srcset = "", baseUrl) {
  const candidates = String(srcset)
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const pieces = part.split(/\s+/);
      const url = absolutize(pieces[0], baseUrl);
      const descriptor = pieces[1] || "";
      const width = descriptor.endsWith("w") ? Number(descriptor.replace(/\D/g, "")) || 0 : 0;
      return { url, width };
    })
    .filter((item) => item.url);
  candidates.sort((a, b) => b.width - a.width);
  return candidates[0]?.url || "";
}

function amazonDynamicImage(src = "") {
  const decoded = decodeEntities(src).replace(/&quot;/g, '"');

  // Amazon stores a JSON-ish object in data-a-dynamic-image where keys are image URLs.
  const quotedUrls = [...decoded.matchAll(/"(https?:\\?\/\\?\/[^"\\]+)"/g)].map((m) => m[1]);
  const looseUrls = decoded.match(/https?:\\?\/\\?\/[^"'\s{}]+/g) || [];
  const urls = [...quotedUrls, ...looseUrls]
    .map((url) => url.replace(/\\\//g, "/"))
    .filter(Boolean);

  urls.sort((a, b) => {
    const score = (u) => {
      const nums = u.match(/\b\d{3,5}\b/g)?.map(Number) || [];
      return nums.length ? Math.max(...nums) : 0;
    };
    return score(b) - score(a);
  });
  return urls[0] || "";
}


function normalizeCandidateImageUrl(url = "") {
  let value = decodeEntities(String(url || ""))
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/")
    .replace(/\\/g, "")
    .trim();
  value = value.replace(/^["'([{]+|["')\]}>,;]+$/g, "");
  value = value.replace(/&amp;/g, "&");
  try {
    const parsed = new URL(value);
    // Amazon image URLs often carry useful sizing modifiers in the pathname. Keep
    // the path intact, but drop tracking query strings so crawlers/cache behave.
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function isAmazonImageHost(url = "") {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === "m.media-amazon.com"
      || host === "images-na.ssl-images-amazon.com"
      || host.endsWith(".ssl-images-amazon.com")
      || host === "images.amazon.com";
  } catch {
    return false;
  }
}

function imagePixelGuess(url = "") {
  const nums = [];
  const value = String(url || "");
  for (const match of value.matchAll(/_(?:AC_)?(?:SL|SX|SY|UX|UY|UL|US)(\d{2,5})_/gi)) nums.push(Number(match[1]));
  for (const match of value.matchAll(/[._-](\d{2,5})x(\d{2,5})(?:[._-]|$)/gi)) {
    nums.push(Number(match[1]), Number(match[2]));
  }
  return nums.length ? Math.max(...nums.filter(Boolean)) : 0;
}

function isTinyOrTrackingImage(url = "") {
  const value = String(url || "").toLowerCase();
  if (!value) return true;
  if (/1x1|pixel|spacer|transparent|blank|beacon|tracking|grey-pixel|grey_pixel|clear\.gif|empty|loader|sprite|favicon|logo|nav-|stars?|rating|badge|icon/.test(value)) return true;
  if (/\.gif(?:[?#]|$)/i.test(value)) return true;
  const guessed = imagePixelGuess(value);
  return guessed > 0 && guessed < 120;
}

function amazonImageScore(url = "") {
  const normalized = normalizeCandidateImageUrl(url);
  if (!normalized || !isAmazonImageHost(normalized) || isTinyOrTrackingImage(normalized)) return -999999;
  const lower = normalized.toLowerCase();
  let score = 0;
  if (/\/images\/I\//i.test(normalized)) score += 5000;
  if (/\/images\/P\//i.test(normalized)) score += 1800;
  if (/m\.media-amazon\.com/i.test(normalized)) score += 800;
  if (/\.jpe?g(?:$|[?#])/i.test(normalized)) score += 700;
  if (/\.png(?:$|[?#])/i.test(normalized)) score += 250;
  if (/\.webp(?:$|[?#])/i.test(normalized)) score += 250;
  if (/hires|hi-res|large|landingimage|imageblock|main|front|primary|variant/i.test(lower)) score += 600;
  if (/thumb|thumbnail|swatch|sprite|logo|icon|pixel|transparent|blank/i.test(lower)) score -= 3000;
  score += Math.min(imagePixelGuess(normalized), 2000);
  score += Math.min(normalized.length, 350) / 10;
  return score;
}

function collectAmazonImageUrls(value = "") {
  const text = decodeEntities(String(value || ""))
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/");
  const urls = new Set();
  const patterns = [
    /https?:\/\/(?:m\.media-amazon\.com|images-na\.ssl-images-amazon\.com|[^"'\s<>\\]+\.ssl-images-amazon\.com)\/images\/[IP]\/[^"'\s<>\\]+/gi,
    /https?:\/\/(?:m\.media-amazon\.com|images-na\.ssl-images-amazon\.com|[^"'\s<>\\]+\.ssl-images-amazon\.com)\/[^"'\s<>\\]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>\\]*)?/gi
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const cleaned = normalizeCandidateImageUrl(match[0]);
      if (cleaned) urls.add(cleaned);
    }
  }
  return [...urls];
}

function pickBestAmazonProductImage(html = "") {
  const candidates = new Set();

  // 1) Amazon's most reliable field: data-a-dynamic-image JSON on the landing image.
  const imgRe = /<img\b[^>]*>/gi;
  let img;
  while ((img = imgRe.exec(html))) {
    const tag = img[0];
    const dynamic = attr(tag, "data-a-dynamic-image");
    for (const u of collectAmazonImageUrls(dynamic)) candidates.add(u);
    for (const field of ["data-old-hires", "data-a-hires", "src", "data-src", "srcset", "data-srcset"]) {
      for (const u of collectAmazonImageUrls(attr(tag, field))) candidates.add(u);
    }
  }

  // 2) Embedded JSON: imageGalleryData / colorImages.initial / hiRes / large.
  for (const u of collectAmazonImageUrls(html)) candidates.add(u);

  // 3) Open Graph/Twitter meta, but only if it is a real Amazon media image.
  const metaImage = pickMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  for (const u of collectAmazonImageUrls(metaImage)) candidates.add(u);

  const ranked = [...candidates]
    .map((url) => ({ url: normalizeCandidateImageUrl(url), score: amazonImageScore(url) }))
    .filter((item) => item.url && item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.url || "";
}


function pickBestAmazonProductImages(html = "", limit = 8) {
  const candidates = new Set();
  const imgRe = /<img\b[^>]*>/gi;
  let img;
  while ((img = imgRe.exec(html))) {
    const tag = img[0];
    for (const field of ["data-a-dynamic-image", "data-old-hires", "data-a-hires", "src", "data-src", "srcset", "data-srcset"]) {
      for (const u of collectAmazonImageUrls(attr(tag, field))) candidates.add(u);
    }
  }
  for (const u of collectAmazonImageUrls(html)) candidates.add(u);
  const metaImage = pickMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  for (const u of collectAmazonImageUrls(metaImage)) candidates.add(u);
  return [...candidates]
    .map((url) => ({ url: normalizeCandidateImageUrl(url), score: amazonImageScore(url) }))
    .filter((item) => item.url && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.url)
    .filter((url, index, arr) => arr.indexOf(url) === index)
    .slice(0, limit);
}

function pickGenericProductImages(html = "", baseUrl = "", limit = 8) {
  const candidates = [];
  const add = (raw, score = 0) => {
    const url = absolutize(raw, baseUrl);
    if (!url || isLikelyBadProductImage(url) || isBadRetailImage(url)) return;
    if (/\.svg(?:[?#]|$)|base64|sprite|avatar|logo|icon|pixel|blank|transparent|loading/i.test(url)) return;
    candidates.push({ url, score: score + imagePixelGuess(url) });
  };
  const metaImage = pickMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  if (metaImage) add(metaImage, 5000);
  const imgRe = /<img\b[^>]*>/gi;
  let img;
  while ((img = imgRe.exec(html))) {
    const tag = img[0];
    const width = numericAttr(tag, "width");
    const height = numericAttr(tag, "height");
    let score = (width * 2) + height;
    if (/product|main|hero|landing|primary|imageblock|hires|large/i.test(tag)) score += 1200;
    if (/thumb|thumbnail|swatch|badge|review|star|rating|sprite|nav-/i.test(tag)) score -= 700;
    add(bestFromSrcset(attr(tag, "srcset") || attr(tag, "data-srcset"), baseUrl), score + 250);
    for (const field of ["data-old-hires", "data-a-hires", "data-src", "src"]) add(attr(tag, field), score);
  }
  return candidates
    .sort((a, b) => b.score - a.score)
    .map((item) => item.url)
    .filter((url, index, arr) => arr.indexOf(url) === index)
    .slice(0, limit);
}

function pickLargestImage(html, baseUrl) {
  const candidates = [];
  const imgRe = /<img\b[^>]*>/gi;
  let img;
  while ((img = imgRe.exec(html))) {
    const tag = img[0];
    const rawSrc =
      amazonDynamicImage(attr(tag, "data-a-dynamic-image")) ||
      attr(tag, "data-old-hires") ||
      attr(tag, "data-a-hires") ||
      bestFromSrcset(attr(tag, "srcset") || attr(tag, "data-srcset"), baseUrl) ||
      attr(tag, "data-src") ||
      attr(tag, "src");

    const url = absolutize(rawSrc, baseUrl);
    if (!url || /sprite|logo|icon|avatar|pixel|blank|transparent|loading/i.test(url)) continue;

    const width = numericAttr(tag, "width");
    const height = numericAttr(tag, "height");
    let score = (width * 2) + height;
    if (width >= 300) score += 500;
    if (height >= 300) score += 400;
    if (/product|main|hero|landing|primary|imageblock|hires|large|imgBlkFront|landingImage/i.test(tag + " " + url)) score += 1000;
    if (/thumb|thumbnail|swatch|badge|review|star|rating|sprite|nav-/i.test(tag + " " + url)) score -= 500;
    if (/\.svg(?:\?|$)|base64/i.test(url)) score -= 1000;
    candidates.push({ url, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url || "";
}

function extractRefreshUrl(html, baseUrl) {
  const match = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"';>]+)["'][^>]*>/i);
  return match ? absolutize(decodeEntities(match[1]), baseUrl) : "";
}

function extractAsin(url = "") {
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname);
    const direct = path.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?#]|$)/i)?.[1];
    if (direct) return direct.toUpperCase();
    const q = parsed.searchParams.get("asin") || parsed.searchParams.get("ASIN");
    if (q && /^[A-Z0-9]{10}$/i.test(q)) return q.toUpperCase();
    const segment = path.split("/").find((part) => /^[A-Z0-9]{10}$/i.test(part));
    return segment ? segment.toUpperCase() : "";
  } catch {
    return "";
  }
}

function isBadAutoTitle(title = "") {
  const text = String(title || "").replace(/\s+/g, " ").trim();
  if (!text) return true;
  if (/^(gp|aw|dp|d|c|s|ref|sp|nav|search|node|product|products|amazon|www)$/i.test(text)) return true;
  if (/^[a-z]{1,3}$/i.test(text)) return true;
  if (/^[a-z0-9]{1,5}$/i.test(text) && !/\s/.test(text)) return true;
  if (/^(robot or human\??|blocked|access denied|are you a human\??|verify you are human|captcha|page not found|not found|unavailable)$/i.test(text)) return true;
  if (/robot or human|blocked|access denied|captcha|verify you are human|unusual traffic|bot detection|automated access/i.test(text)) return true;
  return false;
}

function cleanAutoTitle(title = "") {
  const text = String(title || "").replace(/\s+/g, " ").trim();
  return isBadAutoTitle(text) ? "" : text;
}

function titleFromAmazonUrl(url = "") {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const parts = path.split("/")
      .filter(Boolean)
      .map((part) => part.replace(/\.(?:html?|aspx?|php)$/i, ""))
      .filter(Boolean)
      .filter((part) => !/^(gp|aw|dp|d|c|s|ref|sp|nav|search|node|product|products|hz|stores?)$/i.test(part))
      .filter((part) => !/^[A-Z0-9]{10}$/i.test(part))
      .filter((part) => !/^\d{4,}$/.test(part));
    const best = parts
      .map((part) => ({ part, score: part.length + ((part.match(/[-_+]/g) || []).length * 8) + (/speaker|bluetooth|wireless|portable|bass|pedal|effect|gatorade|powder/i.test(part) ? 30 : 0) }))
      .sort((a, b) => b.score - a.score)[0]?.part || "";
    if (!best) return "";
    return cleanAutoTitle(best
      .replace(/[-_+]+/g, " ")
      .replace(/\w/g, (letter) => letter.toUpperCase())
      .replace(/\s+/g, " ")
      .trim());
  } catch {
    return "";
  }
}

function amazonImageFallback(asin = "") {
  return asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SL500_.jpg` : "";
}

function isBadAmazonTitle(title = "") {
  return /robot check|captcha|sorry|page not found|amazon sign-in|automated access|api-services-support/i.test(title);
}

function isBadAmazonPage(html = "", title = "") {
  return isBadAmazonTitle(title) || /enter the characters you see below|type the characters you see in this image|automated access|robot check|captcha/i.test(html);
}

function isOpaqueBlockedTitle(title = "") {
  const text = String(title || "").replace(/\s+/g, " ").trim();
  return /^[a-z0-9]{6,12}$/i.test(text) && !/[aeiou]{2,}/i.test(text) && !/\s/.test(text);
}

function isBadRetailTitle(title = "") {
  const text = String(title || "").trim();
  return isBadAutoTitle(text) || isOpaqueBlockedTitle(text);
}

function isRetailProductPageUrl(url = "") {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if ((host === "amazon.com" || host.endsWith(".amazon.com")) && /\/(?:dp|gp\/aw\/d|gp\/product|product)\//.test(path)) return true;
    if ((host === "walmart.com" || host.endsWith(".walmart.com")) && /\/ip\//.test(path)) return true;
    if ((host === "target.com" || host.endsWith(".target.com")) && /\/p\//.test(path)) return true;
    return false;
  } catch {
    return false;
  }
}

function isBadRetailImage(url = "") {
  const value = String(url || "").trim();
  if (!value) return true;
  const lower = value.toLowerCase();
  // Product page URLs are not image URLs. This was causing Amazon pages like
  // https://www.amazon.com/gp/aw/d/ASIN to be saved as the image.
  if (isRetailProductPageUrl(value)) return true;
  return isTinyOrTrackingImage(value) || /blocked|captcha|robot|challenge|verify|access-denied|pixel|blank|transparent|sprite|logo|favicon/i.test(lower);
}

function isBadWalmartPage(html = "", title = "") {
  return isBadRetailTitle(title)
    || /robot or human|press and hold|verify you are human|blocked because of suspicious activity|are you a human/i.test(html);
}

function titleFromRetailUrl(url = "") {
  try {
    const parsed = new URL(url);
    const parts = decodeURIComponent(parsed.pathname)
      .split("/")
      .filter(Boolean)
      .map((part) => part.replace(/\.(?:html?|aspx?|php|gc)$/i, ""))
      .filter(Boolean)
      .filter((part) => !/^(ip|cp|c|browse|shop|product|products|search|used|new|open-box|used-gear|gp|aw|dp|d|ref|sp|nav|node|hz|store|stores)$/i.test(part))
      .filter((part) => !/^\d{4,}$/.test(part))
      .filter((part) => !/^[A-Z0-9]{10}$/i.test(part));
    const best = parts
      .map((part) => ({ part, score: part.length + ((part.match(/[-_]/g) || []).length * 8) + (/bass|limiter|pedal|effect|guitar|amp|keyboard|drum/i.test(part) ? 18 : 0) }))
      .sort((a, b) => b.score - a.score)[0]?.part || "";
    if (!best) return "";
    return cleanAutoTitle(best
      .replace(/[-_+]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .replace(/\s+/g, " ")
      .trim());
  } catch {
    return "";
  }
}


function inferProductTitleFromContext(description = "", finalUrl = "", requestedUrl = "") {
  const text = `${description || ""} ${finalUrl || ""} ${requestedUrl || ""}`.toLowerCase();
  if (/bluetooth|speaker|audio|wireless/.test(text)) return "Bluetooth Speaker";
  if (/gatorade|powder|hydration|electrolyte/.test(text)) return "Gatorade Powder";
  if (/bass|pedal|effect|guitar|amp/.test(text)) return "Bass Gear";
  if (/book|reading/.test(text)) return "Book";
  return "";
}

function isWeakPreviewTitleForUrl(title = "", url = "") {
  const clean = String(title || "").replace(/\s+/g, " ").trim();
  if (!clean || isBadRetailTitle(clean)) return true;
  const host = hostOf(url).replace(/[^a-z0-9]/g, "");
  const loose = clean.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (host && loose && (host.includes(loose) || loose.includes(host))) return true;
  const urlTitle = titleFromRetailUrl(url);
  const urlLoose = urlTitle.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return Boolean(urlLoose && loose && urlLoose.includes(loose) && urlLoose.length >= loose.length + 8);
}

async function readLimitedHtml(response) {
  const reader = response.body?.getReader?.();
  if (!reader) return "";
  const chunks = [];
  let received = 0;
  while (received < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchHtml(rawUrl, signal, headers = BROWSER_HEADERS) {
  const response = await fetch(rawUrl, {
    signal,
    redirect: "follow",
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const html = contentType.includes("text/html") || contentType === "" ? await readLimitedHtml(response) : "";
  return { response, html, finalUrl: response.url || rawUrl, contentType };
}

function extractPreview(html, finalUrl, requestedUrl) {
  const safeFinalUrl = publicFinalUrl(finalUrl, requestedUrl);
  let title = pickTitle(html);
  let description = pickMeta(html, ["og:description", "twitter:description", "description"]);
  const isAmazonPreview = isAmazonHost(finalUrl) || isAmazonHost(requestedUrl);
  let imageCandidates = isAmazonPreview
    ? pickBestAmazonProductImages(html, 8)
    : pickGenericProductImages(html, finalUrl, 8);
  let image = imageCandidates[0] || "";
  image = image || absolutize(
    pickMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]),
    finalUrl
  ) || pickLargestImage(html, finalUrl);
  if (image && !imageCandidates.includes(image) && !isBadRetailImage(image)) imageCandidates.unshift(image);

  const walmartBlocked = (isWalmartHost(finalUrl) || isWalmartHost(requestedUrl)) && isBadWalmartPage(html, title);
  if (walmartBlocked) {
    const fallbackTitle = titleFromRetailUrl(requestedUrl) || titleFromRetailUrl(safeFinalUrl) || titleFromRetailUrl(finalUrl);
    return {
      title: fallbackTitle,
      description: "",
      image: "",
      finalUrl: safeFinalUrl,
      blocked: true,
      blockedReason: isWalmartBlockedUrl(finalUrl) ? "walmart_blocked_url_preserved_original" : "walmart_robot_or_human",
      images: []
    };
  }

  const urlDerivedTitle = titleFromRetailUrl(requestedUrl) || titleFromRetailUrl(safeFinalUrl) || titleFromRetailUrl(finalUrl);
  if (isBadRetailTitle(title) || isWeakPreviewTitleForUrl(title, requestedUrl) || isWeakPreviewTitleForUrl(title, finalUrl)) title = urlDerivedTitle || title;
  if (isBadRetailImage(image)) image = "";

  if (isAmazonPreview) {
    const amazonTitle = pickAmazonProductTitle(html);
    if (isBadAmazonPage(html, title)) {
      title = amazonTitle && !isBadAmazonTitle(amazonTitle) ? amazonTitle : "";
      description = "";
      image = "";
    }
    const asin = extractAsin(finalUrl) || extractAsin(requestedUrl);
    const amazonImages = pickBestAmazonProductImages(html, 8);
    const amazonImage = amazonImages[0] || "";
    if (amazonImages.length) imageCandidates = amazonImages;
    title = cleanAutoTitle(title && !isBadAmazonTitle(title) ? title : (amazonTitle || titleFromAmazonUrl(finalUrl) || titleFromAmazonUrl(requestedUrl) || titleFromAmazonQuery(finalUrl) || titleFromAmazonQuery(requestedUrl)));
    if (!title && image) title = inferProductTitleFromContext(description, finalUrl, requestedUrl);
    // Prefer a real Amazon media URL found in the product page. The old ASIN
    // fallback can return blank/tiny placeholders for variants, so only use it
    // as the absolute last resort.
    image = amazonImage || (!isBadRetailImage(image) ? image : "") || amazonImageFallback(asin);
    if (isBadRetailImage(image)) image = "";
  }

  imageCandidates = (imageCandidates || [])
    .filter((url) => url && !isBadRetailImage(url) && !isLikelyBadProductImage(url))
    .filter((url, index, arr) => arr.indexOf(url) === index)
    .slice(0, 8);

  title = cleanAutoTitle(title);
  return { title, description, image, images: imageCandidates, finalUrl: safeFinalUrl };
}


function cleanImageRescueQuery(value = "") {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b(?:amazon|walmart|guitar center|target|best buy|ebay)\b\s*[:|-]?/gi, " ")
    .replace(/[^a-z0-9\s'&+.-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function isUsableRescueImage(url = "") {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return false;
    const hostPath = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
    if (/logo|sprite|favicon|icon|pixel|tracking|beacon|placeholder|blank/.test(hostPath)) return false;
    if (/\.svg(?:$|[?#])/i.test(parsed.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeBraveImageResult(result = {}) {
  return result?.properties?.url
    || result?.thumbnail?.src
    || result?.thumbnail?.original
    || result?.url
    || result?.meta_url?.path
    || "";
}

function rescueImageIdForUrl(rawUrl = "") {
  return crypto.createHash("sha256").update(String(rawUrl || "")).digest("hex").slice(0, 24);
}

function absoluteHostUrl(req, path = "/") {
  const host = req.get("x-forwarded-host") || req.get("host") || "shareshuffle.com";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}${path}`;
}

async function readRescueImageCache(id = "") {
  if (!/^[a-f0-9]{24}$/.test(String(id || ""))) return null;
  const file = storage.bucket().file(`rescue-images/${id}`);
  try {
    const [exists] = await file.exists();
    if (!exists) return null;
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();
    return { buffer, contentType: metadata.contentType || "image/jpeg" };
  } catch (error) {
    console.warn("Rescue image cache read failed", id, error);
    return null;
  }
}

async function cacheRescueImage(rawUrl = "", signal) {
  if (!isUsableRescueImage(rawUrl) || isLikelyBadProductImage(rawUrl)) return null;
  const id = rescueImageIdForUrl(rawUrl);
  const cached = await readRescueImageCache(id);
  if (cached?.buffer?.length) return { id, contentType: cached.contentType, bytes: cached.buffer.length, cached: true };

  const fetched = await fetchImageBuffer(rawUrl, signal);
  let meta = {};
  try { meta = await sharp(fetched.buffer).metadata(); } catch {}
  const width = Number(meta.width || 0);
  const height = Number(meta.height || 0);
  if (width && height && (width < 180 || height < 180)) throw new Error(`Rescue image too small: ${width}x${height}`);

  await storage.bucket().file(`rescue-images/${id}`).save(fetched.buffer, {
    resumable: false,
    metadata: {
      contentType: fetched.contentType,
      cacheControl: "public, max-age=604800",
      metadata: { originalUrl: String(rawUrl).slice(0, 500) }
    }
  });
  return { id, contentType: fetched.contentType, bytes: fetched.buffer.length, cached: false };
}

export const imageRescue = onRequest(
  {
    invoker: "public",
    secrets: [BRAVE_SEARCH_API_KEY],
    cors: [
      "https://shareshuffle.com",
      "https://www.shareshuffle.com",
      "https://shfl.me",
      "https://www.shfl.me",
      "https://shareshuffle-c7f96.web.app",
      "http://localhost:5000",
      "http://localhost:5173"
    ],
    timeoutSeconds: 12,
    memory: "256Mi"
  },
  async (req, res) => {
    if (req.method === "OPTIONS") return sendJson(res, 204, {});
    if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

    const q = cleanImageRescueQuery(req.query.q || "");
    const count = Math.min(50, Math.max(10, Number(req.query.count || 50) || 50));
    const debug = String(req.query.debug || "") === "1";
    if (!q || q.length < 3) return sendJson(res, 400, { error: "Missing image search query" });

    const key = BRAVE_SEARCH_API_KEY.value();
    if (!key) return sendJson(res, 200, { ok: true, configured: false, q, images: [], candidates: [] });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 11000);
    try {
      const url = new URL("https://api.search.brave.com/res/v1/images/search");
      url.searchParams.set("q", q);
      url.searchParams.set("count", String(count));
      url.searchParams.set("safesearch", "strict");
      const response = await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "X-Subscription-Token": key
        }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return sendJson(res, 200, {
          ok: false,
          configured: true,
          q,
          images: [],
          candidates: [],
          error: payload?.error || payload?.message || `Brave image search failed (${response.status})`
        });
      }

      const rawResults = Array.isArray(payload?.results) ? payload.results : [];
      const seen = new Set();
      const candidates = [];
      const rejected = [];

      for (const result of rawResults) {
        const rawImage = normalizeBraveImageResult(result);
        const image = String(rawImage || "").trim();
        if (!image) {
          if (debug) rejected.push({ reason: "missing image url" });
          continue;
        }
        if (seen.has(image)) {
          if (debug) rejected.push({ url: image, reason: "duplicate" });
          continue;
        }
        seen.add(image);
        if (!isUsableRescueImage(image) || isLikelyBadProductImage(image)) {
          if (debug) rejected.push({ url: image, reason: "obvious bad image url" });
          continue;
        }
        candidates.push({
          image,
          previewUrl: image,
          cachedUrl: "",
          title: String(result?.title || result?.properties?.title || "").slice(0, 180),
          source: String(result?.source || result?.meta_url?.hostname || result?.page_fetched || "").slice(0, 140)
        });
        if (candidates.length >= 5) break;
      }

      return sendJson(res, 200, {
        ok: true,
        configured: true,
        mode: "preview-candidates",
        q,
        searched: rawResults.length,
        usable: candidates.length,
        rejected: debug ? rejected.length : Math.max(0, rawResults.length - candidates.length),
        images: candidates.map((item) => item.image),
        candidates,
        note: "Preview candidates are used only for the chooser. The selected image is cached when the share is created.",
        ...(debug ? { rejectedDetails: rejected.slice(0, 25) } : {})
      });
    } catch (error) {
      console.warn("Image rescue failed", error);
      return sendJson(res, 200, { ok: false, configured: true, q, images: [], candidates: [], error: error?.name === "AbortError" ? "Image rescue timed out" : "Image rescue failed" });
    } finally {
      clearTimeout(timer);
    }
  }
);

export const rescueImage = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 15,
    memory: "512Mi"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }
    const path = String(req.path || req.url || "").split("?")[0];
    const last = path.split("/").filter(Boolean).pop() || "";
    const id = String(req.query.id || last.replace(/^rimg-/i, "")).trim().toLowerCase();
    const cached = await readRescueImageCache(id);
    if (!cached?.buffer?.length) {
      res.redirect(302, "/assets/no-product-image.svg");
      return;
    }
    res.set("Cache-Control", "public, max-age=604800, s-maxage=604800, immutable");
    res.set("Content-Type", cached.contentType || "image/jpeg");
    res.status(200).send(cached.buffer);
  }
);

export const getPreview = onRequest(
  {
    invoker: "public",
    cors: [
      "https://shareshuffle.com",
      "https://www.shareshuffle.com",
      "https://shfl.me",
      "https://www.shfl.me",
      "https://shareshuffle.com/shelf.html",
      "https://www.shareshuffle.com/shelf.html",
      "https://shareshuffle-c7f96.web.app",
      "http://localhost:5000",
      "http://localhost:5173"
    ],
    timeoutSeconds: 15,
    memory: "256Mi"
  },
  async (req, res) => {  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  const rawInputUrl = String(req.query.url || "").trim();
  const rawUrl = decodeWalmartBlockedUrl(rawInputUrl) || rawInputUrl;
  if (!isAllowedUrl(rawUrl)) return sendJson(res, 400, { error: "Unsupported URL" });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let { response, html, finalUrl, contentType } = await fetchHtml(rawUrl, controller.signal, BROWSER_HEADERS);

    // Some shorteners use meta refresh instead of a plain HTTP redirect.
    const refreshUrl = extractRefreshUrl(html, finalUrl);
    if (refreshUrl && isAllowedUrl(refreshUrl)) {
      ({ response, html, finalUrl, contentType } = await fetchHtml(refreshUrl, controller.signal, BROWSER_HEADERS));
    }

    // Amazon sometimes gives a desktop bot/interstitial page to server fetches.
    // Try the mobile product page before falling back to the final URL/ASIN.
    const preliminaryTitle = pickTitle(html);
    if ((isAmazonHost(finalUrl) || isAmazonHost(rawUrl)) && isBadAmazonPage(html, preliminaryTitle)) {
      const asin = extractAsin(finalUrl) || extractAsin(rawUrl);
      if (asin) {
        const mobileUrl = `https://www.amazon.com/gp/aw/d/${asin}`;
        const mobileResult = await fetchHtml(mobileUrl, controller.signal, MOBILE_HEADERS);
        const mobileTitle = pickTitle(mobileResult.html);
        if (mobileResult.html && !isBadAmazonPage(mobileResult.html, mobileTitle)) {
          html = mobileResult.html;
          finalUrl = mobileResult.finalUrl || mobileUrl;
          response = mobileResult.response;
          contentType = mobileResult.contentType;
        }
      }
    }

    if (!html && !contentType.includes("text/html")) {
      return sendJson(res, 415, { error: "URL did not return HTML", finalUrl, contentType });
    }

    const preview = extractPreview(html, finalUrl, rawUrl);
    return sendJson(res, 200, {
      ...preview,
      requestedUrl: rawUrl,
      rawInputUrl,
      contentType,
      status: response.status,
      ok: response.ok
    });
  } catch (error) {
    return sendJson(res, 502, { error: "Could not fetch preview", detail: String(error?.message || error) });
  } finally {
    clearTimeout(timer);
  }
});



function isLikelyBadProductImage(url = "") {
  const value = String(url || "").toLowerCase();
  return !value || /sprite|logo|icon|avatar|pixel|blank|transparent|loading|favicon|share-?shuffle|no-product-image|icon512|icon192|gift/i.test(value) || /\.svg(?:\?|$)|base64/.test(value);
}

function isPlaceholderCardShare(data = {}) {
  const status = String(data.imageStatus || "").toLowerCase();
  const source = String(data.imageSource || "").toLowerCase();
  const image = String(data.cachedImageUrl || data.cachedImage || data.image || data.imageUrl || "").toLowerCase();
  return status === "placeholder-card" || source.includes("placeholder") || image.includes("no-product-image.svg");
}

function shareDataImageField(data = {}) {
  if (isPlaceholderCardShare(data)) return "";
  const image = String(data.cachedImageUrl || data.cachedImage || data.image || data.imageUrl || "").trim();
  return isLikelyBadProductImage(image) ? "" : image;
}

async function normalizeCachedImageBuffer(fetched) {
  const input = fetched?.buffer || Buffer.alloc(0);
  if (!input.length) throw new Error("No image bytes to cache");
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  if (!output.length) throw new Error("Normalized image was empty");
  if (await isMostlyBlankImageBuffer(output)) throw new Error("Normalized image was blank or mostly white");
  return { buffer: output, contentType: "image/jpeg" };
}

async function saveCachedShareImageToFirestore(shareId, fetched, source = "url-firestore") {
  const normalized = await normalizeCachedImageBuffer(fetched);
  const base64 = normalized.buffer.toString("base64");
  if (base64.length > 850000) throw new Error("Image too large for Firestore cache");
  await db.collection("shares").doc(shareId).set({
    image: `/i-${shareId}`,
    cachedImagePath: "",
    cachedImageContentType: normalized.contentType,
    cachedImageBase64: base64,
    cachedImageBytes: normalized.buffer.length,
    imageStatus: "cached-firestore",
    imageSource: source,
    imageUpdatedAt: new Date(),
    updatedAt: new Date()
  }, { merge: true });
  return { ...normalized, source };
}

async function saveCachedShareImage(shareId, fetched, source = "url") {
  const normalized = await normalizeCachedImageBuffer(fetched);
  const cachePath = `share-images/${shareId}`;
  try {
    await storage.bucket().file(cachePath).save(normalized.buffer, {
      resumable: false,
      metadata: { contentType: normalized.contentType, cacheControl: "public, max-age=604800" }
    });
    await db.collection("shares").doc(shareId).set({
      image: `/i-${shareId}`,
      cachedImagePath: cachePath,
      cachedImageContentType: normalized.contentType,
      cachedImageBase64: "",
      cachedImageBytes: normalized.buffer.length,
      imageStatus: "cached",
      imageSource: source,
      imageUpdatedAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    return { ...normalized, source };
  } catch (storageError) {
    console.warn("Storage cache write failed; saving first-party Firestore image cache", shareId, storageError);
    return await saveCachedShareImageToFirestore(shareId, normalized, `${source}-firestore`);
  }
}

async function fetchBestImageRescue(originalUrl = "") {
  if (!isAllowedUrl(originalUrl)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let { response, html, finalUrl, contentType } = await fetchHtml(originalUrl, controller.signal, BROWSER_HEADERS);
    const refreshUrl = extractRefreshUrl(html, finalUrl);
    if (refreshUrl && refreshUrl !== finalUrl && isAllowedUrl(refreshUrl)) {
      ({ response, html, finalUrl, contentType } = await fetchHtml(refreshUrl, controller.signal, BROWSER_HEADERS));
    }

    const preliminaryTitle = pickTitle(html);
    if ((isAmazonHost(finalUrl) || isAmazonHost(originalUrl)) && isBadAmazonPage(html, preliminaryTitle)) {
      const asin = extractAsin(finalUrl) || extractAsin(originalUrl);
      if (asin) {
        const mobileUrl = `https://www.amazon.com/gp/aw/d/${asin}`;
        const mobileResult = await fetchHtml(mobileUrl, controller.signal, MOBILE_HEADERS);
        const mobileTitle = pickTitle(mobileResult.html);
        if (mobileResult.html && !isBadAmazonPage(mobileResult.html, mobileTitle)) {
          html = mobileResult.html;
          finalUrl = mobileResult.finalUrl || mobileUrl;
          response = mobileResult.response;
          contentType = mobileResult.contentType;
        }
      }
    }

    if (!html && !String(contentType || "").includes("text/html")) return null;
    const preview = extractPreview(html, finalUrl, originalUrl);
    const rescuedUrl = String(preview?.image || "").trim();
    if (!rescuedUrl || isLikelyBadProductImage(rescuedUrl) || !isAllowedUrl(rescuedUrl)) return null;

    const imageController = new AbortController();
    const imageTimer = setTimeout(() => imageController.abort(), TIMEOUT_MS);
    try {
      const fetched = await fetchImageBuffer(rescuedUrl, imageController.signal);
      return { fetched, preview, rescuedUrl };
    } finally {
      clearTimeout(imageTimer);
    }
  } catch (error) {
    console.warn("Image rescue lookup failed", originalUrl, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractImageShareId(req) {
  const path = String(req.path || req.url || "").split("?")[0];
  const parts = path.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  const last = parts[parts.length - 1] || "";
  const raw = parts[0] === "img" ? last : last.replace(/^(?:i-|~|-)/, "");
  const id = raw.trim().toLowerCase();
  return isPublicShareId(id) ? id : "";
}


function extractFirstPartyImageShareId(rawUrl = "") {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  try {
    const parsed = value.startsWith("/") ? new URL(value, "https://shfl.me") : new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const isShuffleHost = ["shfl.me", "shareshuffle.com", "shareshuffle-c7f96.web.app", "shareshuffle-c7f96.firebaseapp.com"].includes(host);
    if (!isShuffleHost) return "";
    const match = path.match(/^\/(?:img\/)?i-([a-z0-9]{5,})$/) || path.match(/^\/img\/([a-z0-9]{5,})$/);
    const id = match ? String(match[1] || "").toLowerCase() : "";
    return isPublicShareId(id) ? id : "";
  } catch {
    return "";
  }
}

async function isMostlyBlankImageBuffer(buffer) {
  try {
    const stats = await sharp(buffer).stats();
    const channels = stats.channels || [];
    const rgb = channels.slice(0, 3);
    if (rgb.length < 3) return false;
    const veryLight = rgb.every((channel) => Number(channel.mean || 0) > 245);
    const veryFlat = rgb.every((channel) => Number(channel.stdev || 0) < 8);
    const alpha = channels[3];
    const mostlyTransparent = alpha && Number(alpha.mean || 255) < 10;
    return Boolean((veryLight && veryFlat) || mostlyTransparent);
  } catch (error) {
    console.warn("Blank image check skipped", error);
    return false;
  }
}

function isMissingStorageBucketError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("bucket does not exist") || message.includes("specified bucket does not exist") || message.includes("not found");
}

async function markSharePlaceholder(shareId, source = "placeholder-after-cache-fail") {
  await db.collection("shares").doc(shareId).set({
    image: "",
    cachedImagePath: "",
    cachedImageContentType: "",
    cachedImageUrl: "",
    imageStatus: "placeholder-card",
    imageSource: source,
    imageUpdatedAt: new Date(),
    updatedAt: new Date()
  }, { merge: true });
}

async function fetchImageBuffer(rawUrl, signal) {
  const response = await fetch(rawUrl, {
    signal,
    redirect: "follow",
    headers: {
      "user-agent": BROWSER_HEADERS["user-agent"],
      "accept": "image/avif,image/webp,image/apng,image/png,image/jpeg,image/*,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9"
    }
  });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.startsWith("image/")) {
    throw new Error(`Image fetch failed: ${response.status} ${contentType}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) throw new Error("Image was empty");
  if (buffer.length > 2_000_000) throw new Error("Image was too large for first-pass cache");
  if (await isMostlyBlankImageBuffer(buffer)) throw new Error("Image was blank or mostly white");
  return { buffer, contentType };
}

function extractCardShareId(req) {
  const path = String(req.path || req.url || "").split("?")[0];
  const parts = path.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  const last = parts[parts.length - 1] || "";
  const id = last.replace(/^c-/i, "").trim().toLowerCase();
  return isPublicShareId(id) ? id : "";
}

async function readCachedShareImage(shareId, data = {}) {
  const inlineBase64 = String(data.cachedImageBase64 || "").trim();
  if (inlineBase64) {
    try {
      const buffer = Buffer.from(inlineBase64, "base64");
      if (buffer.length) return { buffer, contentType: data.cachedImageContentType || "image/jpeg", source: "firestore-cache" };
    } catch (error) {
      console.warn("Firestore cached image decode failed", shareId, error);
    }
  }

  const bucket = storage.bucket();
  const paths = [String(data.cachedImagePath || "").trim(), `share-images/${shareId}`].filter(Boolean);
  for (const cachePath of [...new Set(paths)]) {
    const file = bucket.file(cachePath);
    try {
      const [exists] = await file.exists();
      if (!exists) continue;
      const [metadata] = await file.getMetadata();
      const [buffer] = await file.download();
      return { buffer, contentType: metadata.contentType || "image/jpeg", source: "storage-cache" };
    } catch (error) {
      console.warn("Cached image read failed", shareId, error);
    }
  }
  return null;
}

async function getShareImageBuffer(shareId, data = {}) {
  if (isPlaceholderCardShare(data)) return null;
  const cached = await readCachedShareImage(shareId, data);
  if (cached) return cached;

  const rawImage = String(data.cachedImageUrl || data.cachedImage || data.image || data.imageUrl || "").trim();
  if (rawImage && !isLikelyBadProductImage(rawImage) && isAllowedUrl(rawImage)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const fetched = await fetchImageBuffer(rawImage, controller.signal);
      try {
        return await saveCachedShareImage(shareId, fetched, data.imageSource || "url");
      } catch (cacheError) {
        console.warn("Image cache write failed", shareId, cacheError);
        return { ...fetched, source: "fetched" };
      }
    } catch (error) {
      console.warn("Primary share image fetch failed", shareId, error);
    } finally {
      clearTimeout(timer);
    }
  }

  const sourceUrl = String(data.originalUrl || data.url || "").trim();
  if (!sourceUrl || !isAllowedUrl(sourceUrl)) return null;

  const rescued = await fetchBestImageRescue(sourceUrl);
  if (!rescued?.fetched) return null;

  try {
    const sourceLabel = isAmazonHost(sourceUrl) ? "preview-amazon" : "preview";
    return await saveCachedShareImage(shareId, rescued.fetched, sourceLabel);
  } catch (cacheError) {
    console.warn("Rescued image cache write failed", shareId, cacheError);
    return { ...rescued.fetched, source: "rescued" };
  }
}

function svgText(value = "") {
  return escapeHtml(String(value || "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim());
}

function wrapText(text = "", maxChars = 34, maxLines = 3) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:!?-]+$/g, "") + "…";
  }
  return lines;
}

function dataUriForImage(imageData) {
  if (!imageData?.buffer?.length) return "";
  const contentType = imageData.contentType || "image/jpeg";
  return `data:${contentType};base64,${imageData.buffer.toString("base64")}`;
}

async function makeSocialCardPng({ shareId, data, imageData }) {
  const title = cleanOgText(data.title || "Shared recommendation", 92);
  const note = cleanOgNote(data.note || data.description || "", 118);
  const merchant = cleanOgText(data.merchant || "", 30).toLowerCase();
  const handleDisplay = cleanOgText(data.handleDisplay || "", 30);
  const signature = handleDisplay ? `${handleDisplay} shared via Shuffle` : "Shared via Shuffle";
  const urlLabel = `shfl.me/${shareId}`;
  const imageHref = dataUriForImage(imageData);

  // Patch 51: keep every text element inside a safer right column. The old
  // card could look clipped in iMessage because 50px titles were wrapped by
  // character count but rendered wider than expected. Smaller type, tighter
  // wrapping, and a fixed safe margin make the card feel more like native
  // YouTube previews on phone-sized bubbles.
  const textX = 588;
  const titleLines = wrapText(title, 24, 3);
  const noteLines = wrapText(note, 40, 2);
  const titleTspans = titleLines.map((line, i) => `<tspan x="${textX}" dy="${i ? 48 : 0}">${svgText(line)}</tspan>`).join("");
  const noteTspans = noteLines.map((line, i) => `<tspan x="${textX}" dy="${i ? 30 : 0}">${svgText(line)}</tspan>`).join("");
  const fallbackImageTitle = wrapText(title || "Shared recommendation", 16, 3).map((line, i) => `<tspan x="300" dy="${i ? 40 : 0}">${svgText(line)}</tspan>`).join("");
  const imageBlock = imageHref
    ? `<rect x="74" y="102" width="452" height="384" rx="34" fill="#ffffff"/><image href="${imageHref}" x="108" y="132" width="384" height="324" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="74" y="102" width="452" height="384" rx="38" fill="#eef6ff"/><circle cx="454" cy="160" r="86" fill="#bfdbfe" opacity="0.72"/><circle cx="150" cy="455" r="108" fill="#fed7aa" opacity="0.74"/><rect x="110" y="138" width="378" height="274" rx="32" fill="#ffffff" opacity="0.85"/><text x="300" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#2563eb">Shared via Shuffle</text><text x="300" y="274" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="#172033">${fallbackImageTitle}</text><text x="300" y="444" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#475569">Clean recommendation card</text>`;
  const merchantWidth = Math.min(230, Math.max(92, merchant.length * 12 + 54));
  const merchantPill = merchant ? `<rect x="${textX}" y="480" width="${merchantWidth}" height="44" rx="22" fill="#dbeafe"/><text x="${textX + 26}" y="509" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="#1d4ed8">${svgText(merchant)}</text>` : "";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#EEF6FF"/><stop offset="1" stop-color="#FFF7ED"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.16"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="92" r="118" fill="#bfdbfe" opacity="0.50"/>
  <circle cx="142" cy="556" r="132" fill="#fed7aa" opacity="0.50"/>
  <g filter="url(#shadow)">${imageBlock}</g>
  <text x="${textX}" y="112" font-family="Arial, sans-serif" font-size="23" font-weight="850" fill="#2563eb">${svgText(signature)}</text>
  <text x="${textX}" y="180" font-family="Arial, sans-serif" font-size="43" font-weight="850" fill="#172033">${titleTspans}</text>
  ${noteLines.length ? `<text x="${textX}" y="365" font-family="Arial, sans-serif" font-size="24" font-style="italic" fill="#475569">${noteTspans}</text>` : ""}
  ${merchantPill}
  <text x="${textX}" y="568" font-family="Arial, sans-serif" font-size="25" font-weight="850" fill="#0f172a">${svgText(urlLabel)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

async function makeSquareFallbackPng({ shareId = "", data = {} } = {}) {
  const title = cleanOgText(data.title || "Shared recommendation", 80);
  const merchant = cleanOgText(data.merchant || "", 30);
  const titleLines = wrapText(title, 20, 4).map((line, i) => `<tspan x="450" dy="${i ? 52 : 0}">${svgText(line)}</tspan>`).join("");
  const merchantText = merchant ? `<text x="450" y="680" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="#1d4ed8">${svgText(merchant)}</text>` : "";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#EEF6FF"/><stop offset="1" stop-color="#FFF7ED"/></linearGradient></defs>
  <rect width="900" height="900" rx="70" fill="url(#bg)"/>
  <circle cx="745" cy="150" r="150" fill="#bfdbfe" opacity="0.66"/>
  <circle cx="130" cy="760" r="170" fill="#fed7aa" opacity="0.72"/>
  <rect x="90" y="110" width="720" height="600" rx="52" fill="#ffffff" opacity="0.86"/>
  <text x="450" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#2563eb">Shared via Shuffle</text>
  <text x="450" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="900" fill="#172033">${titleLines}</text>
  ${merchantText}
  <text x="450" y="790" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#475569">${svgText(shareId ? `shfl.me/${shareId}` : "Recommendation card")}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

function sendFallbackImage(res) {
  res.redirect(302, "/assets/no-product-image.svg");
}

const DEFAULT_PREVIEW_IMAGE = "https://shareshuffle.com/assets/no-product-image.svg";

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteUrl(req, path = "/") {
  const host = String(req.get("x-forwarded-host") || req.get("host") || "shareshuffle.com").toLowerCase();
  const proto = String(req.get("x-forwarded-proto") || "https").split(",")[0];
  if (/^https?:\/\//i.test(path)) return path;
  return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

const APP_BASE_URL = "https://shareshuffle.com";

function appUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${APP_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const PUBLIC_TOKEN_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

function hasEncodedSlash(value = "") {
  return /%2f|%5c/i.test(String(value || ""));
}

function safeDecodePathSegment(value = "") {
  const raw = String(value || "").trim();
  if (!raw || hasEncodedSlash(raw)) return "";
  try { return decodeURIComponent(raw); } catch { return ""; }
}

function slugifyPublicToken(value = "", max = 64) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[._/\\]+/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

function normalizeToken(value = "") {
  return slugifyPublicToken(value, 64);
}

function isValidPublicToken(value = "") {
  const token = String(value || "").trim().toLowerCase();
  return PUBLIC_TOKEN_RE.test(token) && !token.includes("--") && !/[._/%\\]/.test(token);
}

function normalizeHandleToken(value = "") {
  return slugifyPublicToken(value, 40);
}

function normalizeShelfToken(value = "") {
  return slugifyPublicToken(value, 64);
}

function isForbiddenHandleInput(value = "") {
  const raw = String(value || "").trim();
  return hasEncodedSlash(raw) || /[._/\\]/.test(raw);
}

function publicRouteSegment(raw = "", { allowAt = false } = {}) {
  const decoded = safeDecodePathSegment(raw);
  if (!decoded) return "";
  const withoutAt = allowAt ? decoded.replace(/^@+/, "") : decoded;
  const token = slugifyPublicToken(withoutAt, 64);
  const rawComparable = withoutAt.trim().toLowerCase();
  // Public paths should already be canonical: letters, numbers, hyphens only.
  // Do not silently accept dots, underscores, spaces, or encoded slashes in public URLs.
  if (token !== rawComparable || !isValidPublicToken(token)) return "";
  return token;
}

function isPublicShareId(value = "") {
  return /^[23456789abcdefghjkmnpqrstuvwxyz]{5}$/i.test(String(value || "").trim());
}

function normalizeFriendlyPunctuation(value = "") {
  return String(value || "")
    .replace(/[？]/g, "?")
    .replace(/[！]/g, "!")
    .replace(/\s+([?.!,;:!?])/g, "$1")
    .replace(/\s+([？！，；：])/g, "$1")
    .replace(/([!?])\s+([!?])/g, "$1$2")
    .replace(/([！？])\s+([！？])/g, "$1$2")
    .replace(/！\s*？/g, "!?")
    .replace(/？\s*！/g, "?!")
    .trim();
}

function stripWrappingQuotes(value = "") {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3; i += 1) {
    const next = text
      .replace(/^[\s"“”'‘’]+/, "")
      .replace(/[\s"“”'‘’]+$/, "")
      .trim();
    if (next === text) break;
    text = next;
  }
  return normalizeFriendlyPunctuation(text);
}

function cleanOgText(value = "", max = 180) {
  const text = decodeEntities(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/[\s,;:.-]+$/g, "") + "…";
}

function cleanOgNote(value = "", max = 180) {
  const text = stripWrappingQuotes(cleanOgText(value, max + 20));
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/[\s,;:.-]+$/g, "") + "…";
}

function imageForOg(req, rawImage = "", route = {}, preview = {}) {
  // For a share page, use a generated 1200×630 social card. The raw product
  // image still lives at /i-{id}, but previews should get a polished card at /c-{id}.
  if (route?.type === "share" && route.shareId) {
    const version = preview?.imageVersion ? `?v=${encodeURIComponent(preview.imageVersion)}` : "";
    return absoluteUrl(req, `/c-${route.shareId}${version}`);
  }
  if ((route?.type === "shelf" || route?.type === "profile") && (route.shelfSlug || route.handle)) {
    const params = new URLSearchParams();
    if (route.handle) params.set("u", route.handle);
    if (route.shelfSlug) params.set("s", route.shelfSlug);
    if (preview?.imageVersion) params.set("v", preview.imageVersion);
    return absoluteUrl(req, `/shelfCard?${params.toString()}`);
  }

  const image = String(rawImage || "").trim();
  if (!image || isLikelyBadProductImage(image)) return absoluteUrl(req, "/assets/no-product-image.svg");
  if (image.startsWith("/")) return absoluteUrl(req, image);
  if (/^https?:\/\//i.test(image)) {
    const host = hostOf(image);
    const ownHosts = new Set([
      "shareshuffle.com",
      "www.shareshuffle.com",
      "shfl.me",
      "www.shfl.me",
      "shareshuffle.com/shelf.html",
      "www.shareshuffle.com/shelf.html",
      "shareshuffle-c7f96.web.app",
      "shareshuffle-c7f96.firebaseapp.com"
    ]);
    if (ownHosts.has(host)) return image;
    return absoluteUrl(req, `/ogImage?url=${encodeURIComponent(image)}`);
  }
  return absoluteUrl(req, "/assets/no-product-image.svg");
}

function parsePublicRoute(pathname = "/") {
  const rawParts = String(pathname || "/").split("/").filter(Boolean);
  if (!rawParts.length) return { type: "home" };

  const rawFirst = rawParts[0] || "";
  const firstDecoded = safeDecodePathSegment(rawFirst).trim();
  const firstLower = firstDecoded.toLowerCase();

  // System routes must win before username/profile routes.
  // This prevents /img/a2c4e from being interpreted as user=img, shelf=a2c4e.
  if (["img", "app", "share.html", "shelf.html", "status.html", "_status", "_build", "getPreview", "ogImage", "uploadShareImage"].includes(firstLower)) {
    return { type: "system", canonicalPath: `/${rawParts.join("/")}` };
  }
  if (/^(?:i-|c-|~|-)[23456789abcdefghjkmnpqrstuvwxyz]{5}$/i.test(firstLower)) {
    const kind = firstLower.startsWith("c-") ? "card" : "image";
    return { type: kind, shareId: firstLower.replace(/^(?:i-|c-|~|-)/i, ""), canonicalPath: `/${firstLower}` };
  }

  if (rawParts.length === 1 && isPublicShareId(firstLower)) {
    return { type: "share", shareId: firstLower, canonicalPath: `/${firstLower}` };
  }

  if (firstDecoded.startsWith("@")) {
    const handle = publicRouteSegment(rawFirst, { allowAt: true });
    const second = rawParts[1] ? publicRouteSegment(rawParts[1]) : "";
    const third = rawParts[2] ? publicRouteSegment(rawParts[2]) : "";
    if (!handle) return { type: "invalid", canonicalPath: "/" };

    if (isPublicShareId(third)) return { type: "share", handle, shelfSlug: second, shareId: third, canonicalPath: `/@${handle}/${second}/${third}` };
    if (isPublicShareId(second)) return { type: "share", handle, shareId: second, canonicalPath: `/@${handle}/${second}` };
    if (second) return { type: "shelf", handle, shelfSlug: second, canonicalPath: `/@${handle}/${second}` };
    return { type: "profile", handle, canonicalPath: `/@${handle}` };
  }

  // Future no-@ routes. Root 5-char share IDs already win above.
  const handle = publicRouteSegment(rawFirst);
  const second = rawParts[1] ? publicRouteSegment(rawParts[1]) : "";
  const third = rawParts[2] ? publicRouteSegment(rawParts[2]) : "";
  if (!handle) return { type: "invalid", canonicalPath: "/" };
  if (handle && isPublicShareId(third)) return { type: "share", handle, shelfSlug: second, shareId: third, canonicalPath: `/${handle}/${second}/${third}` };
  if (handle && second) return { type: "shelf", handle, shelfSlug: second, canonicalPath: `/${handle}/${second}` };
  if (handle) return { type: "profile", handle, canonicalPath: `/${handle}` };
  return { type: "unknown" };
}

function shareDestination(route) {
  const params = new URLSearchParams();
  params.set("id", route.shareId || "");
  if (route.handle) params.set("u", route.handle);
  if (route.shelfSlug) params.set("s", route.shelfSlug);
  return `/share.html?${params.toString()}`;
}

function shelfDestination(route) {
  const params = new URLSearchParams();
  if (route.handle) params.set("u", route.handle);
  if (route.shelfSlug) params.set("s", route.shelfSlug);
  return `/shelf.html${params.toString() ? `?${params.toString()}` : ""}`;
}

function versionFromTimestamp(value) {
  if (!value) return "";
  try {
    if (typeof value.toMillis === "function") return String(value.toMillis());
    if (value instanceof Date) return String(value.getTime());
    if (typeof value === "number" || typeof value === "string") return String(value);
  } catch {}
  return "";
}

async function getSharePreview(route) {
  if (!route.shareId) return null;
  const snap = await db.collection("shares").doc(route.shareId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const title = cleanOgText(data.title || "Shared product recommendation", 95);
  const note = cleanOgNote(data.note || data.description || "", 180);
  const merchant = cleanOgText(data.merchant || "", 40);
  const desc = note || (merchant ? `A ${merchant} recommendation shared via Shuffle.` : "A product recommendation shared via Shuffle.");
  return {
    found: true,
    kind: "share",
    title,
    description: desc,
    image: shareDataImageField(data),
    imageVersion: versionFromTimestamp(data.imageUpdatedAt || data.updatedAt || data.created),
    destination: shareDestination(route),
    typeLabel: "Product recommendation"
  };
}

async function getShelfPreview(route) {
  const shelfSlug = route.shelfSlug || route.handle || "";
  if (!shelfSlug) return null;
  let shelfData = null;
  const possibleShelfIds = route.handle && route.shelfSlug
    ? [`${route.handle}__${shelfSlug}`, shelfSlug]
    : [shelfSlug];
  for (const shelfId of possibleShelfIds) {
    if (!shelfId) continue;
    const direct = await db.collection("shelves").doc(shelfId).get();
    if (direct.exists) { shelfData = direct.data() || {}; break; }
  }

  let image = shelfData?.image || shelfData?.coverImage || "";
  let itemCount = 0;
  let versionSeed = "";
  let inferredName = "";
  let inferredHandle = route.handle || "";
  if (route.shelfSlug) {
    try {
      const shareSnaps = await db.collection("shares")
        .where("shelfSlug", "==", route.shelfSlug)
        .limit(16)
        .get();
      for (const doc of shareSnaps.docs) {
        const data = doc.data() || {};
        if (route.handle && data.handleSlug && normalizeToken(data.handleSlug) !== route.handle) continue;
        itemCount += 1;
        if (!inferredName && data.shelfName) inferredName = cleanOgText(data.shelfName, 95);
        if (!inferredHandle && (data.handleDisplay || data.handleSlug)) inferredHandle = cleanOgText(data.handleDisplay || data.handleSlug, 40);
        if (!image) image = shareDataImageField(data);
        versionSeed = versionFromTimestamp(data.imageUpdatedAt || data.updatedAt || data.created) || versionSeed;
      }
    } catch (error) {
      console.warn("Shelf preview image lookup failed", error);
    }
  }

  const displayName = cleanOgText(shelfData?.name || inferredName || (route.shelfSlug ? route.shelfSlug.replace(/-/g, " ") : `@${route.handle}`), 95);
  const desc = cleanOgText(shelfData?.description || (itemCount ? `${itemCount} picks shared on Shelves.` : `A ShareShuffle shelf shared via Shuffle.`), 180);
  return {
    found: Boolean(shelfData || route.handle || itemCount),
    kind: route.shelfSlug ? "shelf" : "profile",
    title: route.shelfSlug ? `${displayName} — Shelves` : `@${route.handle} on ShareShuffle`,
    description: desc,
    image,
    itemCount,
    imageVersion: versionSeed || versionFromTimestamp(shelfData?.updatedAt || shelfData?.created),
    destination: shelfDestination(route),
    typeLabel: route.shelfSlug ? "ShareShuffle shelf" : "ShareShuffle profile"
  };
}

function renderHtml({ req, route, preview }) {
  const rawDestination = preview?.destination || "/app/";
  const destination = appUrl(rawDestination);
  const canonicalPath = route.canonicalPath || req.path || "/";
  const canonicalUrl = absoluteUrl(req, canonicalPath);
  const title = preview?.title || "ShareShuffle — Share what's worth finding";
  const description = preview?.description || "A better way to share recommendations and save them to trusted shelves.";
  const image = imageForOg(req, preview?.image || DEFAULT_PREVIEW_IMAGE, route, preview);
  const typeLabel = preview?.typeLabel || "ShareShuffle";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="${route?.type === "share" ? "product" : "website"}">
  <meta property="og:site_name" content="ShareShuffle">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(typeLabel)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:image:alt" content="${escapeHtml(typeLabel)}">
  <meta name="theme-color" content="#EEF6FF">
  <link rel="icon" type="image/png" href="/icons/icon32.png">
  <link rel="apple-touch-icon" href="/icons/icon180-square.png">
  <style>
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#eef6ff;color:#172033;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}
    .card{background:white;border:1px solid rgba(15,23,42,.1);border-radius:24px;box-shadow:0 20px 50px rgba(15,23,42,.12);padding:28px;max-width:560px}
    img{width:100%;max-height:260px;object-fit:contain;border-radius:18px;background:#f8fafc;margin-bottom:18px}
    .muted{color:#64748b}a{color:#2563eb;font-weight:700}
  </style>
</head>
<body>
  <main class="card">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(typeLabel)}" onerror="this.style.display='none'">
    <h1>${escapeHtml(title)}</h1>
    <p class="muted">${escapeHtml(description)}</p>
    <p><a href="${escapeHtml(destination)}">Open in ShareShuffle</a></p>
  </main>
  <script>window.location.replace(${JSON.stringify(destination)});</script>
</body>
</html>`;
}




function isHostedShareShuffleUrl(value = "") {
  try {
    const parsed = new URL(String(value || ""));
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host === "shareshuffle.com" ||
      host === "shfl.me" ||
      host === "shflz.com" ||
      host === "shareshuffle.com/shelf.html" ||
      host.endsWith(".web.app") ||
      host.endsWith(".firebaseapp.com");
  } catch {
    return false;
  }
}

const AMAZON_ASSOCIATE_TAG = "shareshuffle-20";
const WALMART_IMPACT_CONFIG = {
  publisherId: "1936697",
  campaignId: "565706",
  creativeId: "9383",
  sourceId: "imp_000011112222333344"
};

function hostnameOf(value = "") {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isAmazonUrl(value = "") {
  const host = hostnameOf(value);
  return host === "amazon.com" ||
    host.endsWith(".amazon.com") ||
    host === "a.co" ||
    host === "amzn.to";
}

function isWalmartUrl(value = "") {
  const host = hostnameOf(value);
  return host === "walmart.com" || host.endsWith(".walmart.com");
}

function isWalmartImpactUrl(value = "") {
  const host = hostnameOf(value);
  return host === "goto.walmart.com" || host.endsWith(".impactradius.com");
}

function withAmazonAffiliateTag(value = "") {
  const raw = String(value || "").trim();
  if (!raw || !isAmazonUrl(raw)) return raw;

  try {
    const parsed = new URL(raw);
    // Ethics-first: never overwrite an existing Amazon Associate tag.
    if (!parsed.searchParams.has("tag")) {
      parsed.searchParams.set("tag", AMAZON_ASSOCIATE_TAG);
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function withWalmartAffiliateLink(value = "") {
  const raw = String(value || "").trim();
  if (!raw || !isWalmartUrl(raw) || isWalmartImpactUrl(raw)) return raw;

  try {
    const destination = new URL(raw);
    const base = `https://goto.walmart.com/c/${WALMART_IMPACT_CONFIG.publisherId}/${WALMART_IMPACT_CONFIG.campaignId}/${WALMART_IMPACT_CONFIG.creativeId}`;
    const affiliate = new URL(base);
    affiliate.searchParams.set("veh", "aff");
    affiliate.searchParams.set("sourceid", WALMART_IMPACT_CONFIG.sourceId);
    affiliate.searchParams.set("u", destination.toString());
    return affiliate.toString();
  } catch {
    return raw;
  }
}

function withAffiliateUrl(value = "") {
  const amazon = withAmazonAffiliateTag(value);
  if (amazon !== value) return amazon;
  return withWalmartAffiliateLink(value);
}

function chooseStoreUrl(data = {}) {
  const candidates = [
    data.originalUrl,
    data.storeUrl,
    data.productUrl,
    data.merchantUrl,
    data.url
  ]
    .map(value => String(value || "").trim())
    .filter(Boolean);

  const chosen = candidates.find(value => /^https?:\/\//i.test(value) && !isHostedShareShuffleUrl(value)) || "";
  return withAffiliateUrl(chosen);
}


export const addShareToShelf = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 10,
    memory: "256Mi"
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      setCors(res, "POST, OPTIONS");
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      sendCorsJson(res, 405, { ok: false, error: "Method not allowed" }, "POST, OPTIONS");
      return;
    }
    try {
      const id = String(req.body?.id || "").trim();
      const shelfName = cleanOgText(req.body?.shelfName || "", 100);
      const shelfSlug = normalizeShelfToken(req.body?.shelfSlug || shelfName);
      const rawHandleInput = req.body?.handle || req.body?.handleSlug || "rich";
      const handleSlug = normalizeHandleToken(rawHandleInput || "rich");
      const handleDisplay = cleanOgText(req.body?.handleDisplay || handleSlug || "rich", 80);
      if (!id || !/^[A-Za-z0-9_-]{3,80}$/.test(id)) {
        sendCorsJson(res, 400, { ok: false, error: "Missing or invalid share id" }, "POST, OPTIONS");
        return;
      }
      if (!shelfName || !shelfSlug || !isValidPublicToken(shelfSlug)) {
        sendCorsJson(res, 400, { ok: false, error: "Missing or invalid shelf name" }, "POST, OPTIONS");
        return;
      }
      if (!handleSlug || !isValidPublicToken(handleSlug) || isForbiddenHandleInput(rawHandleInput)) {
        sendCorsJson(res, 400, { ok: false, error: "Use letters, numbers, and hyphens only for your handle. Try rich-williams instead of rich_williams or rich.williams." }, "POST, OPTIONS");
        return;
      }
      const shareRef = db.collection("shares").doc(id);
      const shareSnap = await shareRef.get();
      if (!shareSnap.exists) {
        sendCorsJson(res, 404, { ok: false, error: "Share not found" }, "POST, OPTIONS");
        return;
      }
      const shelfDocId = handleSlug ? `${handleSlug}__${shelfSlug}` : shelfSlug;
      const shelfUrl = handleSlug ? `https://shfl.me/${encodeURIComponent(handleSlug)}/${encodeURIComponent(shelfSlug)}` : `https://shareshuffle.com/shelf.html?s=${encodeURIComponent(shelfSlug)}`;
      await db.collection("shelves").doc(shelfDocId).set({
        name: shelfName,
        slug: shelfSlug,
        handleSlug,
        handleDisplay,
        routePath: handleSlug ? `/${handleSlug}/${shelfSlug}` : `/shelf.html?s=${shelfSlug}`,
        created: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      await shareRef.update({
        shelfName,
        shelfSlug,
        handleSlug,
        handleDisplay,
        updatedAt: FieldValue.serverTimestamp()
      });
      sendCorsJson(res, 200, { ok: true, id, shelfName, shelfSlug, handleSlug, handleDisplay, shelfUrl }, "POST, OPTIONS");
    } catch (error) {
      console.error("addShareToShelf failed", error);
      sendCorsJson(res, 500, { ok: false, error: error.message || String(error) }, "POST, OPTIONS");
    }
  }
);

export const shareData = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 10,
    memory: "256Mi"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    try {
      res.set("Cache-Control", "public, max-age=15, s-maxage=30");
      const id = String(req.query.id || "").trim();
      if (!id || !/^[A-Za-z0-9_-]{3,80}$/.test(id)) {
        res.status(400).json({ ok: false, error: "Missing or invalid share id" });
        return;
      }

      const snap = await db.collection("shares").doc(id).get();
      if (!snap.exists) {
        res.status(404).json({ ok: false, error: "Share not found", id });
        return;
      }

      const data = snap.data() || {};
      const title = cleanOgText(data.title || "Shared find", 160);
      const note = cleanOgNote(data.note || "I saw this and thought of you.", 260);
      const savedUrl = data.url || "";
      const originalUrl = data.originalUrl || data.url || "";
      const storeUrl = chooseStoreUrl(data);
      const url = storeUrl;
      const merchant = cleanOgText(data.merchant || "", 60);
      const image = shareDataImageField(data);
      const shelfSlug = normalizeShelfToken(data.shelfSlug || "");
      const handleSlug = normalizeHandleToken(data.handleSlug || "");
      const shelfName = cleanOgText(data.shelfName || "", 100);
      const handleDisplay = cleanOgText(data.handleDisplay || handleSlug || "", 80);

      // Count views server-side so browser Firestore permissions can stay simple.
      db.collection("shares").doc(id).update({
        views: (data.views || 0) + 1
      }).catch((error) => console.warn("shareData view update failed", id, error));

      res.status(200).json({
        ok: true,
        id,
        title,
        note,
        url,
        storeUrl,
        savedUrl,
        originalUrl,
        merchant,
        image,
        shelfName,
        shelfSlug,
        handleSlug,
        handleDisplay,
        shareUrl: `https://shfl.me/${encodeURIComponent(id)}`,
        appUrl: `https://shareshuffle.com/share.html?id=${encodeURIComponent(id)}`,
        imageUrl: `https://shareshuffle.com/i-${encodeURIComponent(id)}`
      });
    } catch (error) {
      console.error("shareData failed", error);
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  }
);

export const trackShareClick = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 10,
    memory: "128Mi"
  },
  async (req, res) => {
    try {
      const id = String(req.query.id || (req.body && req.body.id) || "").trim();
      if (!id || !/^[A-Za-z0-9_-]{3,80}$/.test(id)) {
        res.status(400).json({ ok: false });
        return;
      }
      const ref = db.collection("shares").doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        res.status(404).json({ ok: false });
        return;
      }
      const current = Number((snap.data() || {}).amazonClicks || 0);
      await ref.update({ amazonClicks: current + 1 });
      res.status(200).json({ ok: true });
    } catch (error) {
      console.warn("trackShareClick failed", error);
      res.status(200).json({ ok: false });
    }
  }
);


export const shelfData = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 10,
    memory: "256Mi"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    try {
      res.set("Cache-Control", "public, max-age=30, s-maxage=60");
      const handle = normalizeHandleToken(String(req.query.u || req.query.handle || ""));
      const shelfSlug = normalizeShelfToken(String(req.query.s || req.query.shelf || ""));
      const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);

      if (!shelfSlug && !handle) {
        res.status(400).json({ ok: false, error: "Missing shelf slug", items: [] });
        return;
      }

      const seen = new Set();
      const items = [];
      const debug = [];

      const matches = (id, data = {}) => {
        const itemShelf = normalizeShelfToken(data.shelfSlug || "");
        const itemHandle = normalizeHandleToken(data.handleSlug || "");
        if (shelfSlug && itemShelf !== shelfSlug) return false;
        // Chrome-review extension shares may not have handleSlug at all.
        // If handle is requested, keep no-user docs for the same shelf slug.
        if (handle && itemHandle && itemHandle !== handle) return false;
        return true;
      };

      const addDoc = (doc) => {
        if (!doc || seen.has(doc.id)) return;
        const data = doc.data() || {};
        if (!matches(doc.id, data)) return;
        seen.add(doc.id);
        items.push({
          id: doc.id,
          title: cleanOgText(data.title || "Shared find", 140),
          note: cleanOgNote(data.note || "", 220),
          url: chooseStoreUrl(data),
          savedUrl: data.url || "",
          originalUrl: data.originalUrl || data.url || "",
          merchant: data.merchant || "",
          image: data.cachedImageUrl || data.cachedImage || data.image || data.imageUrl || "",
          shelfName: data.shelfName || "",
          shelfSlug: data.shelfSlug || shelfSlug,
          handleSlug: data.handleSlug || "",
          handleDisplay: data.handleDisplay || ""
        });
      };

      if (shelfSlug) {
        try {
          debug.push(`query:shelfSlug=${shelfSlug}`);
          const snap = await db.collection("shares").where("shelfSlug", "==", shelfSlug).limit(limit).get();
          snap.forEach(addDoc);
          debug.push(`shelfSlug result:${items.length}`);
        } catch (error) {
          debug.push(`shelfSlug error:${error.message || String(error)}`);
        }
      }

      if (handle && shelfSlug && !items.some(item => normalizeHandleToken(item.handleSlug) === handle)) {
        try {
          debug.push(`query:handleSlug=${handle}`);
          const snap = await db.collection("shares").where("handleSlug", "==", handle).limit(limit).get();
          snap.forEach(addDoc);
          debug.push(`handleSlug merged result:${items.length}`);
        } catch (error) {
          debug.push(`handleSlug error:${error.message || String(error)}`);
        }
      }

      const first = items.find(item => item.shelfName || item.handleDisplay || item.handleSlug) || {};
      const resolvedHandle = normalizeHandleToken(first.handleSlug || handle || "");
      const resolvedShelf = normalizeShelfToken(first.shelfSlug || shelfSlug || "");
      const shelfName = cleanOgText(first.shelfName || (resolvedShelf ? resolvedShelf.replace(/-/g, " ") : "Shelf"), 100);
      const handleDisplay = cleanOgText(first.handleDisplay || resolvedHandle || "", 80);

      res.status(200).json({
        ok: true,
        route: { handle, shelfSlug },
        resolved: { handleSlug: resolvedHandle, shelfSlug: resolvedShelf, shelfName, handleDisplay },
        count: items.length,
        items,
        debug
      });
    } catch (error) {
      console.error("shelfData failed", error);
      res.status(500).json({ ok: false, error: error.message || String(error), items: [] });
    }
  }
);


export const renderRoute = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 10,
    memory: "256Mi"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }

    try {
      const route = parsePublicRoute(req.path || req.url || "/");
      let preview = null;
      if (route.type === "share") preview = await getSharePreview(route);
      if (route.type === "shelf" || route.type === "profile") preview = await getShelfPreview(route);

      res.set("Cache-Control", "public, max-age=60, s-maxage=300");
      res.set("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(renderHtml({ req, route, preview }));
    } catch (error) {
      console.error("renderRoute failed", error);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(renderHtml({ req, route: { type: "unknown", canonicalPath: req.path || "/" }, preview: null }));
    }
  }
);


export const getBuildInfo = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 5,
    memory: "128Mi"
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store, max-age=0");
    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      ...BUILD_INFO,
      ok: true,
      host: req.get("x-forwarded-host") || req.get("host") || "",
      path: req.path || req.url || "",
      now: new Date().toISOString()
    });
  }
);

async function loadShelfShares({ handle = "", shelfSlug = "", limit = 16 } = {}) {
  if (!shelfSlug && !handle) return [];
  const snaps = shelfSlug
    ? await db.collection("shares").where("shelfSlug", "==", shelfSlug).limit(Math.max(limit * 2, 16)).get()
    : await db.collection("shares").where("handleSlug", "==", handle).limit(Math.max(limit * 2, 16)).get();
  const out = [];
  for (const doc of snaps.docs) {
    const data = doc.data() || {};
    if (handle && data.handleSlug && normalizeHandleToken(data.handleSlug) !== handle) continue;
    out.push({ id: doc.id, ...data });
    if (out.length >= limit) break;
  }
  return out;
}

async function makeShelfSocialCardPng({ handle = "", shelfSlug = "", shares = [] } = {}) {
  const first = shares.find((item) => item.shelfName || item.handleDisplay) || {};
  const shelfName = cleanOgText(first.shelfName || (shelfSlug ? shelfSlug.replace(/-/g, " ") : `${handle || "Shelf"}`), 72);
  const title = shelfName.replace(/\b\w/g, (m) => m.toUpperCase());
  const handleDisplay = cleanOgText(first.handleDisplay || handle || "", 40);
  const urlLabel = handle && shelfSlug ? `shfl.me/${handle}/${shelfSlug}` : "shfl.me";
  const countLabel = `${shares.length || 0} pick${shares.length === 1 ? "" : "s"}`;
  const selected = shares.slice(0, 9);
  const imageData = [];
  for (const item of selected) {
    try {
      const img = await getShareImageBuffer(item.id, item).catch(() => null);
      imageData.push(img?.buffer ? dataUriForImage(img) : "");
    } catch { imageData.push(""); }
  }
  while (imageData.length < 9) imageData.push("");

  const tiles = imageData.map((href, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 588 + col * 168;
    const y = 82 + row * 158;
    const placeholder = `<rect x="${x}" y="${y}" width="146" height="136" rx="18" fill="#f1f5f9"/><text x="${x + 73}" y="${y + 76}" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#94a3b8">Shelf pick</text>`;
    return `<clipPath id="clip${i}"><rect x="${x}" y="${y}" width="146" height="136" rx="18"/></clipPath><rect x="${x}" y="${y}" width="146" height="136" rx="18" fill="#fff" stroke="#dbeafe" stroke-width="2"/>${href ? `<image href="${href}" x="${x}" y="${y}" width="146" height="136" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${i})"/>` : placeholder}`;
  }).join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#EEF6FF"/><stop offset="1" stop-color="#dbeafe"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.15"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="52" y="52" width="1096" height="526" rx="38" fill="#ffffff" filter="url(#shadow)"/>
  <g transform="translate(88 90)"><rect x="0" y="0" width="46" height="46" rx="12" fill="#dbeafe"/><text x="23" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="#2563eb">S</text><text x="62" y="32" font-family="Arial, sans-serif" font-size="33" font-weight="900" fill="#0f172a">ShareShuffle</text></g>
  <text x="88" y="236" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#0f172a">${svgText(title)}</text>
  <text x="88" y="292" font-family="Arial, sans-serif" font-size="29" font-weight="600" fill="#475569">${svgText(handleDisplay ? `${handleDisplay}'s curated gear shelf` : "A curated recommendation shelf")}</text>
  <line x1="88" y1="342" x2="508" y2="342" stroke="#bfdbfe" stroke-width="3"/>
  <rect x="88" y="372" width="54" height="54" rx="14" fill="#eff6ff"/><text x="115" y="408" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="#2563eb">□</text><text x="162" y="408" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#0f172a">${svgText(countLabel)}</text>
  <rect x="88" y="448" width="54" height="54" rx="14" fill="#eff6ff"/><text x="115" y="484" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="#2563eb">↝</text><text x="162" y="484" font-family="Arial, sans-serif" font-size="27" font-weight="700" fill="#64748b">Shared via </text><text x="300" y="484" font-family="Arial, sans-serif" font-size="27" font-weight="900" fill="#2563eb">Shuffle</text>
  <rect x="88" y="522" width="390" height="58" rx="20" fill="#eff6ff" stroke="#bfdbfe"/><text x="122" y="560" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#0f172a">${svgText(urlLabel)}</text>
  ${tiles}
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export const shelfCardImage = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 30,
    memory: "1GiB"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }
    const handle = normalizeToken(String(req.query.u || req.query.handle || ""));
    const shelfSlug = normalizeToken(String(req.query.s || req.query.shelf || ""));
    try {
      const shares = await loadShelfShares({ handle, shelfSlug, limit: 9 });
      const png = await makeShelfSocialCardPng({ handle, shelfSlug, shares });
      res.set("Cache-Control", "public, max-age=300, s-maxage=900");
      res.set("Content-Type", "image/png");
      res.status(200).send(png);
    } catch (error) {
      console.error("shelfCardImage failed", error);
      res.redirect(302, "/assets/no-product-image.svg");
    }
  }
);

export const shareImage = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 20,
    memory: "512Mi"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }

    const shareId = extractImageShareId(req);
    if (!shareId) return sendFallbackImage(res);

    try {
      const snap = await db.collection("shares").doc(shareId).get();
      if (!snap.exists) return sendFallbackImage(res);
      const data = snap.data() || {};
      const imageData = await getShareImageBuffer(shareId, data);
      if (!imageData?.buffer?.length) {
        const fallback = await makeSquareFallbackPng({ shareId, data });
        res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
        res.set("Content-Type", "image/png");
        res.status(200).send(fallback);
        return;
      }
      res.set("Cache-Control", "public, max-age=604800, s-maxage=604800, immutable");
      res.set("Content-Type", imageData.contentType || "image/jpeg");
      res.status(200).send(imageData.buffer);
    } catch (error) {
      console.warn("shareImage failed", shareId, error);
      sendFallbackImage(res);
    }
  }
);

export const cardImage = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 25,
    memory: "1GiB"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }
    const shareId = extractCardShareId(req);
    if (!shareId) {
      res.status(404).send("Not found");
      return;
    }
    try {
      const snap = await db.collection("shares").doc(shareId).get();
      if (!snap.exists) {
        res.status(404).send("Share not found");
        return;
      }
      const data = snap.data() || {};
      const imageData = await getShareImageBuffer(shareId, data).catch((error) => {
        console.warn("card image product fetch failed", shareId, error);
        return null;
      });
      const png = await makeSocialCardPng({ shareId, data, imageData });
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.set("Content-Type", "image/png");
      res.status(200).send(png);
    } catch (error) {
      console.error("cardImage failed", shareId, error);
      res.status(500).send("Card image failed");
    }
  }
);


function parseImageDataUrl(value = "") {
  const match = String(value || "").match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const contentType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (!buffer.length || buffer.length > 2_000_000) return null;
  return { buffer, contentType };
}

export const uploadShareImage = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 35,
    memory: "1GiB",
    cors: [
      "https://shareshuffle.com",
      "https://www.shareshuffle.com",
      "https://shfl.me",
      "https://www.shfl.me",
      "https://shareshuffle.com/shelf.html",
      "https://www.shareshuffle.com/shelf.html",
      "https://shareshuffle-c7f96.web.app",
      "http://localhost:5000",
      "http://localhost:5173"
    ]
  },
  async (req, res) => {
    if (req.method === "OPTIONS") return sendCorsJson(res, 204, {}, "POST, OPTIONS");
    if (req.method !== "POST") return sendCorsJson(res, 405, { error: "Method not allowed" }, "POST, OPTIONS");

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const shareId = String(body.shareId || body.id || "").trim().toLowerCase();
      if (!isPublicShareId(shareId)) return sendCorsJson(res, 400, { error: "Invalid share id" }, "POST, OPTIONS");

      const snap = await db.collection("shares").doc(shareId).get();
      if (!snap.exists) return sendCorsJson(res, 404, { error: "Share does not exist yet" }, "POST, OPTIONS");

      let parsed = parseImageDataUrl(body.imageDataUrl || "");
      let source = "upload";
      const imageUrlRaw = String(body.imageUrl || "").trim();

      if (!parsed && imageUrlRaw) {
        const sourceShareId = extractFirstPartyImageShareId(imageUrlRaw);
        if (sourceShareId && sourceShareId !== shareId) {
          const sourceSnap = await db.collection("shares").doc(sourceShareId).get();
          if (sourceSnap.exists) {
            parsed = await readCachedShareImage(sourceShareId, sourceSnap.data() || {});
            source = "first-party-clone";
          }
        }
      }

      if (!parsed && imageUrlRaw) {
        const fetchUrl = imageUrlRaw.startsWith("/") ? new URL(imageUrlRaw, "https://shfl.me").href : imageUrlRaw;
        if (isAllowedUrl(fetchUrl)) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
          try {
            parsed = await fetchImageBuffer(fetchUrl, controller.signal);
            source = "url";
          } finally {
            clearTimeout(timer);
          }
        }
      }

      if (!parsed) return sendCorsJson(res, 400, { error: "No valid image supplied" }, "POST, OPTIONS");

      const cached = await saveCachedShareImage(shareId, parsed, source);

      return sendCorsJson(res, 200, {
        ok: true,
        shareId,
        imageRoute: `/i-${shareId}`,
        cardRoute: `/c-${shareId}?v=${Date.now()}`,
        imageStatus: cached.source && String(cached.source).includes("firestore") ? "cached-firestore" : "cached",
        imageSource: cached.source || source,
        bytes: cached.buffer.length,
        contentType: cached.contentType
      }, "POST, OPTIONS");
    } catch (error) {
      console.error("uploadShareImage failed", error);
      return sendCorsJson(res, 500, { error: "Image upload failed", detail: String(error?.message || error) }, "POST, OPTIONS");
    }
  }
);

export const ogImage = onRequest(
  {
    invoker: "public",
    timeoutSeconds: 15,
    memory: "256Mi"
  },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }

    const rawUrl = String(req.query.url || "").trim();
    if (!isAllowedUrl(rawUrl)) {
      res.redirect(302, "/assets/no-product-image.svg");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(rawUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "user-agent": BROWSER_HEADERS["user-agent"],
          "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9"
        }
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.startsWith("image/")) {
        res.redirect(302, "/assets/no-product-image.svg");
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.set("Content-Type", contentType);
      res.status(200).send(buffer);
    } catch (error) {
      console.warn("ogImage proxy failed", error);
      res.redirect(302, "/assets/no-product-image.svg");
    } finally {
      clearTimeout(timer);
    }
  }
);
