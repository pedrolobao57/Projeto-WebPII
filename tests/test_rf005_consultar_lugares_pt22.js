const { createDriver, getHelpers, BASE_URL, takeScreenshot } = require('./helpers/testHelper');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { loginPage, parkingDetailsPage } = helpers;
  await loginPage.login("cliente.1@example.com", "password");
  await driver.wait(until.elementLocated(By.css(".user-greeting")), 10000);

  await parkingDetailsPage.navigate(`${BASE_URL}/parking/1`);

  await driver.wait(async () => {
    const title = await parkingDetailsPage.getParkTitle();
    return title.includes("Parque Pintos");
  }, 10000, "Timed out waiting for park title to load (Parque Pintos)");

  const legendExists = await parkingDetailsPage.legendExists();
  assert.ok(legendExists);
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-22: test_rf005_consultar_lugares_pt22...');
      await run(driver, helpers);
      console.log('✅ PT-22 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-22 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf005_consultar_lugares_pt22');
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
