// keep track of selected file
let file = null;

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

// upload the selcted pdf file
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "triggerFileUpload") {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/pdf"; // Allow only PDF files

    // store the selcted file
    fileInput.onchange = (event) => {
      file = event.target.files[0];
    };

    // Simulate a click to open the file dialog
    fileInput.click();
  }
});

// retive the uploaded file
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "retirveUploadedFile") sendResponse(file);
});
