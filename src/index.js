import { generateSiteMetadata } from "./webCrawler";
import formatSiteMap from "./siteMapFormatter";

const printMetadata = async () => {
  const metadata = await generateSiteMetadata(url);
  console.log(formatSiteMap(metadata.siteMap));
};

const url = process.argv[2];

printMetadata(url);
