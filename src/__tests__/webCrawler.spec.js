import axios from "axios";
import fs from "fs";

import { generateSiteMetadata } from "../webCrawler";

const extractDomain = url => url.replace("http://", "");
const loadWebsitePage = (url, page) =>
  fs.readFileSync(`./src/__tests__/fixtures/${extractDomain(url)}-${page}.html`, "utf8");

jest.mock("axios");

describe("Web Crawler", () => {
  it("generates site map from a URL", async () => {
    const url = "http://website.com";
    axios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: loadWebsitePage(url, "mainPage"),
      })
    );

    const { siteMap } = await generateSiteMetadata(url);

    await expect(siteMap).toEqual({
      url: "http://website.com",
      children: [
        { url: "/product", name: "Product" },
        { url: "/features", name: "Features" },
        { url: "/solutions", name: "Solutions" },
        { url: "/blog", name: "Blog" },
      ],
    });
  });
});
