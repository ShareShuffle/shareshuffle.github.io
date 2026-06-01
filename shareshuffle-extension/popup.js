console.log("ShareShuffle popup loaded");

const FIREBASE_PROJECT_ID = "shareshuffle-c7f96";
const FIRESTORE_COLLECTION = "shares";
const SHARE_BASE_URL = "https://shareshuffle.com/share.html?id=";
const FIRESTORE_URL =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${FIRESTORE_COLLECTION}`;

function makeShortId(length = 6) {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
}

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  console.log("tabs query result:", tabs);

  return tabs[0];
}

async function createShareDocument(id, data) {
  const url = `${FIRESTORE_URL}?documentId=${id}`;

  const body = {
    fields: {
      title: { stringValue: data.title || "" },
      url: { stringValue: data.url || "" },
      note: { stringValue: data.note || "" },
      created: { timestampValue: new Date().toISOString() },
      views: { integerValue: 0 },
      amazonClicks: { integerValue: 0 }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("title");
  const urlInput = document.getElementById("url");
  const noteInput = document.getElementById("note");
  const copyBtn = document.getElementById("copyBtn");
  const status = document.getElementById("status");



  console.log("DOMContentLoaded fired");

const tab = await getCurrentTab();

console.log("TAB:", tab);

  titleInput.value = tab?.title || "";
  urlInput.value = tab?.url || "";

  copyBtn.innerText = "Create Share Link";

  copyBtn.addEventListener("click", async () => {
    try {
      status.textContent = "Creating share link...";

      const id = makeShortId();

      await createShareDocument(id, {
        title: titleInput.value,
        url: urlInput.value,
        note: noteInput.value
      });

      const shareUrl = `${SHARE_BASE_URL}${id}`;

      const message = [
        noteInput.value || "I saw this and thought of you.",
        "",
        shareUrl,
        "",
        "Shared with ShareShuffle"
      ].join("\n");

      await navigator.clipboard.writeText(message);

      status.textContent = `Copied: ${id}`;
    } catch (error) {
      console.error(error);
      status.textContent = "Error. Check console.";
    }
  });
});