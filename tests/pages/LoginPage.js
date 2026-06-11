const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailField = By.id('login-email');
    this.passwordField = By.id('login-password');
    this.submitBtn = By.css("form.login-form button[type='submit']");
    this.errorBannerText = By.css('.error-banner');
    this.forgotPasswordLink = By.xpath("//a[contains(text(), 'Reset here') or contains(text(), 'Reset')]");
  }

  async login(email, password) {
    await this.typeText(this.emailField, email);
    await this.typeText(this.passwordField, password);
    await this.click(this.submitBtn);
  }

  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink);
  }

  async getErrorMessage() {
    return await this.getText(this.errorBannerText);
  }
}

module.exports = LoginPage;
