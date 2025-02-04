import axios from "axios";

import { generateSiteMetadata } from "../webCrawler";
import { mockPageVisit } from "./fixtures/requests";
import { createSilentLogger } from "../logger";

jest.mock("axios");

describe("Web Crawler", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("generates site map from a URL with one level of depth", async () => {
    const url = "http://depth-one.com";
    mockPageVisit(url, "main-page");
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

  it("generates site map from a URL with trailing slash", async () => {
    const url = "http://depth-one.com/";
    mockPageVisit(url, "main-page");
    mockPageVisit(url, "product");
    mockPageVisit(url, "features");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: `${url}product`,
          children: [],
        },
        {
          url: `${url}features`,
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenCalledWith(url);
    expect(axios.get).toHaveBeenCalledWith(`${url}product`);
    expect(axios.get).toHaveBeenCalledWith(`${url}features`);
  });

  it("generates site map from a URL, recursively", async () => {
    const url = "http://multiple-levels-of-depth.com";
    mockPageVisit(url, "main-page");
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
    const url = "http://assets.com";
    mockPageVisit(url, "main-page");

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

  it("does not fetch non-fetchable assets, but still includes them", async () => {
    const url = "http://non-fetchable-assets.com";
    mockPageVisit(url, "main-page");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: "http://file.pdf",
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not include anchor links", async () => {
    const url = "http://anchors.com";
    mockPageVisit(url, "main-page");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not include mailto links", async () => {
    const url = "http://mailto.com";
    mockPageVisit(url, "main-page");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not fetch external domains, but still includes them", async () => {
    const url = "http://external-domain.com";
    mockPageVisit(url, "main-page");

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

  it("does not fetch external domains containing a reference to the website domain, but still includes them", async () => {
    const url = "http://external-domain-with-reference.com";
    mockPageVisit(url, "main-page");

    const { siteMap } = await generateSiteMetadata(url, createSilentLogger());

    expect(siteMap).toEqual({
      url,
      children: [
        {
          url: "http://to-be-filtered-out.com?ref=with-external-domain-with-reference.com/some-url",
          children: [],
        },
      ],
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(url);
  });

  it("does not visit pages twice", async () => {
    const url = "http://duplicate-pages.com";
    mockPageVisit(url, "main-page");
    mockPageVisit(url, "inner-page");

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
    const url = "http://multiple-occurences.com";
    mockPageVisit(url, "main-page");
    mockPageVisit(url, "inner-page");
    mockPageVisit(url, "another-page");
    mockPageVisit(url, "another-page");

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
