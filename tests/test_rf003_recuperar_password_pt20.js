const { createDriver, getHelpers, BASE_URL, takeScreenshot } = require('./helpers/testHelper');
const assert = require('assert');

async function run(driver, helpers) {
  const { loginPage, forgotPage } = helpers;
  await loginPage.clickForgotPassword();

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/forgot-password');
  }, 10000, 'Redirection to /forgot-password failed');

  await forgotPage.requestCode("cliente.2@example.com");

  const success = await forgotPage.getSuccessMessage();
  assert.ok(success.toLowerCase().includes("código de recuperação gerado") || success.toLowerCase().includes("sucesso"));
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

      console.log('Running PT-20: test_rf003_recuperar_password_pt20...');
      await run(driver, helpers);
      console.log('✅ PT-20 passed successfully!');
    } catch (err) {
      console.error('❌ PT-20 failed:', err);
      exitCode = 1;
      if (driver) {
        await takeScreenshot(driver, 'test_rf003_recuperar_password_pt20');
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
