const { createDriver, getHelpers, BASE_URL, takeScreenshot, ensureActiveReservation } = require('./helpers/testHelper');
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { loginPage, navigationPage } = helpers;
  await ensureActiveReservation("cliente.1@example.com", "password");

  await loginPage.login("cliente.1@example.com", "password");
  await driver.wait(until.elementLocated(By.css(".user-greeting")), 10000);

  await navigationPage.navigate(`${BASE_URL}/navigation`);

  // Wait for real reservation details to load from backend
  await driver.wait(async () => {
    const text = await navigationPage.getDirectionText();
    return text.includes("Parque Pintos");
  }, 15000, "Timed out waiting for real reservation details (Parque Pintos) to load on NavigationView");

  // Mock alerts to avoid headless Chrome alert blocking/dismissal issues
  await driver.executeScript(`
    window.alerts = [];
    window.alert = function(msg) { window.alerts.push(msg); };
    window.confirm = function(msg) { return true; };
  `);

  await navigationPage.arrive();

  try {
    await driver.wait(async () => {
      const len = await driver.executeScript("return window.alerts.length;");
      return len > 0;
    }, 5000);
    const alertText = await driver.executeScript("return window.alerts.shift();");
    const isSuccess = alertText.includes("Entrada no parque registada com sucesso") || alertText.includes("sucesso");
    assert.ok(isSuccess, `Alert text did not match success message. Text: "${alertText}"`);
  } catch (err) {
    console.log("Alert not present or checked:", err.message);
    if (err.name === 'AssertionError') {
      throw err;
    }
  }

  await driver.wait(async () => {
    return await navigationPage.isCurrentlyParked();
  }, 10000);
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-24: test_rf007_marcar_presenca_pt24...');
      await run(driver, helpers);
      console.log('✅ PT-24 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-24 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf007_marcar_presenca_pt24');
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
