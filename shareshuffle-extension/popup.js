console.log("ShareShuffle popup loaded");

const FIREBASE_PROJECT_ID = "shareshuffle-c7f96";
const FIRESTORE_COLLECTION = "shares";
const SHELVES_COLLECTION = "shelves";
const SHARE_BASE_URL = "https://shfl.me/";
const SHELF_BASE_URL = "https://shareshuffle.com/shelf.html?s=";
const SHELF_STORAGE_KEY = "shareShuffleShelves";

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
  const chars = "23456789abcdefghjklmnpqrstuvwxyz";
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

async function getProductImage(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      return (
        document.querySelector("#landingImage")?.src ||
        document.querySelector("#imgBlkFront")?.src ||
        document.querySelector('meta[property="og:image"]')?.content ||
        document.querySelector('meta[name="twitter:image"]')?.content ||
        ""
      );
    }
  });

  return results?.[0]?.result || "";
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

function buildMessage({ title, note, shareUrl }) {
  const cleanProductTitle = cleanTitle(title).substring(0, 90);
  const cleanNote = neutralizeText(note).trim().substring(0, 140);
  const cleanShareUrl = shareUrl.replace("https://", "").replace("http://", "");

  return [
    "🎯 Shared via Shuffle",
    cleanNote ? `📝 ${cleanNote}` : "",
    cleanProductTitle,
    `🖇️ ${cleanShareUrl}`
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

  let lastShareUrl = "";
  let lastMessage = "";

  const tab = await getCurrentTab();

  titleInput.value = tab?.title || "";
  urlInput.value = tab?.url || "";

  await renderShelfPills(shelfNameInput);

  copyBtn.addEventListener("click", async () => {
    try {
      status.textContent = "Creating share link...";
      copyBtn.disabled = true;

      const id = await createUniqueId();
      const image = await getProductImage(tab.id);
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

      const shareUrl = `${SHARE_BASE_URL}${id}`;

const message = buildMessage({
  title: titleInput.value,
  note: noteInput.value,
  shareUrl
});

      lastShareUrl = shareUrl;
      lastMessage = message;

      await navigator.clipboard.writeText(message);

      actions.style.display = "grid";
      status.textContent = `Copied: ${id}`;

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

  voiceBtn.addEventListener("click", async () => {
    if (!lastMessage) return;

    await navigator.clipboard.writeText(lastMessage);
    window.open("https://voice.google.com/u/0/messages", "_blank");
    status.textContent = "Copied and opened Google Voice.";
  });
});