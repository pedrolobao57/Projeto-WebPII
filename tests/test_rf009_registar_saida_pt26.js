const { createDriver, getHelpers, BASE_URL, takeScreenshot, loginAndVerify, ensureActiveReservation } = require('./helpers/testHelper');
const { until } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { navigationPage } = helpers;
  await ensureActiveReservation("cliente.3@example.com", "password");

  await loginAndVerify(driver, "cliente.3@example.com", "password");
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

  // Step 1: Arrive
  await navigationPage.arrive();

  // Wait for arrival alert and assert
  await driver.wait(async () => {
    const len = await driver.executeScript("return window.alerts.length;");
    return len > 0;
  }, 5000, "Timed out waiting for arrival alert");
  const arrivedAlertText = await driver.executeScript("return window.alerts.shift();");
  assert.ok(arrivedAlertText.includes("sucesso"));

  // Verify status is currently parked
  await driver.wait(async () => {
    return await navigationPage.isCurrentlyParked();
  }, 10000, "Timed out waiting for status to be 'Currently Parked'");

  // Step 2: Leave & Pay
  await navigationPage.leavePark();

  // Wait for success departure alert and assert
  await driver.wait(async () => {
    const len = await driver.executeScript("return window.alerts.length;");
    return len > 0;
  }, 5000, "Timed out waiting for departure success alert");
  const leaveAlertText = await driver.executeScript("return window.alerts.shift();");
  console.log(`[RF009 Debug] leaveAlertText: "${leaveAlertText}"`);
  assert.ok(leaveAlertText.includes("sucesso"), `Expected success message but got: "${leaveAlertText}"`);

  // Wait for redirect to dashboard
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/dashboard');
  }, 10000, "Timed out waiting for redirect to /dashboard after leaving park");
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-26: test_rf009_registar_saida_pt26...');
      await run(driver, helpers);
      console.log('✅ PT-26 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-26 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf009_registar_saida_pt26');
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
