const { createDriver, getHelpers, BASE_URL, takeScreenshot, loginAndVerify } = require('./helpers/testHelper');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { dashboardPage } = helpers;
  await loginAndVerify(driver, "cliente.1@example.com", "password");

  await dashboardPage.clickHistoryTab();

  const resList = await dashboardPage.getReservationsList();
  assert.ok(resList !== null);
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-29: test_rf012_aceder_a_historico_pt29...');
      await run(driver, helpers);
      console.log('✅ PT-29 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-29 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf012_aceder_a_historico_pt29');
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
