const { By, until } = require('selenium-webdriver');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigate(url) {
    await this.driver.get(url);
  }

  async waitAndFind(locator, timeout = 10000) {
    await this.driver.wait(until.elementLocated(locator), timeout);
    const element = await this.driver.findElement(locator);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async click(locator, timeout = 10000) {
    const element = await this.waitAndFind(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await element.click();
  }

  async typeText(locator, text, timeout = 10000) {
    const element = await this.waitAndFind(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator, timeout = 10000) {
    const element = await this.waitAndFind(locator, timeout);
    return await element.getText();
  }
}

module.exports = BasePage;
