const { Builder, By, until } = require("selenium-webdriver");
const cliProgress = require("cli-progress");
const locators = require("./locators.js");
const config = Object.freeze(require("./config.js"));
const { courses } = require("./config.js");

var driver;
async function main(course) {
  driver = await new Builder().forBrowser("chrome").build();
  // await driver.manage().setTimeouts({ implicit: 1000, pageLoad: 10000, script: 1000000 });

  try {
    // Navigate to Url
    await driver.get("https://swayam.gov.in/mycourses");

    await login();

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
        let videoName = await videos[j].getAttribute("innerHTML");
        console.log("   " + (await videos[j].getAttribute("innerHTML")));
        await playVideoWithProgressbar();
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

async function login() {
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
    } else if (endIndex >= actualWeeksLength) {
      throw Error(`endIndex for "${course.name}" out of bound.`);
    }
    weekIndexes = [...Array(endIndex - startIndex + 1).keys()].map((i) => i + startIndex); // array values with startindex to endindex (inclusive)
  }
  if (weekIndexes.length == 0) {
    throw Error(`Course with name "${course.name}" was provided with incorrect indexes`);
  }
  return weekIndexes;
}

async function playVideoWithProgressbar() {
  await driver.sleep(2000); // don't think this is required
  await driver.executeScript("ytplayer.setVolume(0); ytplayer.playVideo();"); // ytplayer is youtube player variable in browser
  let videoTime = await driver.executeScript("return ytplayer.getDuration();");
  const b1 = new cliProgress.SingleBar({
    format: `   {bar} | {percentage}%`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true
  });
  b1.start(100, 0);

  // wait until video completed playing
  while ((await driver.executeScript("return ytplayer.getPlayerState();")) != 0) {
    await driver.sleep(500);
    let currentTime = await driver.executeScript("return ytplayer.getCurrentTime();");
    let percent = Math.ceil((currentTime / videoTime) * 100);
    b1.update(percent);
  }
  b1.stop();
}
