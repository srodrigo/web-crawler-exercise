import axios from "axios";
import fs from "fs";

import { generateSiteMetadata } from "../webCrawler";

const extractDomain = url => url.replace("http://", "");
const loadWebsitePage = (url, page) =>
  fs.readFileSync(`./src/__tests__/fixtures/${extractDomain(url)}-${page}.html`, "utf8");

const mockPageVisit = (url, page) => {
  axios.get.mockImplementationOnce(() => Promise.resolve({ data: loadWebsitePage(url, page) }));
};

const createSilentLogger = () => ({
  log: () => {},
});

jest.mock("axios");

describe("Web Crawler", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("generates site map from a URL with one level of depth", async () => {
    const url = "http://with-depth-one.com";
    mockPageVisit(url, "mainPage");
    mockPageVisit(url, "product");
    mockPageVisit(url, "features");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: `${url}/product`,
          children: [],
        },
        {
          url: `${url}/features`,
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenCalledWith(url);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/features`);
  });

  it("generates site map from a URL, recursively", async () => {
    const url = "http://website.com";
    mockPageVisit(url, "mainPage");
    mockPageVisit(url, "product");
    mockPageVisit(url, "features");
    mockPageVisit(url, "product-first-page");
    mockPageVisit(url, "product-second-page");
    mockPageVisit(url, "product-second-page-child");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: `${url}/product`,
          children: [
            { url: `${url}/product-first-page`, children: [] },
            {
              url: `${url}/product-second-page`,
              children: [
                {
                  url: `${url}/product-second-page-child`,
                  children: [],
                },
              ],
            },
          ],
        },
        {
          url: `${url}/features`,
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(6);
    expect(axios.get).toHaveBeenCalledWith(url);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/features`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product-first-page`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product-second-page`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/product-second-page-child`);
  });

  it("includes assets", async () => {
    const url = "http://with-assets.com";
    mockPageVisit(url, "mainPage");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: "http://static.external.com/image-file.png?format=1500w",
          children: [],
        },
        {
          url: "//assets.external.com/javascript-file.js",
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not include anchor links", async () => {
    const url = "http://with-anchors.com";
    mockPageVisit(url, "mainPage");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not include mailto links", async () => {
    const url = "http://with-mailto.com";
    mockPageVisit(url, "mainPage");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not fetch external domains, but still includes them", async () => {
    const url = "http://with-external-domain.com";
    mockPageVisit(url, "mainPage");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: "http://to-be-filtered-out.com",
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not visit pages twice", async () => {
    const url = "http://with-duplicate-pages.com";
    mockPageVisit(url, "mainPage");
    mockPageVisit(url, "innerPage");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [{ url: `${url}/inner-page`, children: [] }],
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith(url);
    expect(axios.get).toHaveBeenCalledWith(`${url}/inner-page`);
  });

  it("does not include the same pages twice", async () => {
    const url = "http://with-multiple-occurences.com";
    mockPageVisit(url, "mainPage");
    mockPageVisit(url, "innerPage");
    mockPageVisit(url, "anotherPage");
    mockPageVisit(url, "anotherPage");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: `${url}/inner-page`,
          children: [{ url: `${url}/another-page`, children: [] }],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenCalledWith(url);
    expect(axios.get).toHaveBeenCalledWith(`${url}/inner-page`);
    expect(axios.get).toHaveBeenCalledWith(`${url}/another-page`);
  });
});
