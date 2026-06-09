console.log("ShareShuffle popup loaded");

const FIREBASE_PROJECT_ID = "shareshuffle-c7f96";
const FIRESTORE_COLLECTION = "shares";
const SHELVES_COLLECTION = "shelves";
const SHARE_BASE_URL = "https://shfl.me/";
const TEMP_HANDLE = "@rich";
const SHELF_BASE_URL = "https://shareshuffle.com/shelf.html?s=";
const SHELF_STORAGE_KEY = "shareShuffleShelves";
const LAST_SHARE_STORAGE_KEY = "shareShuffleLastShare";

const FIRESTORE_DOCUMENTS_ROOT =
  `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const FIRESTORE_COMMIT_URL =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`;

async function commitCreateDocument(collectionName, documentId, fields, serverTimestampFields = []) {
  const write = {
    update: {
      name: `${FIRESTORE_DOCUMENTS_ROOT}/${collectionName}/${documentId}`,
      fields
    },
    currentDocument: { exists: false }
  };

  if (serverTimestampFields.length) {
    write.updateTransforms = serverTimestampFields.map((fieldPath) => ({
      fieldPath,
      setToServerValue: "REQUEST_TIME"
    }));
  }

  const response = await fetch(FIRESTORE_COMMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ writes: [write] })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText);
    error.status = response.status;
    throw error;
  }

  return response.json();
}


const AFFILIATE_CONFIG = {
  amazon: {
    tag: "shareshuffle-20"
  },
  walmart: {
    publisherId: "1936697",
    campaignId: "565706",
    creativeId: "9383",
    sourceId: "imp_000011112222333344"
  }
};

function getAffiliateMerchant(originalUrl = "") {
  try {
    const hostname = new URL(originalUrl).hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "amazon.com" || hostname.endsWith(".amazon.com")) return "amazon";
    if (hostname === "walmart.com" || hostname.endsWith(".walmart.com")) return "walmart";

    return "direct";
  } catch {
    return "direct";
  }
}

function buildAmazonAffiliateUrl(originalUrl) {
  try {
    const url = new URL(originalUrl);
    url.searchParams.set("tag", AFFILIATE_CONFIG.amazon.tag);
    return url.toString();
  } catch (error) {
    console.error("Bad Amazon URL:", originalUrl, error);
    return originalUrl;
  }
}

function buildWalmartAffiliateUrl(originalUrl) {
  try {
    const destinationUrl = new URL(originalUrl);

    // Avoid wrapping an already-affiliated Walmart redirect.
    if (destinationUrl.hostname.includes("goto.walmart.com")) {
      return destinationUrl.toString();
    }

    const { publisherId, campaignId, creativeId, sourceId } = AFFILIATE_CONFIG.walmart;
    const redirectUrl = new URL(`https://goto.walmart.com/c/${publisherId}/${campaignId}/${creativeId}`);
    redirectUrl.searchParams.set("u", destinationUrl.toString());

    if (sourceId) {
      redirectUrl.searchParams.set("subId1", sourceId);
    }

    return redirectUrl.toString();
  } catch (error) {
    console.error("Bad Walmart URL:", originalUrl, error);
    return originalUrl;
  }
}

function buildAffiliateUrl(originalUrl = "") {
  const merchant = getAffiliateMerchant(originalUrl);

  if (merchant === "amazon") return buildAmazonAffiliateUrl(originalUrl);
  if (merchant === "walmart") return buildWalmartAffiliateUrl(originalUrl);

  return originalUrl;
}

const FIRESTORE_URL =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${FIRESTORE_COLLECTION}`;

const SHELVES_URL =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${SHELVES_COLLECTION}`;

function makeShortId(length = 5) {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz";
  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

function makeSlug(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 48);
}

async function shareExists(id) {
  const response = await fetch(`${FIRESTORE_URL}/${id}`);
  return response.ok;
}

async function createUniqueId() {
  let id;

  do {
    id = makeShortId();
  } while (await shareExists(id));

  return id;
}

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  return tabs[0];
}

