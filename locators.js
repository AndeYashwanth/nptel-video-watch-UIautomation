var xpaths = {
  courseName: "//div[@id='Ongoing']/div[@class='learnerCard']/div[preceding-sibling::div//h4[text()='$courseName$']]//a",
  subUnitsNotvisited:
    ".//li[@class='subunit_other' and .//img[@title='Not Started']]//a[not(contains(text(), 'Feedback') or contains(text(), 'Assignment'))]",
  allSubUnits: ".//li[contains(@class,'subunit_')]//a[not(contains(text(), 'Feedback') or contains(text(), 'Assignment'))]"
};

module.exports.getXpath = (xpathKey, replacewith) => {
  if (typeof xpathKey == "undefined") {
    throw Error("Please provide xpath key");
  }
  let str = xpaths[xpathKey];
  if (typeof replacewith === "undefined") {
    if(typeof str === "undefined" ){
      throw Error("Xpath key not found in locators");
    } else if (str.includes("$")) {
      throw Error("Please provide placeholder values for the xpath");
    }
    return str; // no placeholders are needed to replace
  }

  if (!Array.isArray(replacewith)) {
    replacewith = [replacewith];
  }

  let index = replacewith.length - 1;
  let ans = "";
  for (let word of str.split(/(\$\w+?\$)/g)) {
    if (word.startsWith("$") && word.endsWith("$")) {
      if (index < 0) {
        throw Error("Insufficient placeholder values to replace in xpath");
      }
      ans += replacewith[index--];
    } else {
      ans += word;
    }
  }

  if (index >= 0) {
    throw Error(
      `More xpath placeholder values are provided. Required: ${replacewith.length - index - 1}, Provided: ${replacewith.length}`
    );
  }
  return ans;
};
