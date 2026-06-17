const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ReservationPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.priceBreakdown = By.css('.price-breakdown');
    this.reserveNowBtn = By.css('.bottom-action button');
  }

  async isPriceBreakdownVisible() {
    try {
      const el = await this.waitAndFind(this.priceBreakdown);
      return await el.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async clickReserveNow() {
    await this.click(this.reserveNowBtn);
  }
}

module.exports = ReservationPage;
