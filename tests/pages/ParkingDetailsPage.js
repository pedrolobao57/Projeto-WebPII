const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ParkingDetailsPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.titleText = By.css('.location-header h1');
    this.legendCard = By.css('.legend');
    this.freeSpotBtn = By.xpath("//button[contains(@class, 'spot-btn') and contains(@class, 'free')]");
  }

  async getParkTitle() {
    return await this.getText(this.titleText);
  }

  async legendExists() {
    try {
      const el = await this.waitAndFind(this.legendCard);
      return await el.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async clickFreeSpot() {
    await this.click(this.freeSpotBtn);
  }
}

module.exports = ParkingDetailsPage;
