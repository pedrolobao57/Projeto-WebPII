const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.vehiclesTab = By.xpath("//button[contains(@class, 'tab-btn') and contains(., 'Vehicles')]");
    this.signOutBtn = By.css('.sign-out');
    
    // Vehicle management elements
    this.addVehicleTrigger = By.css('.add-vehicle-trigger-btn');
    this.plateField = By.css("input[placeholder='e.g. AA-00-AA']");
    this.brandSelect = By.xpath("//select[option[contains(text(), 'Select a brand')]]");
    this.modelSelect = By.xpath("//select[option[contains(text(), 'Select model')]]");
    this.colorSelect = By.xpath("//select[option[contains(text(), 'Select color')]]");
    this.submitVehicleBtn = By.xpath("//form[@class='modal-form']//button[@type='submit' and contains(., 'Add Vehicle')]");
  }

  async goToVehiclesTab() {
    await this.click(this.vehiclesTab);
  }

  async clickSignOut() {
    await this.click(this.signOutBtn);
  }

  async registerVehicle(plate, brand, model, color) {
    await this.click(this.addVehicleTrigger);
    await this.typeText(this.plateField, plate);
    
    const brandEl = await this.waitAndFind(this.brandSelect);
    await brandEl.sendKeys(brand);
    
    const modelEl = await this.waitAndFind(this.modelSelect);
    await modelEl.sendKeys(model);
    
    const colorEl = await this.waitAndFind(this.colorSelect);
    await colorEl.sendKeys(color);

    await this.click(this.submitVehicleBtn);
  }

  async isVehicleListed(plate) {
    try {
      const plateSelector = By.xpath(`//span[contains(@class, 'value') and contains(text(), '${plate}')]`);
      const element = await this.waitAndFind(plateSelector, 4000);
      return await element.isDisplayed();
    } catch (err) {
      return false;
    }
  }

  async isVehicleTabVisible() {
    try {
      const tab = await this.waitAndFind(this.vehiclesTab, 5000);
      return await tab.isDisplayed();
    } catch (err) {
      return false;
    }
  }
}

module.exports = ProfilePage;