async function getPageMetadata(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const absoluteUrl = (value) => {
        try { return value ? new URL(value, location.href).toString() : ""; }
        catch { return ""; }
      };

      const meta = (...selectors) => {
        for (const selector of selectors) {
          const value = document.querySelector(selector)?.content?.trim();
          if (value) return value;
        }
        return "";
      };

      const visibleEnough = (img) => {
        const rect = img.getBoundingClientRect();
        const style = window.getComputedStyle(img);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width >= 120 &&
          rect.height >= 120
        );
      };

      const normalizeImageUrl = (img) => {
        const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
        if (srcset) {
          const candidates = srcset
            .split(",")
            .map(part => part.trim().split(/\s+/)[0])
            .filter(Boolean);
          if (candidates.length) return absoluteUrl(candidates[candidates.length - 1]);
        }

        return absoluteUrl(
          img.currentSrc ||
          img.src ||
          img.getAttribute("data-old-hires") ||
          img.getAttribute("data-a-dynamic-image")?.match(/"(https?:[^"\\]+)"/)?.[1] ||
          img.getAttribute("data-src") ||
          img.getAttribute("data-original") ||
          ""
        );
      };

      const scoreImage = (img) => {
        const rect = img.getBoundingClientRect();
        const width = img.naturalWidth || rect.width || 0;
        const height = img.naturalHeight || rect.height || 0;
        const area = width * height;
        const idClassAlt = `${img.id || ""} ${img.className || ""} ${img.alt || ""}`.toLowerCase();
        let score = area;

        if (/product|hero|main|landing|primary|image|photo/.test(idClassAlt)) score += 800000;
        if (/logo|sprite|icon|avatar|badge|payment|paypal|klarna|visa|mastercard|star|rating|review/.test(idClassAlt)) score -= 1000000;
        if (width < 180 || height < 180) score -= 500000;
        if (rect.top >= 0 && rect.top < window.innerHeight * 1.4) score += 200000;

        return score;
      };

      const amazonDynamicImage = () => {
        const img = document.querySelector("#landingImage, #imgBlkFront");
        const dynamic = img?.getAttribute("data-a-dynamic-image") || "";
        if (!dynamic) return "";
        try {
          const map = JSON.parse(dynamic);
          return Object.keys(map)
            .sort((a, b) => (map[b]?.[0] || 0) * (map[b]?.[1] || 0) - (map[a]?.[0] || 0) * (map[a]?.[1] || 0))[0] || "";
        } catch {
          return dynamic.match(/"(https?:[^"\\]+)"/)?.[1] || "";
        }
      };

      const explicitImage =
        absoluteUrl(amazonDynamicImage()) ||
        normalizeImageUrl(document.querySelector("#landingImage, #imgBlkFront, .product-image img, [data-testid*='product'] img")) ||
        absoluteUrl(meta('meta[property="og:image:secure_url"]', 'meta[property="og:image"]', 'meta[name="twitter:image"]', 'meta[name="twitter:image:src"]'));

      const bestImage = explicitImage ||
        Array.from(document.images)
          .filter(visibleEnough)
          .map(img => ({ img, url: normalizeImageUrl(img), score: scoreImage(img) }))
          .filter(item => item.url && !/\.svg($|\?)/i.test(item.url))
          .sort((a, b) => b.score - a.score)[0]?.url || "";

      return {
        title: meta('meta[property="og:title"]', 'meta[name="twitter:title"]') || document.title || "",
        description: meta('meta[property="og:description"]', 'meta[name="twitter:description"]', 'meta[name="description"]') || "",
        image: bestImage
      };
    }
  });

  return results?.[0]?.result || { title: "", description: "", image: "" };
}

function buildTempHandleShareUrl({ id, shelfSlug }) {
  const middle = shelfSlug || "shelf";
  return `${SHARE_BASE_URL}${TEMP_HANDLE}/${encodeURIComponent(middle)}/${encodeURIComponent(id)}`;
}

