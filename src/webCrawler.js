import axios from "axios";
import { JSDOM } from "jsdom";

const generateSiteMetadata = url =>
  axios.get(url).then(response => {
    const dom = new JSDOM(response.data);
    const { document } = dom.window;

    return {
      siteMap: {
        url,
        children: [...document.querySelectorAll("a")]
          .filter(link => link.getAttribute("href") !== "/")
          .map(link => ({
            url: link.getAttribute("href"),
            name: link.textContent,
          })),
      },
    };
  });

export { generateSiteMetadata };
