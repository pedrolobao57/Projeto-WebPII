const { createDriver, getHelpers, BASE_URL, takeScreenshot } = require('./helpers/testHelper');
const assert = require('assert');

async function run(driver, helpers) {
  const { registerPage, dashboardPage } = helpers;
  await registerPage.navigate(`${BASE_URL}/signup`);
  const uniqueEmail = `qa.tester.js.${Math.floor(1000 + Math.random() * 9000)}@example.com`;
  const plate = `QA-${Math.floor(10 + Math.random() * 90)}-ZZ`;

  await registerPage.registerClient(
    "QA Tester Client",
    uniqueEmail,
    "password",
    "912345678",
    plate,
    "Mercedes",
    "Classe A",
    "Branco"
  );

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/dashboard');
  }, 12000, 'Redirection to /dashboard failed');

  const greeting = await dashboardPage.getGreetingName();
  assert.ok(greeting.includes("QA Tester Client"));
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-18: test_rf001_criar_conta_pt18...');
      await run(driver, helpers);
      console.log('✅ PT-18 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-18 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf001_criar_conta_pt18');
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
