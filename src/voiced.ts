import { crawlPageBody, getURLsFromHTML } from "./crawler";

import child_process from "child_process";
import { Response } from "express-serve-static-core";
import { Transform, Readable, Writable, pipeline } from "node:stream";
import { TransformCallback } from "stream";
import { PdfReader } from "pdfreader";

// trim invalid characters and new lines off a string
class TrimText extends Transform {
  constructor() {
    super();
  }
  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    const transChunk = chunk.toString().replace(/[^a-zA-Z0-9 .,!?]/g, "\n");
    console.log(transChunk.toString());
    this.push(transChunk);
    callback();
  }
}

/**
 * given a valid URL converts the webpages bodies text to voice stored in res
 * @param URL
 * @param res
 * @returns voiced text to res
 */
export const voiceWebPage = async (URL: string, res: Response) => {
  try {
    const pageContent = new Readable({
      read() {},
    });

    await crawlPageBody(URL, pageContent);

    const trimText = new TrimText();
    pageContent.pipe(trimText);

    spawnVoice(trimText, res);
  } catch (err) {
    throw err; // Rethrow to be caught by route handler
  }
};

/**
 * given a valid pdf file converts its text to
 * @param file
 * @param res
 * @returns voiced text to stdout
 */
export const voicePdf = async (file: any, res: Response) => {
  // parse the pdf file
  const pdfContent = new Readable({
    read() {},
  });
  new PdfReader().parseBuffer(file.data, (err, item) => {
    if (err) console.error("Error parsing PDF:", err);
    else if (!item) pdfContent.push(null);
    else if (item.text) pdfContent.push(item.text);
  });

  // pipe the voice of the text to res
  spawnVoice(pdfContent, res);
  return;
};

/**
 * helper function used to process text to voice
 * @param stream
 * @param res
 */
const spawnVoice = (stream: Transform | Readable, res: Response) => {
  // call another instance that converts text to voice
  const espeak = child_process.spawn("./voiced");

  // pipe the text into the voiced
  stream.pipe(espeak.stdin);

  // pipe the text into the voiced
  espeak.stdout.pipe(res);

  // upon any errors on the process throw an error
  espeak.stderr.on("data", (data) => {
    throw new Error(`espeak error:, ${data.toString()}`);
  });
};
