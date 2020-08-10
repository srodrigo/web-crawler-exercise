import axios from "axios";
import fs from "fs";

import { generateSiteMetadata } from "../webCrawler";

const extractDomain = url => url.replace("http://", "");
const loadWebsitePage = (url, page) =>
  fs.readFileSync(`./src/__tests__/fixtures/${extractDomain(url)}-${page}.html`, "utf8");

const mockPageVisit = (url, page) => {
  axios.get.mockImplementationOnce(() => Promise.resolve({ data: loadWebsitePage(url, page) }));
};

jest.mock("axios");

describe("Web Crawler", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("generates site map from a URL, recursively", async () => {
    const url = "http://website.com";
    mockPageVisit(url, "mainPage");
    mockPageVisit(url, "product");
    mockPageVisit(url, "features");
    mockPageVisit(url, "product-first-page");
    mockPageVisit(url, "product-second-page");

    const { siteMap } = await generateSiteMetadata(url);

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: "/product",
          name: "Product",
          children: [
            { url: "/product-first-page", name: "Product First Page", children: [] },
            { url: "/product-second-page", name: "Product Second Page", children: [] },
          ],
        },
        {
          url: "/features",
          name: "Features",
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(5);
    expect(axios.get).toHaveBeenCalledWith(url);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/features`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product-first-page`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product-second-page`);
  });

  it("filters anchors out", async () => {
    const url = "http://with-anchors.com";
    mockPageVisit(url, "mainPage");

    const { siteMap } = await generateSiteMetadata(url);

    expect(siteMap).toEqual({
      url,
      children: [],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("filters external domains out", async () => {
    const url = "http://with-external-domain.com";
    mockPageVisit(url, "mainPage");

    const { siteMap } = await generateSiteMetadata(url);

    expect(siteMap).toEqual({
      url,
      children: [],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not visit pages twice", async () => {
    const url = "http://with-duplicate-pages.com";
    mockPageVisit(url, "mainPage");
    mockPageVisit(url, "innerPage");

    const { siteMap } = await generateSiteMetadata(url);

    expect(siteMap).toEqual({
      url,
      children: [{ url: "/inner-page", name: "Inner Page", children: [] }],
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith(url);
    expect(axios.get).toHaveBeenCalledWith(`${url}/inner-page`);
  });
});
