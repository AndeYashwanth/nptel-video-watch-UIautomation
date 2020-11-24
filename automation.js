// const webdriver = require('selenium-webdriver');
const { Builder, By, Key, until, Capabilities } = require("selenium-webdriver");
const locators = require("./locators.js");
const config = require("./config.js");
const { courses } = require("./config.js");

const capabilities = Capabilities.chrome();
capabilities.set("chromeOptions", {
  args: [
    "--disable-extensions",
    "--disable-infobars",
    "--disable-popup-blocking",
    "--start-maximized",
    "--disable-gpu",
    "--test-type",
    "--headless"
  ]
});
/**
 *
 * @param {Object} course
 */
async function main(course) {
  let driver = await new Builder().withCapabilities(capabilities).build();
  // await driver.manage().setTimeouts({ implicit: 1000, pageLoad: 10000, script: 1000000 });

  try {
    // Navigate to Url
    await driver.get("https://swayam.gov.in/mycourses");

    await login(driver);

    try {
      await (await driver.wait(until.elementLocated(By.xpath(locators.getXpath("courseName", course.name))), 10000)).click(); // click appropriate course
    } catch (e) {
      throw new Error(`Course "${course.name}" not found`);
    }
    let weeks = await driver.findElements(By.className("unit_navbar"));

    let weekIndexes = getWeekIndexes(course, weeks.length);

    for (let i of weekIndexes) {
      await weeks[i].click(); // if not clicked, elements are not visible
      let unitHeading = await (await weeks[i].findElement(By.className("unit_heading"))).getAttribute("innerHTML");
      console.log(unitHeading.trim());

      let videos = await weeks[i].findElements(By.xpath(locators.getXpath("allSubUnits")));
      for (let j = 0; j < videos.length; j++) {
        await videos[j].click();
        // as page will be reloaded, need to reinitialize the elements
        weeks = await driver.findElements(By.className("unit_navbar"));
        videos = await weeks[i].findElements(By.xpath(locators.getXpath("allSubUnits")));
        console.log("   " + (await videos[j].getAttribute("innerHTML")));

        await driver.switchTo().frame(driver.findElement(By.xpath("//iframe[@id='videoDiv']"))); // youtube player iframe
        await (await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='Play']")), 10000)).click();
        await driver.switchTo().defaultContent();

        // wait until video completed playing
        while ((await driver.executeScript("return ytplayer.getPlayerState()")) != 0) {
          driver.sleep(1000);
        }
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    driver.quit();
  }
}

config.courses.forEach((course) => {
  main(course);
});

async function login(driver) {
  //enter credentails in login page
  await (await driver.wait(until.elementLocated(By.id("logonIdentifier")), 10000)).sendKeys(config.username); // enter username
  await (await driver.wait(until.elementLocated(By.id("password")), 2000)).sendKeys(config.password); // enter password
  await (await driver.wait(until.elementLocated(By.id("next")), 2000)).click(); // submit login form
}

function getWeekIndexes(course, actualWeeksLength) {
  let weekIndexes;
  if (Array.isArray(course.indexes) && course.indexes.length > 0) {
    if (Math.max(...course.indexes) >= actualWeeksLength || Math.min(...course.indexes) < 0) {
      throw Error(`index array for "${course.name}" has out of bound values.`);
    }
    weekIndexes = course.indexes;
  } else {
    let startIndex = course.startWeekIndex || 0,
      endIndex = course.endWeekIndex || actualWeeksLength - 1;
    if (startIndex < 0 || startIndex > endIndex || startIndex > actualWeeksLength - 1) {
      throw Error(`startIndex for "${course.name}" out of bound.`);
    } else if (endIndex < 0 || endIndex >= actualWeeksLength) {
      throw Error(`endIndex for "${course.name}" out of bound.`);
    }
    weekIndexes = [...Array(endIndex - startIndex + 1).keys()].map((i) => i + startIndex); // array values with startindex to endindex (inclusive)
  }
  if (weekIndexes.length == 0) {
    throw Error(`Course with name "${course.name}" was provided with incorrect indexes`);
  }
  return weekIndexes;
}
