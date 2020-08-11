import { generateSiteMetadata } from "./webCrawler";
import formatSiteMap from "./siteMapFormatter";
import { createLogger, createSilentLogger } from "./logger";

const printMetadata = async (url, mode) => {
  const logger = mode === "--production" ? createLogger() : createSilentLogger();
  const metadata = await generateSiteMetadata(url, logger);
  logger.log(formatSiteMap(metadata.siteMap));
};

const url = process.argv[2];
const mode = process.argv[3];

printMetadata(url, mode);
