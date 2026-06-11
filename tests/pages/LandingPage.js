const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LandingPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.getStartedBtn = By.xpath("//button[contains(text(), 'Get Started') or contains(text(), 'Start Free Trial')]");
    this.loginBtn = By.xpath("//button[contains(text(), 'Log In')]");
  }

  async clickGetStarted() {
    await this.click(this.getStartedBtn);
  }

  async clickLogin() {
    await this.click(this.loginBtn);
  }
}

module.exports = LandingPage;
