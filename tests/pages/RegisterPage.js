const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class RegisterPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.fullNameField = By.css("input[placeholder='Full Name']");
    this.emailField = By.css("input[placeholder='Email Address']");
    this.passwordField = By.css("input[placeholder='Password']");
    this.phoneField = By.css("input[placeholder='Phone Number']");
    
    this.driverRoleBtn = By.xpath("//button[contains(@class, 'role-btn') and contains(., 'Driver')]");
    this.adminRoleBtn = By.xpath("//button[contains(@class, 'role-btn') and contains(., 'Administrator')]");
    
    this.plateField = By.css("input[placeholder='License Plate']");
    this.brandSelect = By.xpath("//select[option[contains(text(), 'Select a brand')]]");
    this.modelField = By.css("input[placeholder='Model']");
    this.colorSelect = By.xpath("//select[option[contains(text(), 'Select color')]]");
    
    this.termsCheckbox = By.css('.terms-checkbox');
    this.submitBtn = By.css("form.signup-form button[type='submit']");
    this.errorBanner = By.css('.error-banner');
  }

  async registerClient(name, email, password, phone, plate, brand, model, color) {
    await this.typeText(this.fullNameField, name);
    await this.typeText(this.emailField, email);
    await this.typeText(this.passwordField, password);
    await this.typeText(this.phoneField, phone);
    await this.click(this.driverRoleBtn);

    await this.typeText(this.plateField, plate);
    
    const brandEl = await this.waitAndFind(this.brandSelect);
    await brandEl.sendKeys(brand);

    await this.typeText(this.modelField, model);

    const colorEl = await this.waitAndFind(this.colorSelect);
    await colorEl.sendKeys(color);

    await this.click(this.termsCheckbox);
    await this.click(this.submitBtn);
  }

  async registerAdmin(name, email, password, phone) {
    await this.typeText(this.fullNameField, name);
    await this.typeText(this.emailField, email);
    await this.typeText(this.passwordField, password);
    await this.typeText(this.phoneField, phone);
    await this.click(this.adminRoleBtn);
    await this.click(this.termsCheckbox);
    await this.click(this.submitBtn);
  }

  async getErrorMessage() {
    return await this.getText(this.errorBanner);
  }
}

module.exports = RegisterPage;
