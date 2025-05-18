import { JSDOM } from "jsdom";
import { IncomingMessage } from "http";
import { get } from "https";
import { Parser } from "htmlparser2";
import { Readable } from "stream";

// define stack ADT:
class Stack {
  private items: any[];
  private count: number;
  constructor() {
    this.items = [];
    this.count = 0;
  }

  //add element to the top of the stack
  push(element) {
    this.items[this.count] = element;
    this.count += 1;
  }

  //return and remove the top element in the stack
  // returns undifined if stack is empty
  pop() {
    if (this.count == 0) return undefined;
    let popItem = this.items[this.count - 1];
    this.count -= 1;
    return popItem;
  }

  // look at the topmost value in the stack without removing it
  peek() {
    return this.items[this.count - 1];
  }

  // return weather the stack is empty or not
  isEmpty() {
    return this.count === 0;
  }

  print() {
    console.log("stack elements:");
    for (let i = 0; i < this.count; i++) {
      console.log(`${this.items[i]}`);
    }
    console.log("");
  }
}

/**
 * send the body of a url to a given stream
 * @param url
 * @param stream
 * @returns chunks to stream
 */

export const crawlPageBody = async (url: string, stream: Readable) => {
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

    // inititlise a parser to read text only in body
    let inBody: boolean = false;
    let tags = [
      // Block text containers
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "li",
      "td",
      "th",
      "blockquote",
      // Inline text containers
      "span",
      "a",
      "strong",
      "em",
      "i",
      "b",
      "code",
      "label",
      "button",
    ];
    const s = new Stack();
    const getBody = new Parser({
      onopentag(name, attribs) {
        if (s.isEmpty()) {
          if (name == "body") {
            s.push(name);
            inBody = true;
          }
        } else {
          if (tags.includes(name)) {
            s.push(name);
            inBody = true;
          }
        }
      },
      ontext(text) {
        if (inBody) {
          stream.push(text);
        }
      },
      // only pop if the closing tag matches or give invalid HTML error
      onclosetag(name) {
        if (tags.includes(name) && !s.isEmpty()) {
          if (s.peek() !== name) {
            throw new Error(
              `Invalid HTML: Expected </${s.peek()}>, got </${name}>`
            );
          }
          s.pop();
          inBody = !s.isEmpty();
        } else if (name == "body") {
          inBody = false;
          s.pop();
        }
      },
    });

    // Stream response data in getBody for it to pasrse the body
    for await (const chunk of getPageStream) {
      getBody.write(chunk.toString());
    }
    getBody.end();
    stream.push(null);
  } catch (err) {
    // indicate end of input recived
    stream.push(null);
    // give error to parent function
    throw err;
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
