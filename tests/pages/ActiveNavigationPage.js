const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ActiveNavigationPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.directionText = By.css('.direction-text h2');
    this.arriveBtn = By.xpath("//button[contains(., \"I've Arrived\")]");
    this.statusText = By.xpath("//strong[contains(text(), 'Status: Currently Parked')]");
    this.leaveBtn = By.css('.btn-danger-action');
  }

  async getDirectionText() {
    return await this.getText(this.directionText);
  }

  async arrive() {
    await this.click(this.arriveBtn);
  }

  async isCurrentlyParked() {
    try {
      const el = await this.waitAndFind(this.statusText);
      return await el.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async leavePark() {
    await this.click(this.leaveBtn);
  }
}

module.exports = ActiveNavigationPage;