async function getSavedShelves() {
  const result = await chrome.storage.local.get([SHELF_STORAGE_KEY]);
  return result[SHELF_STORAGE_KEY] || [];
}

async function saveShelfName(name) {
  const cleanName = (name || "").trim();
  if (!cleanName) return;

  const shelves = await getSavedShelves();

  const updated = [
    cleanName,
    ...shelves.filter(s => s.toLowerCase() !== cleanName.toLowerCase())
  ].slice(0, 12);

  await chrome.storage.local.set({
    [SHELF_STORAGE_KEY]: updated
  });
}

async function renderShelfPills(shelfNameInput) {
  const shelfPills = document.getElementById("shelfPills");
  if (!shelfPills || !shelfNameInput) return;

  const shelves = await getSavedShelves();

  shelfPills.innerHTML = "";

  shelves.forEach((shelf) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shelf-pill";
    btn.textContent = shelf;

    btn.addEventListener("click", () => {
      shelfNameInput.value = shelf;
    });

    shelfPills.appendChild(btn);
  });
}

async function createShelfIfNeeded(shelfName) {
  const cleanName = (shelfName || "").trim();

  if (!cleanName) {
    return { shelfName: "", shelfSlug: "", shelfUrl: "" };
  }

  const shelfSlug = makeSlug(cleanName);
  const shelfUrl = `${SHELF_BASE_URL}${encodeURIComponent(shelfSlug)}`;

  if (!shelfSlug) {
    return { shelfName: "", shelfSlug: "", shelfUrl: "" };
  }

  // If the shelf already exists, read succeeds and we can continue.
  // A 404 here is normal for a brand-new shelf.
  try {
    const existing = await fetch(`${SHELVES_URL}/${encodeURIComponent(shelfSlug)}`);
    if (existing.ok) {
      return { shelfName: cleanName, shelfSlug, shelfUrl };
    }
  } catch (error) {
    console.warn("Shelf existence check failed; attempting create anyway", error);
  }

  const fields = {
    name: { stringValue: cleanName },
    slug: { stringValue: shelfSlug },
    description: { stringValue: "" },
    image: { stringValue: "" },
    coverImage: { stringValue: "" },
    ownerUuid: { stringValue: "local-extension-user" }
  };

  try {
    await commitCreateDocument(SHELVES_COLLECTION, shelfSlug, fields, ["created"]);
  } catch (error) {
    // If the shelf already exists or shelf creation is temporarily blocked,
    // still allow the share to be created with shelfName/shelfSlug.
    console.warn("Shelf could not be created. Continuing with share anyway.", error.message || error);
  }

  return { shelfName: cleanName, shelfSlug, shelfUrl };
}

async function createShareDocument(id, data) {
  const fields = {
    title: { stringValue: data.title || "" },
    url: { stringValue: data.url || "" },
    originalUrl: { stringValue: data.originalUrl || data.url || "" },
    merchant: { stringValue: data.merchant || "direct" },
    affiliateApplied: { booleanValue: Boolean(data.affiliateApplied) },
    note: { stringValue: data.note || "" },
    image: { stringValue: data.image || "" },
    shelfName: { stringValue: data.shelfName || "" },
    shelfSlug: { stringValue: data.shelfSlug || "" },
    views: { integerValue: 0 },
    amazonClicks: { integerValue: 0 },
    shares: { integerValue: 0 }
  };

  return commitCreateDocument(FIRESTORE_COLLECTION, id, fields, ["created"]);
}



