chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    const { file_name, file_content, data } = request;

    if (file_name && file_content) {
        const formData = new FormData();
        formData.append('file_name', file_name);
        formData.append('file_content', file_content);

        fetch('http://127.0.0.1:5000/download', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            mode: 'cors',
        })
        .then(response => response.json())
        .then(data => {
            sendResponse(data);
        })
   } else if (data) {
    // Send the data as a JSON string
    fetch('http://127.0.0.1:5000/downloadurl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify({ url: data }),
        credentials: 'include',
        mode: 'cors',
    })
    .then(response => response.json())
    .then(data => {
        sendResponse(data);
    })
}
    return true;
});