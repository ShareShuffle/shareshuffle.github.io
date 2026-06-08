console.log("ShareShuffle popup loaded");

const FIREBASE_PROJECT_ID = "shareshuffle-c7f96";
const FIRESTORE_COLLECTION = "shares";
const SHARE_BASE_URL = "https://shfl.me/";

const FIRESTORE_URL =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${FIRESTORE_COLLECTION}`;

function makeShortId(length = 5) {
  const chars = "23456789abcdefghjklmnpqrstuvwxyz";
  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }

  return id;
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

  console.log("tabs query result:", tabs);

  return tabs[0];
}

async function getProductImage(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const image =
        document.querySelector("#landingImage")?.src ||
        document.querySelector("#imgBlkFront")?.src ||
        document.querySelector('meta[property="og:image"]')?.content ||
        document.querySelector('meta[name="twitter:image"]')?.content ||
        "";

      return image;
    }
  });

  return results?.[0]?.result || "";
}

async function createShareDocument(id, data) {
  const url = `${FIRESTORE_URL}?documentId=${id}`;

  const body = {
    fields: {
      title: { stringValue: data.title || "" },
      url: { stringValue: data.url || "" },
      note: { stringValue: data.note || "" },
      image: { stringValue: data.image || "" },
      created: { timestampValue: new Date().toISOString() },
      views: { integerValue: 0 },
      amazonClicks: { integerValue: 0 },
      shares: { integerValue: 0 }
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

const emailBtn = document.getElementById("emailBtn");
const textBtn = document.getElementById("textBtn");
const voiceBtn = document.getElementById("voiceBtn");

  let lastShareUrl = "";
  let lastMessage = "";

  console.log("DOMContentLoaded fired");

  const tab = await getCurrentTab();

  console.log("TAB:", tab);

  titleInput.value = tab?.title || "";
  urlInput.value = tab?.url || "";

  copyBtn.innerText = "Create Share Link";

  copyBtn.addEventListener("click", async () => {
    try {
      status.textContent = "Creating share link...";

      const id = await createUniqueId();
      const image = await getProductImage(tab.id);

      await createShareDocument(id, {
        title: titleInput.value,
        url: urlInput.value,
        note: noteInput.value,
        image
      });

      const shareUrl = `${SHARE_BASE_URL}${id}`;

      lastShareUrl = shareUrl;
copyLinkBtn.style.display = "block";

      const message = [
        noteInput.value || "I saw this and thought of you.",
        "",
        shareUrl,
        "",
        "Shared with ShareShuffle"
      ].join("\n");

lastMessage = message;

emailBtn.style.display = "block";
textBtn.style.display = "block";
voiceBtn.style.display = "block";


      await navigator.clipboard.writeText(message);

      status.textContent = `Copied: ${id}`;
    } catch (error) {
      console.error(error);
      status.textContent = "Error. Check console.";
    }



  });

emailBtn.addEventListener("click", () => {

  const subject =
    encodeURIComponent("I saw this and thought of you");

  const body =
    encodeURIComponent(lastMessage);

  window.open(
    `mailto:?subject=${subject}&body=${body}`
  );

});


textBtn.addEventListener("click", () => {

  const body =
    encodeURIComponent(lastMessage);

  window.open(
    `sms:?&body=${body}`
  );

});

voiceBtn.addEventListener("click", async () => {

  await navigator.clipboard.writeText(
    lastMessage
  );

  window.open(
    "https://voice.google.com/u/0/messages",
    "_blank"
  );

  status.textContent =
    "Copied and opened Google Voice.";

});


copyLinkBtn.addEventListener("click", async () => {
  if (!lastShareUrl) return;

  await navigator.clipboard.writeText(lastShareUrl);

  status.textContent = "Short link copied.";
});


});