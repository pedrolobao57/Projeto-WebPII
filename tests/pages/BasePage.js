const { By, until } = require('selenium-webdriver');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigate(url) {
    await this.driver.get(url);
    await this.driver.sleep(300); // Wait for Vue hydration
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
    await this.driver.executeScript('arguments[0].click();', element);
    await this.driver.sleep(100); // Wait for client-side navigation or animations
  }

  async typeText(locator, text, timeout = 10000) {
    const element = await this.waitAndFind(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await this.driver.executeScript((el, val) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, element, text);
  }

  async getText(locator, timeout = 10000) {
    const element = await this.waitAndFind(locator, timeout);
    return await element.getText();
  }
}

module.exports = BasePage;
