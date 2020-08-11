import axios from "axios";
import { JSDOM } from "jsdom";

const isRelativePath = url => /^\/[\w\d\-]+/g.test(url);
const isValidUrl = url => /(^http[s]?:\/{2})|(^www)|(^\/{1,2}[\w\d\-]+)/g.test(url);

const createNode = (url, children = []) => ({
  url,
  children,
});

const findNodeWithUrl = (siteMap, url) => {
  if (siteMap.url === url) {
    return siteMap;
  }

  const children = [...siteMap.children];
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

const generateSiteMap = async (rootUrl, logger) => {
  const siteMap = createNode(rootUrl);

  const domain = new URL(rootUrl).hostname;
  const visitedPages = [];

  const addHostname = url =>
    url.includes(domain) || !isRelativePath(url) ? url : `${rootUrl}${url}`;

  const urlsToFetch = [addHostname(rootUrl)];

  const processLinks = (document, parent) => {
    [...document.querySelectorAll("a[href], link[href]")]
      .map(link => link.getAttribute("href"))
      .filter(url => isValidUrl(url))
      .map(addHostname)
      .forEach(url => {
        if (!visitedPages.includes(url) && !urlsToFetch.includes(url) && isValidUrl(url)) {
          parent.children.push(createNode(url));

          if (url.includes(domain)) {
            urlsToFetch.push(url);
          }
        }
      });
  };

  const processScripts = (document, parent) => {
    [...document.querySelectorAll("script[src]")]
      .map(script => script.getAttribute("src"))
      .forEach(url => parent.children.push(createNode(url)));
  };

  while (urlsToFetch.length > 0) {
    const url = urlsToFetch.shift();
    visitedPages.push(url);

    try {
      logger.log(`Fetching ${url}`);
      const { data } = await axios.get(url);
      const dom = new JSDOM(data);
      const { document } = dom.window;

      const parent = findNodeWithUrl(siteMap, url);
      processLinks(document, parent);
      processScripts(document, parent);
    } catch (error) {
      logger.log(`Could not fetch ${url}`);
    }
  }

  return siteMap;
};

const generateSiteMetadata = async (rootUrl, logger = console) => ({
  siteMap: await generateSiteMap(rootUrl, logger),
});

export { generateSiteMetadata };
