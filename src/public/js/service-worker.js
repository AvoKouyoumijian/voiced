/**
 * converting text in a certain URL to voice
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "getCurrentUrl") {
    getCurrentUrl().then((res) => {
      console.log(`returning: ${res}`);
      sendResponse(res);
    });
    return true;
  }
});

// gets the current tab that the user is on
async function getCurrentUrl() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  console.log("Found tab with URL:", tab.url); // Log the URL
  return tab.url;
}

/**
 * converting text in a currrent pdf to voice
 *
 */

/**
 * creates an offscrean document if none made already
 * @returns void
 */
const hasOffscreenDocument = async () => {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "src/public/html/offscreen.html",
    reasons: ["BLOBS"],
    justification: "save a file chosen without closing popup",
  });
};

// upload the selcted pdf file
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "triggerFileSelect" && message.offscreen === false) {
    console.log("hjereeeeee");
    await hasOffscreenDocument();
    chrome.runtime.sendMessage({
      action: "triggerFileSelect",
      offscreen: true,
    });
  }
  return true;
  // console.log(`action: ${message.action} off: ${message.offscreen}`);
});

// retive the uploaded file
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "retirveUploadedFile") sendResponse(file);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "print") {
    console.log("print");
    return true;
  }
});

// runtime API

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action === "triggerFileUploadClickonInput" &&
    message.offscreen === false
  ) {
    console.log("hereee3");
    message.input.click();
    return true;
  }
});
