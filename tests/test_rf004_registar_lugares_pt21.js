const { createDriver, getHelpers, BASE_URL, takeScreenshot } = require('./helpers/testHelper');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { loginPage, dashboardPage } = helpers;
  await loginPage.login("admin.1@example.com", "password");

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/admin-dashboard');
  }, 10000);

  const parksList = await dashboardPage.getParksList();
  assert.ok(parksList !== null);

  const spotsText = await dashboardPage.getSpotsBadgeText();
  assert.ok(spotsText.includes("spots"));
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-21: test_rf004_registar_lugares_pt21...');
      await run(driver, helpers);
      console.log('✅ PT-21 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-21 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf004_registar_lugares_pt21');
      }
      process.exit(1);
    } finally {
      if (driver) {
        await driver.quit();
      }
    }
  })();
}

module.exports = { run };
