import { crawlPage, getURLsFromHTML, normalizeURL } from "./crawler.js";

const main = () => {
  if (process.arch.length < 3) {
    console.log("no website provided");
    process.exit(1);
  } else if (process.arch.length > 3) {
    console.log("to many arumnets");
    process.exit(1);
  }

  const currentURL = process.argv[2];

  crawlPage(currentURL);
};

main();
