const { createDriver, getHelpers, BASE_URL, takeScreenshot, loginAndVerify } = require('./helpers/testHelper');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { dashboardPage } = helpers;
  await loginAndVerify(driver, "admin.1@example.com", "password", By.css(".admin-badge"));

  const isVisible = await dashboardPage.isSystemLogsCardVisible();
  assert.ok(isVisible);
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-28: test_rf011_recolher_dados_sensores_pt28...');
      await run(driver, helpers);
      console.log('✅ PT-28 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-28 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf011_recolher_dados_sensores_pt28');
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
