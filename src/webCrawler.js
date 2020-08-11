import axios from "axios";
import { JSDOM } from "jsdom";

const generateSiteMetadata = async rootUrl => {
  const domain = new URL(rootUrl).hostname;

  const addHostname = relativeUrl =>
    relativeUrl.includes(domain) ? relativeUrl : `${rootUrl}${relativeUrl}`;

  const isRelativePath = relativeUrl => /^\/[\w\d\-_]+/g.test(relativeUrl);
  const isNotMailto = relativeUrl => !relativeUrl.includes("mailto:");

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

  const generatePageMetadata = async () => {
    const pageMetadata = { url: rootUrl, children: [] };

    const fullUrl = addHostname(rootUrl);
    const visitedPages = [];
    const urlsToFetch = [fullUrl];

    while (urlsToFetch.length > 0) {
      const fullUrl = urlsToFetch.shift();
      visitedPages.push(fullUrl);

      try {
        const { data } = await axios.get(fullUrl);

        const dom = new JSDOM(data);
        const { document } = dom.window;

        const childrenNodes = [...document.querySelectorAll("a")].filter(link => {
          const href = link.getAttribute("href");
          return href && isNotMailto(href) && (href.includes(domain) || isRelativePath(href));
        });

        const parent = findNodeWithUrl(pageMetadata, fullUrl);

        childrenNodes.forEach(child => {
          const fullUrl = addHostname(child.getAttribute("href"));
          if (!visitedPages.includes(fullUrl) && !urlsToFetch.includes(fullUrl)) {
            parent.children.push({
              url: fullUrl,
              name: child.textContent,
              children: [],
            });
            urlsToFetch.push(fullUrl);
          }
        });
      } catch (error) {
        console.log(`Could not fetch ${fullUrl}`);
      }
    }

    return pageMetadata;
  };

  return {
    siteMap: await generatePageMetadata(),
  };
};

export { generateSiteMetadata };
