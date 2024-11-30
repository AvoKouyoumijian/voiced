import { JSDOM } from "jsdom";

export const crawlPage = async (currentURL) => {
  try {
    const res = await fetch(currentURL);

    if (res.status > 399) {
      console.log(
        `error in fetch with status code ${res.status} on page: ${currentURL}`
      );
      return;
    }
    const contentType = res.headers.get("content-type");
    if (!contentType.includes("text/html")) {
      console.log(`content type error ${res.status} on page: ${currentURL}`);
      return;
    }

    console.log(await res.text());
    // return res.text();
  } catch (err) {
    console.error("Error crawling page:", err);
  }
};

export const getURLsFromHTML = (htmlBody, baseURL) => {
  const urls = [];
  const dom = new JSDOM(htmlBody);
  const linkElements = dom.window.document.querySelector("a");
  for (const linkElement of linkElements) {
    if (linkElement.href.slice(0, 1) === "/") {
      // reletive
      try {
        const urlObj = new URL(`${baseURL}${linkElement.href}`);
        urls.push(urlObj.href);
      } catch (err) {
        console.log(`error with reletive url: ${err.message}`);
      }
    } else {
      // abseloute
      try {
        const urlObj = new URL(linkElement);
        urls.push(urlObj.href);
      } catch (err) {
        console.log(`error with abseloute url: ${err.message}`);
      }
    }
  }
};

export const normalizeURL = (URLstring) => {
  const urlObj = new URL(URLstring);
  const hostPath = `${urlObj.hostname}${urlObj.pathname}`;
  if (hostPath.length > 0 && hostPath.slice(-1) === "/") {
    return hostPath.slice(0, -1);
  }
  return hostPath;
};
