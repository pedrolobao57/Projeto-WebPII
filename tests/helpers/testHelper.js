const { Builder, Browser } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

// Page Objects
const LandingPage = require('../pages/LandingPage');
const LoginPage = require('../pages/LoginPage');
const RegisterPage = require('../pages/RegisterPage');
const ForgotPasswordPage = require('../pages/ForgotPasswordPage');
const DashboardPage = require('../pages/DashboardPage');
const ProfilePage = require('../pages/ProfilePage');
const PaymentPage = require('../pages/PaymentPage');
const ParkingDetailsPage = require('../pages/ParkingDetailsPage');
const ReservationPage = require('../pages/ReservationPage');
const ActiveNavigationPage = require('../pages/ActiveNavigationPage');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = 'http://localhost:3000';

async function createDriver() {
  const options = new chrome.Options();
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1280,800');

  // Open browser (headed mode) if run standalone via 'node', run headlessly if run via 'mocha'
  const isHeaded = process.env.HEADED === 'true' || !process.argv.some(arg => arg.includes('mocha'));

  if (!isHeaded) {
    options.addArguments('--headless=new');
  }

  return await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build();
}

function getHelpers(driver) {
  return {
    landingPage: new LandingPage(driver),
    loginPage: new LoginPage(driver),
    registerPage: new RegisterPage(driver),
    forgotPage: new ForgotPasswordPage(driver),
    dashboardPage: new DashboardPage(driver),
    profilePage: new ProfilePage(driver),
    paymentPage: new PaymentPage(driver),
    parkingDetailsPage: new ParkingDetailsPage(driver),
    reservationPage: new ReservationPage(driver),
    navigationPage: new ActiveNavigationPage(driver)
  };
}

async function takeScreenshot(driver, testName) {
  try {
    const evidenceDir = path.join(__dirname, '..', 'evidence');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${testName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.png`;
    const filepath = path.join(evidenceDir, filename);

    const data = await driver.takeScreenshot();
    fs.writeFileSync(filepath, data, 'base64');
    console.log(`\n[Screenshot Evidence] Saved failure screenshot to ${filepath}`);
  } catch (err) {
    console.error('Error saving failure screenshot:', err.message);
  }
}

async function ensureActiveReservation(userEmail, userPassword) {
  try {
    // 1. Login to get token
    const loginRes = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    });
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${await loginRes.text()}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 2. Check and cancel any existing Active/Upcoming reservations to guarantee a clean slate and avoid active parking session clashes
    const userRes = await fetch(`${API_URL}/users/me/reservations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!userRes.ok) {
      throw new Error(`Failed to fetch user reservations: ${await userRes.text()}`);
    }
    const reservations = await userRes.json();
    for (const r of reservations) {
      if (r.status === 'Active' || r.status === 'Upcoming') {
        try {
          await fetch(`${API_URL}/reservations/${r.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (e) {
          console.warn(`[ensureActiveReservation Warning] Failed to delete reservation ${r.id}: ${e.message}`);
        }
      }
    }

    // 3. Find a free spot in Park 1
    const spotsRes = await fetch(`${API_URL}/parks/1/spots`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!spotsRes.ok) {
      throw new Error(`Failed to fetch spots: ${await spotsRes.text()}`);
    }
    const zones = await spotsRes.json();
    let freeSpotId = null;
    for (const zone of zones) {
      const freeSpot = zone.spots.find(s => s.status === 'free');
      if (freeSpot) {
        freeSpotId = freeSpot.id;
        break;
      }
    }
    if (!freeSpotId) {
      throw new Error('No free spots available in Park 1');
    }

    // 4. Create reservation starting 10 seconds ago
    const now = Date.now();
    const start = new Date(now - 10000).toISOString();
    const end = new Date(now + 2 * 60 * 60 * 1000).toISOString();

    const createRes = await fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id_vaga: Number(freeSpotId),
        data_inicio: start,
        data_fim: end
      })
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create reservation: ${await createRes.text()}`);
    }
    const createData = await createRes.json();
    const resId = createData.novaReserva.id_reserva;

    // 5. Pay for reservation
    const payRes = await fetch(`${API_URL}/reservations/${resId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        method: 'visa',
        amount: 5.0,
        promoCode: null,
        useLoyaltyPoints: false
      })
    });
    if (!payRes.ok) {
      throw new Error(`Failed to pay for reservation: ${await payRes.text()}`);
    }
  } catch (err) {
    console.warn(`[ensureActiveReservation Warning] ${err.message}`);
    throw err;
  }
}

async function findAvailableSpot(userEmail, userPassword, date, startTime, endTime) {
  try {
    const loginRes = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    });
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${await loginRes.text()}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.token;

    const spotsRes = await fetch(`${API_URL}/parks/1/spots`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!spotsRes.ok) {
      throw new Error('Failed to fetch spots');
    }
    const zones = await spotsRes.json();
    const spots = [];
    for (const zone of zones) {
      for (const spot of zone.spots) {
        spots.push(spot);
      }
    }

    const startStr = `${date}T${startTime}:00`;
    const endStr = `${date}T${endTime}:00`;

    for (const spot of spots) {
      const createRes = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_vaga: Number(spot.id),
          data_inicio: startStr,
          data_fim: endStr
        })
      });
      if (createRes.ok) {
        const createData = await createRes.json();
        const resId = createData.novaReserva.id_reserva;
        await fetch(`${API_URL}/reservations/${resId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return { id: spot.id, number: spot.name };
      }
    }
  } catch (err) {
    console.warn(`[findAvailableSpot Warning] ${err.message}`);
  }
  return { id: '1', number: 'V001' };
}

async function loginAndVerify(driver, email, password, badgeSelector = require('selenium-webdriver').By.css(".user-greeting")) {
  const loginPage = new LoginPage(driver);
  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/login')) {
    await loginPage.navigate(`${BASE_URL}/login`);
  }
  await loginPage.login(email, password);
  try {
    await driver.wait(require('selenium-webdriver').until.elementLocated(badgeSelector), 10000);
  } catch (err) {
    const currentUrl = await driver.getCurrentUrl();
    let pageError = "None";
    try {
      pageError = await loginPage.getErrorMessage();
    } catch (e) {}
    console.log(`[Login Error] Failed to log in as ${email}. URL: "${currentUrl}". Error Banner: "${pageError}"`);
    throw err;
  }
}

module.exports = {
  BASE_URL,
  API_URL,
  createDriver,
  getHelpers,
  takeScreenshot,
  ensureActiveReservation,
  findAvailableSpot,
  loginAndVerify
};
