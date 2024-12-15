import {
  crawlPageBody,
  getURLsFromHTML,
  normalizeURL,
  unmarkupContent,
} from "./crawler";

import child_process from "child_process";
import fileUpload from "express-fileupload";
import { Response } from "express-serve-static-core";
import fs, { read } from "fs";
import { Transform, Readable, Writable, pipeline } from "node:stream";
import { TransformCallback } from "stream";
import { PdfReader } from "pdfreader";
import PdfParse from "pdf-parse";

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
    const transChunk = chunk.toString().replace(/[^a-zA-Z0-9 .,!?]/g, "");
    this.push(transChunk);
    callback();
  }
}
// given a valid URL converts the webpages bodies text to voice stored in res
export const voiceWebPage = async (URL: string, res: Response) => {
  const pageContent = new Readable({
    read() {},
  });

  crawlPageBody(URL, pageContent);

  const trimText = new TrimText();
  pageContent.pipe(trimText);

  // pipe the voice of the text to res
  spawnVoice(trimText, res);
  return;
};

export const voicePdf = async (file: any, res: Response) => {
  // get the text of the pdf

  const trimText = new TrimText();

  new PdfReader().parseBuffer(file.data, (err, item) => {
    if (err) console.error("Error parsing PDF:", err);
    else if (!item) {
      console.warn("end of buffer");
      trimText.push(null);
    } else if (item.text) trimText.push(item.text);
  });

  // trimText.pipe(process.stdout);

  // pipe the voice of the text to res
  spawnVoice(trimText, res);
  return;
};

const spawnVoice = (stream: Transform, res: Response) => {
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
