import axios from "axios";
import { JSDOM } from "jsdom";

const generateSiteMetadata = async (rootUrl, logger = console) => {
  const domain = new URL(rootUrl).hostname;

  const isRelativePath = url => /^\/[\w\d\-]+/g.test(url);
  const isValidUrl = url => /(^http[s]?:\/{2})|(^www)|(^\/{1,2}[\w\d\-]+)/g.test(url);

  const addHostname = url =>
    url.includes(domain) || !isRelativePath(url) ? url : `${rootUrl}${url}`;

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

  const createNode = (url, children = []) => ({
    url,
    children,
  });

  const generatePageMetadata = async () => {
    const pageMetadata = createNode(rootUrl);

    const visitedPages = [];
    const urlsToFetch = [addHostname(rootUrl)];

    while (urlsToFetch.length > 0) {
      const fullUrl = urlsToFetch.shift();
      visitedPages.push(fullUrl);

      try {
        logger.log(`Fetching ${fullUrl}`);
        const { data } = await axios.get(fullUrl);
        const dom = new JSDOM(data);
        const { document } = dom.window;

        const parent = findNodeWithUrl(pageMetadata, fullUrl);
        [...document.querySelectorAll("a")]
          .filter(link => {
            const href = link.getAttribute("href");
            return href && isValidUrl(href);
          })
          .forEach(link => {
            const fullLinkUrl = addHostname(link.getAttribute("href"));
            if (!visitedPages.includes(fullLinkUrl) && !urlsToFetch.includes(fullLinkUrl)) {
              parent.children.push(createNode(fullLinkUrl));
              if (fullLinkUrl.includes(domain)) {
                urlsToFetch.push(fullLinkUrl);
              }
            }
          });
      } catch (error) {
        logger.log(`Could not fetch ${fullUrl}`);
      }
    }

    return pageMetadata;
  };

  return {
    siteMap: await generatePageMetadata(),
  };
};

export { generateSiteMetadata };
