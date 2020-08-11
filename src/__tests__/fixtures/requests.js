import axios from "axios";
import fs from "fs";

const extractDomain = url => url.replace("http://", "").replace("/", "");
const loadWebsitePage = (url, page) =>
  fs.readFileSync(`./src/__tests__/fixtures/${extractDomain(url)}-${page}.html`, "utf8");

const mockPageVisit = (url, page) => {
  axios.get.mockImplementationOnce(() => Promise.resolve({ data: loadWebsitePage(url, page) }));
};

export { mockPageVisit };
