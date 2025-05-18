const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".pdf";

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (file) {
    chrome.runtime.sendMessage({
      action: "fileSelected",
      file: {
        name: file.name,
        type: file.type,
        content: await file.arrayBuffer(),
      },
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "triggerFileSelect" && message.offscreen === true) {
    console.log("hereeee1");
    fileInput.click();
  }
});
