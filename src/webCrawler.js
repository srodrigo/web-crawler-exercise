import axios from "axios";
import { JSDOM } from "jsdom";

const generateSiteMetadata = url => {
  const domain = new URL(url).hostname;

  const addHostname = relativeUrl =>
    relativeUrl.includes(domain) ? relativeUrl : `${url}${relativeUrl}`;

  const generatePageMetadata = async relativeUrl => {
    const fullUrl = addHostname(relativeUrl, url);
    const { data } = await axios.get(fullUrl);

    const dom = new JSDOM(data);
    const { document } = dom.window;
    const children = [...document.querySelectorAll("a")].filter(
      link => link.getAttribute("href") !== "/"
    );

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

  return generatePageMetadata(url).then(pageMetadata => ({
    siteMap: {
      url,
      children: pageMetadata,
    },
  }));
};

export { generateSiteMetadata };
