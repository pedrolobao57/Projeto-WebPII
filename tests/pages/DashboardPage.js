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
    this.parksList = By.css('.parks-list');
    this.spotsBadge = By.css('.spots-badge');
    this.systemLogs = By.css('.system-logs');

    // Dashboard tabs
    this.historyTab = By.xpath("//button[contains(text(), 'History')]");
    this.reservationsTab = By.xpath("//button[contains(text(), 'My Reservations')]");
    this.reservationsList = By.css('.reservations-list');
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

  async getParksList() {
    return await this.waitAndFind(this.parksList);
  }

  async getSpotsBadgeText() {
    return await this.getText(this.spotsBadge);
  }

  async clickHistoryTab() {
    await this.click(this.historyTab);
  }

  async clickReservationsTab() {
    await this.click(this.reservationsTab);
  }

  async getReservationsList() {
    return await this.waitAndFind(this.reservationsList);
  }

  async isSystemLogsCardVisible() {
    try {
      const logs = await this.waitAndFind(this.systemLogs, 5000);
      return await logs.isDisplayed();
    } catch (err) {
      return false;
    }
  }
}

module.exports = DashboardPage;
