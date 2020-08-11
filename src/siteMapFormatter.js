const INDENTATION = 2;

export default siteMap => {
  const iter = (map, depth, output) => {
    output += `${" ".repeat(depth * INDENTATION)}${map.url}\n`;
    map.children.forEach(child => {
      output += `${iter(child, depth + 1, "")}`;
    });
    return output;
  };

  return iter(siteMap, 0, "");
};
