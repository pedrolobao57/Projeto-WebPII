const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.greetingHeader = By.css('.user-greeting h2');
    this.settingsBtn = By.css('button.icon-btn');
    this.activeCard = By.xpath("//div[contains(@class, 'stat-card') and contains(., 'Active')]");
    this.reservationCard = By.css('.reservation-card');
    
    // Admin dashboard specific selectors
    this.adminBadge = By.css('.admin-badge');
    this.adminSignOutBtn = By.css('header button.text-danger');
  }

  async getGreetingName() {
    return await this.getText(this.greetingHeader);
  }

  async goToProfile() {
    await this.click(this.settingsBtn);
  }

  async openActiveReservation() {
    await this.click(this.reservationCard);
  }

  async isAdminDashboardVisible() {
    try {
      const badge = await this.waitAndFind(this.adminBadge, 5000);
      return await badge.isDisplayed();
    } catch (err) {
      return false;
    }
  }

  async adminLogOut() {
    await this.click(this.adminSignOutBtn);
  }
}

module.exports = DashboardPage;
