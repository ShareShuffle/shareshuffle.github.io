import { onRequest } from "firebase-functions/v2/https";

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
  res.set("Cache-Control", "public, max-age=300, s-maxage=300");
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
  const match = html.match(new RegExp(`<[^>]+id=["']${escaped}["'][^>]*>([\s\S]*?)<\/[^>]+>`, "i"));
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

export const getPreview = onRequest({ region: "us-central1", timeoutSeconds: 12, memory: "256MiB" }, async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
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

    return sendJson(res, 200, extractPreview(html, finalUrl, rawUrl));
  } catch (error) {
    return sendJson(res, 502, { error: "Could not fetch preview", detail: String(error?.message || error) });
  } finally {
    clearTimeout(timer);
  }
});