function neutralizeText(value = "") {
  // Make URL/code-looking text visible but non-operational in SMS/email previews.
  // Examples: Amazon.com -> Amazon․com, https:// -> https꞉⁄⁄
  return (value || "")
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
    .replace(/>/g, "›")
    .replace(/`/g, "＇")
    .replace(/\[/g, "［")
    .replace(/\]/g, "］")
    .replace(/\{/g, "｛")
    .replace(/\}/g, "｝");
}

function cleanTitle(title = "") {
  return neutralizeText(title)
    .replace(/^Amazon․com\s*\|\s*/i, "")
    .replace(/^eBay․com\s*\|\s*/i, "")
    .replace(/^Walmart․com\s*\|\s*/i, "")
    .trim();
}


function smartTruncate(value = "", maxLength = 90) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  const slice = text.slice(0, Math.max(0, maxLength - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;

  return trimmed.replace(/[\s,;:.-]+$/g, "") + "…";
}

async function saveLastShare(payload) {
  await chrome.storage.local.set({ [LAST_SHARE_STORAGE_KEY]: payload });
}

async function getLastShare() {
  const result = await chrome.storage.local.get([LAST_SHARE_STORAGE_KEY]);
  return result[LAST_SHARE_STORAGE_KEY] || null;
}

async function clearLastShare() {
  await chrome.storage.local.remove([LAST_SHARE_STORAGE_KEY]);
}

function buildMessage({ title, note, shareUrl }) {
  const cleanProductTitle = smartTruncate(cleanTitle(title), 90);
  const cleanNote = smartTruncate(neutralizeText(note).trim(), 140);
  const cleanShareUrl = shareUrl.replace("https://", "").replace("http://", "");

  return [
    "Shared via ShareShuffle:",
    cleanNote ? `💬 ${cleanNote}` : "",
    cleanProductTitle ? `🎯 ${cleanProductTitle}` : "",
    cleanShareUrl ? `🔗 ${cleanShareUrl}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("title");
  const urlInput = document.getElementById("url");
  const noteInput = document.getElementById("note");

  // This accepts either id="shelfName" or id="shelf"
  const shelfNameInput =
    document.getElementById("shelfName") ||
    document.getElementById("shelf");

  const copyBtn = document.getElementById("copyBtn");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const emailBtn = document.getElementById("emailBtn");
  const textBtn = document.getElementById("textBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const actions = document.getElementById("actions");
  const shelfActions = document.getElementById("shelfActions");
  const openShelf = document.getElementById("openShelf");
  const status = document.getElementById("status");
  const lastSharePanel = document.getElementById("lastSharePanel");
  const lastShareTitle = document.getElementById("lastShareTitle");
  const newShareBtn = document.getElementById("newShareBtn");

  let lastShareUrl = "";
  let lastMessage = "";
  let lastShelfUrl = "";

  const tab = await getCurrentTab();

  titleInput.value = tab?.title || "";
  urlInput.value = tab?.url || "";

  let pageMetadata = { title: tab?.title || "", description: "", image: "" };
  try {
    pageMetadata = await getPageMetadata(tab.id);
    if (pageMetadata.title) titleInput.value = cleanTitle(pageMetadata.title);
    if (pageMetadata.description && noteInput && !noteInput.value) {
      noteInput.placeholder = smartTruncate(pageMetadata.description, 120);
    }
    if (status && pageMetadata.image) status.textContent = "Found page image and details.";
  } catch (error) {
    console.warn("Could not read page metadata; using tab title and URL.", error);
  }

  const savedLastShare = await getLastShare();
  if (savedLastShare) {
    const samePage = savedLastShare.originalUrl === (tab?.url || "");

    // Always keep the last share available so users can reopen the popup
    // after texting/emailing and send the same link again.
    lastShareUrl = savedLastShare.shareUrl || "";
    lastMessage = savedLastShare.message || "";
    lastShelfUrl = savedLastShare.shelfUrl || "";

    // Only repopulate editable fields when the user is still on the same page.
    // This prevents an old share from overwriting the current tab's title/URL.
    if (samePage) {
      titleInput.value = savedLastShare.title || titleInput.value;
      noteInput.value = savedLastShare.note || "";
      if (shelfNameInput) shelfNameInput.value = savedLastShare.shelfName || "";
    }

    if (lastShareUrl && lastMessage) {
      actions.style.display = "grid";
      status.textContent = samePage ? "Last share restored." : "Last share ready to send again.";
    }

    if (lastShelfUrl) {
      openShelf.href = lastShelfUrl;
      shelfActions.style.display = "block";
    }

    if (lastSharePanel) {
      lastSharePanel.style.display = "block";
      lastShareTitle.textContent = cleanTitle(savedLastShare.title || "Shared find");
    }
  }

  await renderShelfPills(shelfNameInput);

  copyBtn.addEventListener("click", async () => {
    try {
      status.textContent = "Creating share link...";
      copyBtn.disabled = true;

      const id = await createUniqueId();
      const metadata = pageMetadata?.image ? pageMetadata : await getPageMetadata(tab.id);
      const image = metadata.image || "";
      const shelf = await createShelfIfNeeded(shelfNameInput?.value || "");

      await saveShelfName(shelfNameInput?.value || "");
      await renderShelfPills(shelfNameInput);

      const originalUrl = urlInput.value;
      const affiliateUrl = buildAffiliateUrl(originalUrl);
      const merchant = getAffiliateMerchant(originalUrl);

      await createShareDocument(id, {
        title: cleanTitle(titleInput.value),
        url: affiliateUrl,
        originalUrl,
        merchant,
        affiliateApplied: affiliateUrl !== originalUrl,
        note: neutralizeText(noteInput.value),
        image,
        shelfName: shelf.shelfName,
        shelfSlug: shelf.shelfSlug
      });

      const shareUrl = buildTempHandleShareUrl({ id, shelfSlug: shelf.shelfSlug });

const message = buildMessage({
  title: titleInput.value,
  note: noteInput.value,
  shareUrl
});

      lastShareUrl = shareUrl;
      lastMessage = message;
      lastShelfUrl = shelf.shelfUrl || "";

      await saveLastShare({
        id,
        title: titleInput.value,
        note: noteInput.value,
        originalUrl,
        shareUrl,
        message,
        shelfName: shelf.shelfName,
        shelfSlug: shelf.shelfSlug,
        shelfUrl: shelf.shelfUrl || ""
      });

      await navigator.clipboard.writeText(message);

      actions.style.display = "grid";
      status.textContent = `Copied: ${id}`;

      if (lastSharePanel) {
        lastSharePanel.style.display = "block";
        lastShareTitle.textContent = cleanTitle(titleInput.value || "Shared find");
      }

      if (shelf.shelfUrl) {
        openShelf.href = shelf.shelfUrl;
        shelfActions.style.display = "block";
      } else {
        shelfActions.style.display = "none";
      }
    } catch (error) {
      console.error(error);
      status.textContent = "Error. Check console.";
    } finally {
      copyBtn.disabled = false;
    }
  });

  copyLinkBtn.addEventListener("click", async () => {
    if (!lastShareUrl) return;

    await navigator.clipboard.writeText(lastShareUrl);
    status.textContent = "Short link copied.";
  });

  emailBtn.addEventListener("click", () => {
    if (!lastMessage) return;

    const subject = encodeURIComponent("I saw this and thought of you");
    const body = encodeURIComponent(lastMessage);

    window.open(`mailto:?subject=${subject}&body=${body}`);
  });

  textBtn.addEventListener("click", () => {
    if (!lastMessage) return;

    const body = encodeURIComponent(lastMessage);
    window.open(`sms:?&body=${body}`);
  });

  newShareBtn?.addEventListener("click", async () => {
    await clearLastShare();
    lastShareUrl = "";
    lastMessage = "";
    lastShelfUrl = "";
    noteInput.value = "";
    actions.style.display = "none";
    shelfActions.style.display = "none";
    if (lastSharePanel) lastSharePanel.style.display = "none";
    status.textContent = "Ready for a new share.";
  });

  voiceBtn.addEventListener("click", async () => {
    if (!lastMessage) return;

    await navigator.clipboard.writeText(lastMessage);
    window.open("https://voice.google.com/u/0/messages", "_blank");
    status.textContent = "Copied and opened Google Voice.";
  });
});