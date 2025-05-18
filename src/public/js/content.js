// keep track of selected file
let file = null;
let storageId = -1;

//get the link of the current url that the user is on
const getCurrentUrl = async () => {
  console.log("gettinn url");
  const link = await chrome.runtime.sendMessage("getCurrentUrl");
  return link;
};

document.addEventListener("DOMContentLoaded", () => {
  //listen for HTML page choosing
  document.getElementById("page").addEventListener("click", async () => {
    document.getElementById("downloading").style.display = "block";
    document.getElementById("error").style.display = "none";
    const link = await getCurrentUrl();

    if (!link) {
      console.error(`link received from the background script. url: ${link}`);
      document.getElementById("downloading").style.display = "none";
      return;
    }
    const res = await fetch("http://127.0.0.1:2000/api/link/voice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ link: link }),
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      document.getElementById("downloading").style.display = "none";
      if (res.status < 500) {
        document.getElementById(
          "error"
        ).innerHTML = `needs to be a valid HTTPS url`;
        document.getElementById("error").style.display = "block";
      } else {
        console.error("Error:", errorDetails.error);
      }
      return;
    }

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const hiddenDownloadLink = document.createElement("a");
    hiddenDownloadLink.href = audioUrl;
    hiddenDownloadLink.download = "voiced.mp3";
    hiddenDownloadLink.click();

    URL.revokeObjectURL(audioUrl);
    document.getElementById("downloading").style.display = "none";
  });

  // document.getElementById("file").addEventListener("click", async () => {
  //   chrome.runtime.sendMessage({
  //     action: "triggerFileSelect",
  //     offscreen: false,
  //   });
  //   console.log("here1");
  //   // window.close();
  // });

  // popup.js
  document.getElementById("file").addEventListener("click", () => {
    // Create hidden file input in the popup
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        // Process the file immediately
        const formData = new FormData();
        formData.append("pdfFile", file);

        try {
          const response = await fetch("http://127.0.0.1:2000/api/pdf/voice", {
            method: "POST",
            body: formData,
          });
          // Handle response...
        } catch (error) {
          console.error("Upload failed:", error);
        }
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click(); // This works because it's triggered by user click
    document.body.removeChild(fileInput);
  });

  document
    .getElementById("submitfile")
    .addEventListener("click", async (event) => {
      event.preventDefault();
      document.getElementById("downloading").style.display = "block";
      document.getElementById("error").style.display = "none";
      const file = await chrome.runtime.sendMessage("retirveUploadedFile");

      const formData = new FormData();
      formData.append("pdfFile", file);

      const res = await fetch("http://127.0.0.1:2000/api/pdf/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorDetails = await res.json();
        document.getElementById("downloading").style.display = "none";
        if (res.status < 500) {
          document.getElementById(
            "error"
          ).innerHTML = `need to be a valid pdf file`;
          document.getElementById("error").style.display = "block";
        } else {
          console.error("Error:", errorDetails.error);
        }
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const hiddenDownloadLink = document.createElement("a");
      hiddenDownloadLink.href = audioUrl;
      hiddenDownloadLink.download = "voiced.mp3";
      hiddenDownloadLink.click();

      URL.revokeObjectURL(audioUrl);
      document.getElementById("downloading").style.display = "none";
    });

  // Listen for file selection completion
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "fileSelected") {
      // Process the file immediately
      file = new File([message.file.content], message.file.name, {
        type: message.file.type,
      });

      document.getElementById("downloading").style.display = "block";
    }
  });
});
