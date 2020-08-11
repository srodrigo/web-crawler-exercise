import axios from "axios";
import { JSDOM } from "jsdom";

const isRelativePath = url => /^\/[\w\d\-]+/g.test(url);
const isValidUrl = url => /(^http[s]?:\/{2})|(^www)|(^\/{1,2}[\w\d\-]+)/g.test(url);

const createNode = (url, children = []) => ({
  url,
  children,
});

const findNodeWithUrl = (metadata, url) => {
  if (metadata.url === url) {
    return metadata;
  }

  const children = [...metadata.children];
  while (children.length > 0) {
    const child = children.shift();
    if (child.url === url) {
      return child;
    }

    child.children.forEach(grandChild => {
      children.push(grandChild);
    });
  }

  return null;
};

const generatePageMetadata = async (rootUrl, logger) => {
  const pageMetadata = createNode(rootUrl);

  const domain = new URL(rootUrl).hostname;
  const visitedPages = [];

  const addHostname = url =>
    url.includes(domain) || !isRelativePath(url) ? url : `${rootUrl}${url}`;

  const urlsToFetch = [addHostname(rootUrl)];

  const processLinks = (document, parent) => {
    [...document.querySelectorAll("a[href], link[href]")]
      .map(link => link.getAttribute("href"))
      .filter(link => isValidUrl(link))
      .map(addHostname)
      .forEach(fullLinkUrl => {
        if (
          !visitedPages.includes(fullLinkUrl) &&
          !urlsToFetch.includes(fullLinkUrl) &&
          isValidUrl(fullLinkUrl)
        ) {
          parent.children.push(createNode(fullLinkUrl));
          if (fullLinkUrl.includes(domain)) {
            urlsToFetch.push(fullLinkUrl);
          }
        }
      });
  };

  const processScripts = (document, parent) => {
    [...document.querySelectorAll("script[src]")]
      .map(script => script.getAttribute("src"))
      .forEach(link => parent.children.push(createNode(link)));
  };

  while (urlsToFetch.length > 0) {
    const url = urlsToFetch.shift();
    visitedPages.push(url);

    try {
      logger.log(`Fetching ${url}`);
      const { data } = await axios.get(url);
      const dom = new JSDOM(data);
      const { document } = dom.window;

      const parent = findNodeWithUrl(pageMetadata, url);
      processLinks(document, parent);
      processScripts(document, parent);
    } catch (error) {
      logger.log(`Could not fetch ${url}`);
    }
  }

  return pageMetadata;
};

const generateSiteMetadata = async (rootUrl, logger = console) => ({
  siteMap: await generatePageMetadata(rootUrl, logger),
});

export { generateSiteMetadata };
