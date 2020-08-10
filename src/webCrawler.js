import axios from "axios";
import { JSDOM } from "jsdom";

const generateSiteMetadata = rootUrl => {
  const domain = new URL(rootUrl).hostname;

  const addHostname = relativeUrl =>
    relativeUrl.includes(domain) ? relativeUrl : `${rootUrl}${relativeUrl}`;

  const isRelativePath = relativeUrl => /^\/[\w\d\-_]+/g.test(relativeUrl);

  const generatePageMetadata = async relativeUrl => {
    const fullUrl = addHostname(relativeUrl, rootUrl);

    console.log("full url: ", fullUrl);
    const { data } = await axios.get(fullUrl);

    const dom = new JSDOM(data);
    const { document } = dom.window;
    const children = [...document.querySelectorAll("a")].filter(link => {
      const href = link.getAttribute("href");
      return href && (href.includes(domain) || isRelativePath(href));
    });

    if (children.length === 0) {
      return [];
    }

    return Promise.all(
      children.map(child => {
        const childUrl = child.getAttribute("href");
        return generatePageMetadata(childUrl).then(childMetadata => ({
          url: childUrl,
          name: child.textContent,
          children: childMetadata,
        }));
      })
    );
  };

  return generatePageMetadata(rootUrl).then(pageMetadata => ({
    siteMap: {
      url: rootUrl,
      children: pageMetadata,
    },
  }));
};

export { generateSiteMetadata };
