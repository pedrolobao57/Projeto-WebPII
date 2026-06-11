const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class PaymentPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.totalPrice = By.css(".total-amount");
    this.visaOption = By.xpath("//div[contains(@class, 'payment-option') and contains(., 'Visa')]");
    this.mbwayOption = By.xpath("//div[contains(@class, 'payment-option') and contains(., 'MB Way')]");
    this.promoInput = By.css(".promo-input");
    this.applyPromoBtn = By.css(".apply-btn");
    this.submitBtn = By.css(".bottom-action button");
    this.errorBanner = By.css(".error-banner");
  }

  async selectVisa() {
    await this.click(this.visaOption);
  }

  async selectMbway() {
    await this.click(this.mbwayOption);
  }

  async applyPromoCode(code) {
    await this.typeText(this.promoInput, code);
    await this.click(this.applyPromoBtn);
  }

  async getTotalAmount() {
    return await this.getText(this.totalPrice);
  }

  async pay() {
    await this.click(this.submitBtn);
  }

  async getErrorMessage() {
    return await this.getText(this.errorBanner);
  }
}

module.exports = PaymentPage;
