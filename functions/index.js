import { onRequest } from "firebase-functions/v2/https";

const MAX_HTML_BYTES = 600000;
const TIMEOUT_MS = 7000;

function sendJson(res, status, payload) {
  res.set("Access-Control-Allow-Origin", "https://shareshuffle.com");
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

function decodeEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
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

function pickTitle(html) {
  return pickMeta(html, ["og:title", "twitter:title"]) || decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function absolutize(candidate, baseUrl) {
  try { return new URL(candidate, baseUrl).toString(); } catch { return ""; }
}

function numericAttr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']?(\\d{2,5})["']?`, "i"));
  return match ? Number(match[1]) || 0 : 0;
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
  const decoded = decodeEntities(src);
  const urls = decoded.match(/https?:\\?\/\\?\/[^"']+/g) || [];
  if (!urls.length) return "";
  const cleaned = urls.map((url) => url.replace(/\\\//g, "/"));
  cleaned.sort((a, b) => {
    const score = (u) => {
      const nums = u.match(/\b\d{3,5}\b/g)?.map(Number) || [];
      return nums.length ? Math.max(...nums) : 0;
    };
    return score(b) - score(a);
  });
  return cleaned[0] || "";
}

function pickLargestImage(html, baseUrl) {
  const candidates = [];
  const imgRe = /<img\b[^>]*>/gi;
  const attrRe = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] || "";
  let img;
  while ((img = imgRe.exec(html))) {
    const tag = img[0];
    const rawSrc =
      amazonDynamicImage(attrRe(tag, "data-a-dynamic-image")) ||
      bestFromSrcset(attrRe(tag, "srcset") || attrRe(tag, "data-srcset"), baseUrl) ||
      attrRe(tag, "data-old-hires") ||
      attrRe(tag, "data-src") ||
      attrRe(tag, "src");

    const url = absolutize(rawSrc, baseUrl);
    if (!url || /sprite|logo|icon|avatar|pixel|blank|transparent|loading/i.test(url)) continue;

    const width = numericAttr(tag, "width");
    const height = numericAttr(tag, "height");
    let score = (width * 2) + height;
    if (width >= 300) score += 500;
    if (height >= 300) score += 400;
    if (/product|main|hero|landing|primary|imageblock|hires|large/i.test(tag + " " + url)) score += 900;
    if (/thumb|thumbnail|swatch|badge|review|star|rating/i.test(tag + " " + url)) score -= 500;
    if (/\.svg(?:\?|$)|base64/i.test(url)) score -= 1000;
    candidates.push({ url, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url || "";
}

function extractPreview(html, finalUrl) {
  const title = pickTitle(html);
  const description = pickMeta(html, ["og:description", "twitter:description", "description"]);
  const image = absolutize(
    pickMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]),
    finalUrl
  ) || pickLargestImage(html, finalUrl);
  return { title, description, image, finalUrl };
}

export const getPreview = onRequest({ region: "us-central1", timeoutSeconds: 10, memory: "256MiB" }, async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  const rawUrl = String(req.query.url || "");
  if (!isAllowedUrl(rawUrl)) return sendJson(res, 400, { error: "Unsupported URL" });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "ShareShufflePreview/1.0 (+https://shareshuffle.com)",
        "accept": "text/html,application/xhtml+xml"
      }
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return sendJson(res, 415, { error: "URL did not return HTML" });

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (received < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return sendJson(res, 200, extractPreview(html, response.url || rawUrl));
  } catch (error) {
    return sendJson(res, 502, { error: "Could not fetch preview", detail: String(error?.message || error) });
  } finally {
    clearTimeout(timer);
  }
});
