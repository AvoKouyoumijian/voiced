// converts the current pages text to voice and outputs a proptabek downlaod
document.addEventListener("DOMContentLoaded", () =>
  document.getElementById("page").addEventListener("click", async () => {
    // display the file downloading indicater
    document.getElementById("downloading").style.display = "block";
    // call the download link to voice api
    const res = await fetch("/api/link/voice", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        link: "https://www.freecodecamp.org/news/how-to-parse-pdfs-at-scale-in-nodejs-what-to-do-and-what-not-to-do-541df9d2eec1/",
      }),
    });
    // return error if api throws one
    if (!res.ok) {
      const errorDetails = await res.json();
      console.error("Error:", errorDetails.error);
      document.getElementById("downloading").hidden = false;
      return;
    }

    // create a blob file and a downlaod file object
    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // uses a hidden <a> tag to automatically dowload via a link
    const hiddenDownloadLink = document.createElement("a");
    hiddenDownloadLink.href = audioUrl;
    hiddenDownloadLink.download = "voice_output.wav";
    hiddenDownloadLink.click();

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(audioUrl);

    // hide downloading toggle
    document.getElementById("downloading").style.display = "none";
  })
);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("submitfile").addEventListener("click", async () => {
    // display the file downloading indicater
    document.getElementById("downloading").style.display = "block";
    const file = document.getElementById("file").files[0];

    const formData = new FormData();
    formData.append("pdfFile", file);

    const res = await fetch("/api/pdf/voice", {
      method: "POST",
      body: formData,
    });

    // return error if api throws one
    if (!res.ok) {
      const errorDetails = await res.json();
      console.error("Error:", errorDetails.error);
      document.getElementById("downloading").hidden = false;
      return;
    }

    // create a blob file and a downlaod file object
    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // uses a hidden <a> tag to automatically dowload via a link
    const hiddenDownloadLink = document.createElement("a");
    hiddenDownloadLink.href = audioUrl;
    hiddenDownloadLink.download = "voice_output.wav";
    hiddenDownloadLink.click();

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(audioUrl);

    // hide downloading toggle
    document.getElementById("downloading").style.display = "none";
  });
});

function get_URL() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let current_URL = tabs[0].url;
    chrome.runtime.sendMessage({ data: current_URL });
  });
}
