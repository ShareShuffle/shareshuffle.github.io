import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

initializeApp();
const db = getFirestore();
const storage = getStorage();

const BUILD_INFO = {
  build: "2026.06.11-reliability-02",
  createdAt: "2026-06-11T19:05:00Z",
  patch: "routing-share-image-status-reliability",
  functions: ["getPreview", "renderRoute", "ogImage", "shareImage", "getBuildInfo"]
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

function pickTitle(html) {
  return (
    pickMeta(html, ["og:title", "twitter:title"]) ||
    pickById(html, "productTitle") ||
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

function titleFromAmazonUrl(url = "") {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const parts = path.split("/").filter(Boolean);
    const asinIndex = parts.findIndex((part) => /^[A-Z0-9]{10}$/i.test(part));
    const dpIndex = parts.findIndex((part) => /^(dp|product|d)$/i.test(part));
    const titlePart = parts[Math.max(0, (dpIndex > 0 ? dpIndex : asinIndex) - 1)] || "";
    if (!titlePart || /^[A-Z0-9]{10}$/i.test(titlePart)) return "";
    return titlePart
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();
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
  let title = pickTitle(html);
  let description = pickMeta(html, ["og:description", "twitter:description", "description"]);
  let image = absolutize(
    pickMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]),
    finalUrl
  ) || pickLargestImage(html, finalUrl);

  if (isAmazonHost(finalUrl) || isAmazonHost(requestedUrl)) {
    if (isBadAmazonPage(html, title)) {
      title = "";
      description = "";
      image = "";
    }
    const asin = extractAsin(finalUrl) || extractAsin(requestedUrl);
    title = title && !isBadAmazonTitle(title) ? title : titleFromAmazonUrl(finalUrl);
    image = image || amazonImageFallback(asin);
  }

  return { title, description, image, finalUrl };
}

export const getPreview = onRequest(
  {
    invoker: "public",
    cors: [
      "https://shareshuffle.com",
      "https://www.shareshuffle.com",
      "https://shfl.me",
      "https://www.shfl.me",
      "https://shelfmix.com",
      "https://www.shelfmix.com",
      "https://shareshuffle-c7f96.web.app",
      "http://localhost:5000",
      "http://localhost:5173"
    ],
    timeoutSeconds: 15,
    memory: "256Mi"
  },
  async (req, res) => {  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  const rawUrl = String(req.query.url || "").trim();
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
  return !value || /sprite|logo|icon|avatar|pixel|blank|transparent|loading|favicon|share-?shuffle|icon512|icon192|gift/i.test(value) || /\.svg(?:\?|$)|base64/.test(value);
}

function extractImageShareId(req) {
  const path = String(req.path || req.url || "").split("?")[0];
  const parts = path.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  const last = parts[parts.length - 1] || "";
  const raw = parts[0] === "img" ? last : last.replace(/^(?:i-|~|-)/, "");
  const id = raw.trim().toLowerCase();
  return isPublicShareId(id) ? id : "";
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
  return { buffer, contentType };
}

function sendFallbackImage(res) {
  res.redirect(302, "/icons/icon512-square.png");
}

const DEFAULT_PREVIEW_IMAGE = "https://shareshuffle.com/icons/icon512-square.png";

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

function normalizeToken(value = "") {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPublicShareId(value = "") {
  return /^[23456789abcdefghjkmnpqrstuvwxyz]{5}$/i.test(String(value || "").trim());
}

function cleanOgText(value = "", max = 180) {
  const text = decodeEntities(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/[\s,;:.-]+$/g, "") + "…";
}

function imageForOg(req, rawImage = "", route = {}) {
  // For a share page, prefer a stable first-party image URL. It can cache/proxy
  // the original merchant image and keeps iMessage away from blocked hotlinks.
  if (route?.type === "share" && route.shareId) return absoluteUrl(req, `/i-${route.shareId}`);

  const image = String(rawImage || "").trim();
  if (!image || isLikelyBadProductImage(image)) return absoluteUrl(req, "/icons/icon512-square.png");
  if (image.startsWith("/")) return absoluteUrl(req, image);
  if (/^https?:\/\//i.test(image)) {
    const host = hostOf(image);
    const ownHosts = new Set([
      "shareshuffle.com",
      "www.shareshuffle.com",
      "shfl.me",
      "www.shfl.me",
      "shelfmix.com",
      "www.shelfmix.com",
      "shareshuffle-c7f96.web.app",
      "shareshuffle-c7f96.firebaseapp.com"
    ]);
    if (ownHosts.has(host)) return image;
    return absoluteUrl(req, `/ogImage?url=${encodeURIComponent(image)}`);
  }
  return absoluteUrl(req, "/icons/icon512-square.png");
}

function parsePublicRoute(pathname = "/") {
  const parts = String(pathname || "/")
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part).trim())
    .filter(Boolean);

  if (!parts.length) return { type: "home" };
  const first = parts[0] || "";

  // System routes must win before username/profile routes.
  // This prevents /img/a2c4e from being interpreted as user=img, shelf=a2c4e.
  if (["img", "app", "share.html", "shelf.html", "status.html", "_status", "_build", "getPreview", "ogImage"].includes(first)) {
    return { type: "system", canonicalPath: `/${parts.join("/")}` };
  }
  if (/^(?:i-|~|-)[23456789abcdefghjkmnpqrstuvwxyz]{5}$/i.test(first)) {
    return { type: "image", shareId: first.replace(/^(?:i-|~|-)/, "").toLowerCase(), canonicalPath: `/${first.toLowerCase()}` };
  }

  if (parts.length === 1 && isPublicShareId(first)) {
    return { type: "share", shareId: first.toLowerCase(), canonicalPath: `/${first.toLowerCase()}` };
  }

  if (first.startsWith("@")) {
    const handle = normalizeToken(first);
    const second = normalizeToken(parts[1] || "");
    const third = String(parts[2] || "").trim().toLowerCase();

    if (isPublicShareId(third)) return { type: "share", handle, shelfSlug: second, shareId: third, canonicalPath: `/@${handle}/${second}/${third}` };
    if (isPublicShareId(second)) return { type: "share", handle, shareId: second.toLowerCase(), canonicalPath: `/@${handle}/${second.toLowerCase()}` };
    if (second) return { type: "shelf", handle, shelfSlug: second, canonicalPath: `/@${handle}/${second}` };
    return { type: "profile", handle, canonicalPath: `/@${handle}` };
  }

  // Future no-@ routes. Root 5-char share IDs already win above.
  const handle = normalizeToken(first);
  const second = normalizeToken(parts[1] || "");
  const third = String(parts[2] || "").trim().toLowerCase();
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

async function getSharePreview(route) {
  if (!route.shareId) return null;
  const snap = await db.collection("shares").doc(route.shareId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const title = cleanOgText(data.title || "Shared product recommendation", 95);
  const note = cleanOgText(data.note || data.description || "", 180);
  const merchant = cleanOgText(data.merchant || "", 40);
  const desc = note || (merchant ? `A ${merchant} recommendation shared via Shuffle.` : "A product recommendation shared via Shuffle.");
  return {
    found: true,
    kind: "share",
    title,
    description: desc,
    image: data.cachedImage || data.cachedImageUrl || data.image || data.imageUrl || "",
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
  if (!image && route.shelfSlug) {
    try {
      const shareSnaps = await db.collection("shares")
        .where("shelfSlug", "==", route.shelfSlug)
        .limit(12)
        .get();
      for (const doc of shareSnaps.docs) {
        const data = doc.data() || {};
        if (route.handle && data.handleSlug && normalizeToken(data.handleSlug) !== route.handle) continue;
        image = data.cachedImage || data.cachedImageUrl || data.image || data.imageUrl || "";
        if (image) break;
      }
    } catch (error) {
      console.warn("Shelf preview image lookup failed", error);
    }
  }

  const displayName = cleanOgText(shelfData?.name || (route.shelfSlug ? route.shelfSlug.replace(/-/g, " ") : `@${route.handle}`), 95);
  const desc = cleanOgText(shelfData?.description || `A ShelfMix collection shared via Shuffle.`, 180);
  return {
    found: Boolean(shelfData || route.handle),
    kind: route.shelfSlug ? "shelf" : "profile",
    title: route.shelfSlug ? `${displayName} — ShelfMix` : `@${route.handle} on ShareShuffle`,
    description: desc,
    image,
    destination: shelfDestination(route),
    typeLabel: route.shelfSlug ? "ShelfMix collection" : "ShareShuffle profile"
  };
}

function renderHtml({ req, route, preview }) {
  const destination = preview?.destination || "/app/";
  const canonicalPath = route.canonicalPath || req.path || "/";
  const canonicalUrl = absoluteUrl(req, canonicalPath);
  const title = preview?.title || "ShareShuffle — Share what's worth finding";
  const description = preview?.description || "A better way to share recommendations and save them to trusted shelves.";
  const image = imageForOg(req, preview?.image || DEFAULT_PREVIEW_IMAGE, route);
  const typeLabel = preview?.typeLabel || "ShareShuffle";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ShareShuffle">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:alt" content="${escapeHtml(typeLabel)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
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

    const cachePath = `share-images/${shareId}`;
    const bucket = storage.bucket();
    const file = bucket.file(cachePath);

    try {
      const [exists] = await file.exists();
      if (exists) {
        const [metadata] = await file.getMetadata();
        const [buffer] = await file.download();
        res.set("Cache-Control", "public, max-age=604800, s-maxage=604800, immutable");
        res.set("Content-Type", metadata.contentType || "image/jpeg");
        res.status(200).send(buffer);
        return;
      }
    } catch (error) {
      console.warn("Image cache read failed", shareId, error);
    }

    try {
      const snap = await db.collection("shares").doc(shareId).get();
      if (!snap.exists) return sendFallbackImage(res);
      const data = snap.data() || {};
      const rawImage = String(data.cachedImageUrl || data.cachedImage || data.image || data.imageUrl || "").trim();
      if (!rawImage || isLikelyBadProductImage(rawImage) || !isAllowedUrl(rawImage)) return sendFallbackImage(res);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const { buffer, contentType } = await fetchImageBuffer(rawImage, controller.signal);
        try {
          await file.save(buffer, {
            resumable: false,
            metadata: {
              contentType,
              cacheControl: "public, max-age=604800"
            }
          });
          await db.collection("shares").doc(shareId).set({
            cachedImagePath: cachePath,
            cachedImageContentType: contentType,
            imageStatus: "cached"
          }, { merge: true });
        } catch (cacheError) {
          console.warn("Image cache write failed", shareId, cacheError);
        }
        res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
        res.set("Content-Type", contentType);
        res.status(200).send(buffer);
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      console.warn("shareImage failed", shareId, error);
      sendFallbackImage(res);
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
      res.redirect(302, "/icons/icon512-square.png");
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
        res.redirect(302, "/icons/icon512-square.png");
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.set("Content-Type", contentType);
      res.status(200).send(buffer);
    } catch (error) {
      console.warn("ogImage proxy failed", error);
      res.redirect(302, "/icons/icon512-square.png");
    } finally {
      clearTimeout(timer);
    }
  }
);
