import formatSiteMap from "../siteMapFormatter";

describe("Site Map formatter", () => {
  it("formats site map without children", () => {
    expect(
      formatSiteMap({
        url: "root",
        children: [],
      })
    ).toEqual("root\n");
  });

  it("formats site map with children", () => {
    expect(
      formatSiteMap({
        url: "root",
        children: [
          {
            url: "first-child",
            children: [],
          },
          {
            url: "second-child",
            children: [],
          },
        ],
      })
    ).toEqual(
      `root
  first-child
  second-child
`
    );
  });

  it("formats site map with inner children", () => {
    expect(
      formatSiteMap({
        url: "root",
        children: [
          {
            url: "first-child",
            children: [
              {
                url: "first-grand-child",
                children: [],
              },
              {
                url: "second-grand-child",
                children: [],
              },
            ],
          },
          {
            url: "second-child",
            children: [
              {
                url: "third-grand-child",
                children: [],
              },
              {
                url: "forth-grand-child",
                children: [],
              },
            ],
          },
        ],
      })
    ).toEqual(
      `root
  first-child
    first-grand-child
    second-grand-child
  second-child
    third-grand-child
    forth-grand-child
`
    );
  });
});
