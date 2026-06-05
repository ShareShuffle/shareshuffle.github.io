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


async function updateExtensionBadge(tabId, url) {
  const liked = isLikedSite(url);

  //await chrome.action.setIcon({
   // tabId,
   // path: liked
     // ? {
       //   16: "icons/icon16a.png",
         // 24: "icons/icon24a.png",
    //      32: "icons/icon32a.png",
      //    64: "icons/icon64a.png"
        //}
     // : {
        //  16: "icons/icon16.png",
         // 24: "icons/icon24.png",
        //  32: "icons/icon32.png",
        //  64: "icons/icon64.png"
       // }
 // });

  await chrome.action.setBadgeText({
    tabId,
    // text: liked ? "●" : "" // not going to use a circle for now
    text: liked ? "✓" : "" // trying the word share
    // text: liked ? "link" : ""
    // text: liked ? "·" : ""
   });

  await chrome.action.setBadgeTextColor({
  tabId,
   color: "#ffffff"
   });

   await chrome.action.setBadgeBackgroundColor({
   tabId,
  color: "#228800"
   });



  await chrome.action.setTitle({
    tabId,
    title: liked
      ? "ShareShuffle supports this site: "
      : "ShareShuffle: "
  });
}



