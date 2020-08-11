import fs from "fs";

import { generateSiteMetadata } from "./webCrawler";
import formatSiteMap from "./siteMapFormatter";
import { createLogger, createSilentLogger } from "./logger";

const printMetadata = async (url, mode) => {
  const logger = mode === "--production" ? createLogger() : createSilentLogger();
  const metadata = await generateSiteMetadata(url, logger);
  const siteMap = formatSiteMap(metadata.siteMap);

  fs.writeFileSync("./output/siteMap.txt", siteMap);

  logger.log("\n*** SITE MAP ***\n");
  logger.log(siteMap);
};

const url = process.argv[2];
const mode = process.argv[3];

printMetadata(url, mode);
