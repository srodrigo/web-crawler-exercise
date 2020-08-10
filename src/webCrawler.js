import axios from "axios";
import { JSDOM } from "jsdom";

const generateSiteMetadata = async rootUrl => {
  const domain = new URL(rootUrl).hostname;

  const addHostname = relativeUrl =>
    relativeUrl.includes(domain) ? relativeUrl : `${rootUrl}${relativeUrl}`;

  const isRelativePath = relativeUrl => /^\/[\w\d\-_]+/g.test(relativeUrl);
  const isNotMailto = relativeUrl => !relativeUrl.includes("mailto:");

  const generatePageMetadata = async () => {
    const pageMatadata = [];

    const visitedPages = [];

    const fullUrl = addHostname(rootUrl);
    visitedPages.push(fullUrl);
    try {
      const { data } = await axios.get(fullUrl);

      const dom = new JSDOM(data);
      const { document } = dom.window;

      const childrenNodes = [...document.querySelectorAll("a")].filter(link => {
        const href = link.getAttribute("href");
        return href && isNotMailto(href) && (href.includes(domain) || isRelativePath(href));
      });

      const urlsToFetch = [];

      childrenNodes.forEach(child => {
        const fullUrl = addHostname(child.getAttribute("href"));
        if (!visitedPages.includes(fullUrl) && !urlsToFetch.includes(fullUrl)) {
          pageMatadata.push({
            url: fullUrl,
            name: child.textContent,
            children: [],
          });
          urlsToFetch.push(fullUrl);
        }
      });

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

          const parent = pageMatadata.find(node => node.url === fullUrl);

          childrenNodes.forEach(child => {
            const fullUrl = addHostname(child.getAttribute("href"));
            if (
              !visitedPages.includes(fullUrl) &&
              !urlsToFetch.includes(fullUrl) &&
              parent &&
              !parent.children.find(child => child.url === fullUrl)
            ) {
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
    } catch (error) {
      console.log(`Could not fetch ${fullUrl}`);
    }

    return pageMatadata;
  };

  const pageMetadata = await generatePageMetadata();

  return {
    siteMap: {
      url: rootUrl,
      children: pageMetadata,
    },
  };
};

export { generateSiteMetadata };
