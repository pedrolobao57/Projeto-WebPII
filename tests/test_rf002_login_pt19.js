const { createDriver, getHelpers, BASE_URL, takeScreenshot } = require('./helpers/testHelper');
const assert = require('assert');

async function run(driver, helpers) {
  const { loginPage, dashboardPage } = helpers;
  
  // 1. Success Client Login
  await loginPage.login("cliente.1@example.com", "password");

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/dashboard');
  }, 10000, 'Redirection to /dashboard failed');

  // 2. Success Admin Login (redirects to admin portal)
  await driver.executeScript('window.localStorage.clear();');
  await loginPage.navigate(`${BASE_URL}/login`);
  await loginPage.login("admin.1@example.com", "password");

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/admin-dashboard');
  }, 10000, 'Redirection to /admin-dashboard failed');

  const isAdminPortal = await dashboardPage.isAdminDashboardVisible();
  assert.strictEqual(isAdminPortal, true);

  // 3. Failed Login with Invalid Credentials
  await driver.executeScript('window.localStorage.clear();');
  await loginPage.navigate(`${BASE_URL}/login`);
  await loginPage.login("cliente.1@example.com", "wrong_password");

  const errorMsg = await loginPage.getErrorMessage();
  assert.ok(errorMsg.length > 0);
}

if (require.main === module) {
  (async () => {
    let driver;
    try {
      driver = await createDriver();
      const helpers = getHelpers(driver);
      await driver.get(`${BASE_URL}/login`);
      try { await driver.executeScript('window.localStorage.clear();'); } catch (e) {}

      console.log('Running PT-19: test_rf002_login_pt19...');
      await run(driver, helpers);
      console.log('✅ PT-19 passed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ PT-19 failed:', err);
      if (driver) {
        await takeScreenshot(driver, 'test_rf002_login_pt19');
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
