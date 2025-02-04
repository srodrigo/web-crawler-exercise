import axios from "axios";
import { JSDOM } from "jsdom";

const isRelativePath = url => /^\/[\w\d\-]+/g.test(url);

const isValidUrl = url => /(^http[s]?:\/{2})|(^www)|(^\/{1,2}[\w\d\-]+)/g.test(url);

const parseDomain = url => new URL(url).hostname;

const escapeDots = url => url.replace(".", "\\.");

const startsWithDomain = (url, domain) => {
  const escapedDomain = escapeDots(domain);
  return new RegExp(
    `(^http[s]?:\/{2}(www\.)?${escapedDomain})|(^www\.${escapedDomain})|(^${escapedDomain})`
  ).test(url);
};

const removeTrailingSlash = url => {
  const endPosition = url.length - 1;
  return url.charAt(endPosition) === "/" ? url.substring(0, endPosition) : url;
};

const addRootUrl = rootUrl => url =>
  url.includes(parseDomain(rootUrl)) || !isRelativePath(url)
    ? removeTrailingSlash(url)
    : `${removeTrailingSlash(rootUrl)}${url}`;

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
};

const generateSiteMap = async (rootUrl, logger) => {
  const siteMap = createNode(rootUrl);

  const visitedPages = [];
  const urlsToFetch = [rootUrl];

  const processLinks = (document, parent) => {
    const domain = parseDomain(rootUrl);

    [...document.querySelectorAll("a[href], link[href]")]
      .map(link => link.getAttribute("href"))
      .filter(url => isValidUrl(url))
      .map(addRootUrl(rootUrl))
      .forEach(url => {
        if (!visitedPages.includes(url) && !urlsToFetch.includes(url) && isValidUrl(url)) {
          parent.children.push(createNode(url));

          if (startsWithDomain(url, domain)) {
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
