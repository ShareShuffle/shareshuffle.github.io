async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

function buildMessage({ title, url, note }) {
  const cleanNote = note.trim();

  return [
    cleanNote || "I saw this and thought of you.",
    "",
    title,
    url,
    "",
    "Shared with ShareShuffle"
  ].join("\n");
}

document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("title");
  const urlInput = document.getElementById("url");
  const noteInput = document.getElementById("note");
  const copyBtn = document.getElementById("copyBtn");
  const status = document.getElementById("status");

  const tab = await getCurrentTab();

  titleInput.value = tab.title || "";
  urlInput.value = tab.url || "";

  copyBtn.addEventListener("click", async () => {
    const message = buildMessage({
      title: titleInput.value,
      url: urlInput.value,
      note: noteInput.value
    });

    await navigator.clipboard.writeText(message);

    status.textContent = "Copied. Now paste it into a text, email, or chat.";
  });
});
