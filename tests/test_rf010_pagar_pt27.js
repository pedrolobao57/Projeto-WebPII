const { createDriver, getHelpers, BASE_URL, takeScreenshot, loginAndVerify, findAvailableSpot } = require('./helpers/testHelper');
const { By } = require('selenium-webdriver');
const assert = require('assert');

async function run(driver, helpers) {
  const { paymentPage } = helpers;
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const spot = await findAvailableSpot("cliente.1@example.com", "password", tomorrowStr, "14:00", "17:00");
  console.log(`[RF010 Debug] Selected non-conflicting spot: ID=${spot.id}, Number=${spot.number}`);

  await loginAndVerify(driver, "cliente.1@example.com", "password");

  const mockReservationJs = `
  localStorage.setItem('pending_reservation', JSON.stringify({
      spotId: '${spot.id}',
      parkId: '1',
      spotNumber: '${spot.number}',
      parkName: 'Parque Pintos',
      date: '${tomorrowStr}',
      startTime: '14:00',
      endTime: '17:00',
      duration: 3,
      hourlyRate: 2.50,
      total: 9.00
  }));
  `;
  await driver.executeScript(mockReservationJs);

  await paymentPage.navigate(`${BASE_URL}/payment`);

  const total = await paymentPage.getTotalAmount();
  assert.ok(total.includes("€9.00"));

  // Debugging input typing
  await paymentPage.applyPromoCode("Codigo VSKI");
  const val = await paymentPage.getPromoInputValue();
  const isEnabled = await paymentPage.isApplyPromoBtnEnabled();
  console.log(`[RF010 Debug] Promo Input Value after typing: "${val}"`);
  console.log(`[RF010 Debug] Apply Button Enabled: ${isEnabled}`);

  // Wait for the total amount to update asynchronously in Vue
  await driver.wait(async () => {
    const newTotal = await paymentPage.getTotalAmount();
    console.log(`[RF010 Debug] Current total amount text: "${newTotal}"`);
    return newTotal.includes("€0.67");
  }, 5000, "Total price did not update to €0.67 after applying promo code");

  await paymentPage.pay();

  try {
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/navigation');
    }, 10000);
  } catch (waitErr) {
    const currentUrl = await driver.getCurrentUrl();
    let pageError = "None";
    try {
      pageError = await paymentPage.getErrorMessage();
    } catch (e) {}
    console.log(`[RF010 Debug] Redirection failed. Current URL: "${currentUrl}". Page Error Banner: "${pageError}"`);
    throw waitErr;
  }
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-27: test_rf010_pagar_pt27...');
      await run(driver, helpers);
      console.log('✅ PT-27 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-27 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf010_pagar_pt27');
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
