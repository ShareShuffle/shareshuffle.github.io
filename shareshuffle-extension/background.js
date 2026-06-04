const LIKED_DOMAINS = [
  "amazon.com",
  "walmart.com",
  "target.com",
  "bestbuy.com",
  "ebay.com"
];

function isLikedSite(url) {
  try {
    const parsed = new URL(url);

    return LIKED_DOMAINS.some((domain) =>
      parsed.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}

async function updateExtensionBadge(tabId, url) {
  if (isLikedSite(url)) {
    await chrome.action.setBadgeText({
      tabId,
      text: "●"
    });

    await chrome.action.setBadgeBackgroundColor({
      tabId,
      color: "#22c55e"
    });

    await chrome.action.setTitle({
      tabId,
      title: "ShareShuffle supports this site"
    });
  } else {
    await chrome.action.setBadgeText({
      tabId,
      text: ""
    });

    await chrome.action.setTitle({
      tabId,
      title: "ShareShuffle"
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab.url;

  if (!url) {
    return;
  }

  updateExtensionBadge(tabId, url);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);

  if (!tab.url) {
    return;
  }

  updateExtensionBadge(tab.id, tab.url);
});