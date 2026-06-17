const { createDriver, getHelpers, BASE_URL, takeScreenshot, ensureActiveReservation, loginAndVerify } = require('./helpers/testHelper');
const assert = require('assert');

async function run(driver, helpers) {
  const { dashboardPage } = helpers;
  await ensureActiveReservation("cliente.1@example.com", "password");

  await loginAndVerify(driver, "cliente.1@example.com", "password");

  const stats = await dashboardPage.waitAndFind(dashboardPage.activeCard);
  assert.ok(stats !== null);
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-25: test_rf008_acompanhar_estacionamento_pt25...');
      await run(driver, helpers);
      console.log('✅ PT-25 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-25 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf008_acompanhar_estacionamento_pt25');
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
