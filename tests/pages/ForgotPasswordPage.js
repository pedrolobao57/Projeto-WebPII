const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ForgotPasswordPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.id("recovery-email");
    this.submitEmailBtn = By.xpath("//button[contains(text(), 'Send Recovery Code')]");
    
    this.codeInput = By.id("recovery-code");
    this.newPasswordInput = By.id("new-password");
    this.confirmPasswordInput = By.id("confirm-password");
    this.submitResetBtn = By.xpath("//button[contains(text(), 'Reset Password')]");
    
    this.errorBanner = By.css(".error-banner");
    this.successBanner = By.css(".success-banner");
  }

  async requestCode(email) {
    await this.typeText(this.emailInput, email);
    await this.click(this.submitEmailBtn);
  }

  async resetPassword(code, newPassword, confirmPassword) {
    await this.typeText(this.codeInput, code);
    await this.typeText(this.newPasswordInput, newPassword);
    await this.typeText(this.confirmPasswordInput, confirmPassword);
    await this.click(this.submitResetBtn);
  }

  async getErrorMessage() {
    return await this.getText(this.errorBanner);
  }

  async getSuccessMessage() {
    return await this.getText(this.successBanner);
  }
}

module.exports = ForgotPasswordPage;
