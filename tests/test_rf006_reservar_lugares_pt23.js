const { createDriver, getHelpers, BASE_URL, takeScreenshot } = require('./helpers/testHelper');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { loginPage, parkingDetailsPage, reservationPage } = helpers;
  await loginPage.login("cliente.1@example.com", "password");
  await driver.wait(until.elementLocated(By.css(".user-greeting")), 10000);

  await parkingDetailsPage.navigate(`${BASE_URL}/parking/1`);

  await parkingDetailsPage.clickFreeSpot();

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/reserve/');
  }, 10000);

  const priceBreakdownVisible = await reservationPage.isPriceBreakdownVisible();
  assert.ok(priceBreakdownVisible);

  await reservationPage.clickReserveNow();

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/payment');
  }, 10000);
}

if (require.main === module) {
  (async () => {
    let driver;
    let exitCode = 0;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-23: test_rf006_reservar_lugares_pt23...');
      await run(driver, helpers);
      console.log('✅ PT-23 passed successfully!');
    } catch (err) {
      console.error('❌ PT-23 failed:', err);
      exitCode = 1;
      if (driver) {
        await takeScreenshot(driver, 'test_rf006_reservar_lugares_pt23');
      }
    } finally {
      if (driver) {
        await driver.quit();
      }
      process.exit(exitCode);
    }
  })();
}

module.exports = { run };
