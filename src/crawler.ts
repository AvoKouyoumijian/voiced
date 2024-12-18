import { JSDOM } from "jsdom";
import { IncomingMessage } from "http";
import { get } from "https";
import { Parser } from "htmlparser2";
import { Readable } from "stream";

/**
 * send the body of a url to a given stream
 * @param url
 * @param stream
 * @returns chunks to stream
 */
export const crawlPageBody = async function async(
  url: string,
  stream: Readable
) {
  try {
    // read the info of a url as a stream
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
    // return error if recived something of wrong content type
    const contentType = getPageStream.headers["content-type"] as string;
    if (!contentType || !contentType.includes("text/html")) {
      console.log(
        `content type error ${getPageStream.statusCode} on page: ${url}`
      );
      return;
    }

    // inititlise a parser to read content only in body
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

    // Stream response data in getBody for it to pasrse the body
    for await (const chunk of getPageStream) {
      getBody.write(chunk.toString());
    }
    getBody.end();

    // indicate end of input recived
    stream.push(null);
  } catch (err) {
    // indicate end of input recived
    stream.push(null);
    // give error to parent function
    throw new Error(`Error crawling page: ${err}`);
  }
};

/**
 * return a array of urls found in a html body
 * @param htmlBody
 * @param baseURL
 */
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
  return urls;
};
