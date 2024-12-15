import { JSDOM } from "jsdom";
import { IncomingMessage } from "http";
import { get } from "https";
import { Response, response } from "express";
import { Parser } from "htmlparser2";
import { Readable } from "stream";

export const crawlPageBody = async function async(
  url: string,
  stream: Readable
) {
  try {
    const toGetPageStream = () =>
      new Promise<IncomingMessage>((resolve, reject) => {
        get(url, (response) => {
          if (response.statusCode && response.statusCode > 399) {
            return reject(
              new Error(
                `Error: HTTP status ${response.statusCode} for URL: ${url}`
              )
            );
          }
          resolve(response);
        }).on("error", reject);
      });
    const getPageStream = await toGetPageStream();

    const contentType = getPageStream.headers["content-type"] as string;
    if (!contentType || !contentType.includes("text/html")) {
      console.log(
        `content type error ${getPageStream.statusCode} on page: ${url}`
      );
      return;
    }

    let inBody: boolean = false;
    const getBody = new Parser({
      onopentag(name, attribs) {
        if (name == "body") {
          inBody = true;
        }
      },
      ontext(text) {
        if (inBody) {
          stream.push(text);
        }
      },
      onclosetag(name) {
        if (name == "body") {
          inBody = false;
        }
      },
    });

    // getPageStream.pipe(getBody)

    // Stream response data in chunks
    for await (const chunk of getPageStream) {
      getBody.write(chunk.toString());
    }
    getBody.end();
    stream.push(null);
  } catch (err) {
    console.error("Error crawling page:", err);
    stream.push(null);
  }
};

export const unmarkupContent = async (url: string, htmlBody: string) => {
  const dom = new JSDOM.fromURL();
  const body = dom.window.document.querySelector("body").textContent;
  return body;
};

export const getURLsFromHTML = (htmlBody: string, baseURL: string): void => {
  const urls = [] as any;
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

export const normalizeURL = (URLstring: string): string => {
  const urlObj = new URL(URLstring);
  const hostPath = `${urlObj.hostname}${urlObj.pathname}`;
  if (hostPath.length > 0 && hostPath.slice(-1) === "/") {
    return hostPath.slice(0, -1);
  }
  return hostPath;
};
function resolve(response: any) {
  throw new Error("Function not implemented.");
}
