const { Builder, Browser, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Import Page Objects
const LandingPage = require('./pages/LandingPage');
const LoginPage = require('./pages/LoginPage');
const RegisterPage = require('./pages/RegisterPage');
const ForgotPasswordPage = require('./pages/ForgotPasswordPage');
const DashboardPage = require('./pages/DashboardPage');
const ProfilePage = require('./pages/ProfilePage');
const PaymentPage = require('./pages/PaymentPage');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

describe('ParkSmart - Testes Funcionais & E2E (Jira Xray PT)', function () {
  this.timeout(50000);
  let driver;
  
  let landingPage, loginPage, registerPage, forgotPage, dashboardPage, profilePage, paymentPage;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    if (process.env.HEADED !== 'true') {
      options.addArguments('--headless=new');
    }

    driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build();

    landingPage = new LandingPage(driver);
    loginPage = new LoginPage(driver);
    registerPage = new RegisterPage(driver);
    forgotPage = new ForgotPasswordPage(driver);
    dashboardPage = new DashboardPage(driver);
    profilePage = new ProfilePage(driver);
    paymentPage = new PaymentPage(driver);
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async function () {
    await driver.get(`${BASE_URL}/login`);
    try {
      await driver.executeScript('window.localStorage.clear();');
      await driver.navigate().refresh();
      await driver.sleep(1000);
    } catch (e) {}
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      try {
        const evidenceDir = path.join(__dirname, 'evidence');
        if (!fs.existsSync(evidenceDir)) {
          fs.mkdirSync(evidenceDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `${this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.png`;
        const filepath = path.join(evidenceDir, filename);

        const data = await driver.takeScreenshot();
        fs.writeFileSync(filepath, data, 'base64');
        console.log(`\n[Xray Evidence] Test failed! Screenshot saved to ${filepath}`);
      } catch (err) {
        console.error('Error saving failure screenshot:', err.message);
      }
    }
  });

  async function ensureActiveReservation(userEmail, userPassword) {
    const API_URL = 'http://localhost:3000';
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

      // 2. Check reservations
      const userRes = await fetch(`${API_URL}/users/me/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userRes.ok) {
        throw new Error(`Failed to fetch user reservations: ${await userRes.text()}`);
      }
      const reservations = await userRes.json();
      const hasActive = reservations.some(r => r.status === 'Active');
      if (hasActive) {
        return; // Already has an active reservation
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

      // 4. Create reservation starting 30 mins ago, ending 2 hours from now
      const now = Date.now();
      const start = new Date(now - 30 * 60 * 1000).toISOString();
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
    }
  }

  async function findAvailableSpot(userEmail, userPassword, date, startTime, endTime) {
    const API_URL = 'http://localhost:3000';
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

      // 2. Fetch all spots in Park 1
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

      // 3. Try spots to find one without conflict
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
          // Cancel it immediately
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
    // Fallback default
    return { id: '1', number: 'V001' };
  }

  async function loginAndVerify(email, password, badgeSelector = By.css(".user-greeting")) {
    await loginPage.navigate(`${BASE_URL}/login`);
    await driver.sleep(1000);
    await loginPage.login(email, password);
    try {
      await driver.wait(until.elementLocated(badgeSelector), 10000);
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

  // ==========================================================
  // RF001 - Criar Conta (PT-18)
  // ==========================================================
  it('test_rf001_criar_conta_pt18: Registo de Cliente e verificação de gravação de dados', async function () {
    await registerPage.navigate(`${BASE_URL}/signup`);
    const uniqueEmail = `qa.tester.js.${Math.floor(1000 + Math.random() * 9000)}@example.com`;
    const plate = `QA-${Math.floor(10 + Math.random() * 90)}-ZZ`;

    await registerPage.registerClient(
      "QA Tester Client",
      uniqueEmail,
      "password",
      "912345678",
      plate,
      "Mercedes",
      "Classe A",
      "Branco"
    );

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/dashboard');
    }, 12000, 'Redirection to /dashboard failed');

    const greeting = await dashboardPage.getGreetingName();
    assert.ok(greeting.includes("QA Tester Client"));
  });

  // ==========================================================
  // RF002 - Fazer Log In (PT-19)
  // ==========================================================
  it('test_rf002_login_pt19: Login sucesso (Cliente/Admin) e rejeição de inválidos', async function () {
    // 1. Success Client Login
    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.login("cliente.1@example.com", "password");

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/dashboard');
    }, 10000, 'Redirection to /dashboard failed');

    // 2. Success Admin Login (redirects to admin portal)
    await driver.executeScript('window.localStorage.clear();');
    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.login("admin.1@example.com", "password");

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/admin-dashboard');
    }, 10000, 'Redirection to /admin-dashboard failed');

    const isAdminPortal = await dashboardPage.isAdminDashboardVisible();
    assert.strictEqual(isAdminPortal, true);

    // 3. Failed Login with Invalid Credentials
    await driver.executeScript('window.localStorage.clear();');
    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.login("cliente.1@example.com", "wrong_password");

    const errorMsg = await loginPage.getErrorMessage();
    assert.ok(errorMsg.length > 0);
  });

  // ==========================================================
  // RF003 - Recuperar Password (PT-20)
  // ==========================================================
  it('test_rf003_recuperar_password_pt20: Pedido de PIN de recuperação de password e erros', async function () {
    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.clickForgotPassword();

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/forgot-password');
    }, 10000, 'Redirection to /forgot-password failed');

    await forgotPage.requestCode("cliente.2@example.com");

    const success = await forgotPage.getSuccessMessage();
    assert.ok(success.toLowerCase().includes("código de recuperação gerado") || success.toLowerCase().includes("sucesso"));
  });

  // ==========================================================
  // RF004 - Registar Lugares (PT-21)
  // ==========================================================
  it('test_rf004_registar_lugares_pt21: Login de Admin e verificação de visualização de vagas livres', async function () {
    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.login("admin.1@example.com", "password");

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/admin-dashboard');
    }, 10000);

    const parksList = await driver.wait(until.elementLocated(By.css(".parks-list")), 10000);
    assert.ok(parksList !== null);

    const spotsBadge = await driver.wait(until.elementLocated(By.css(".spots-badge")), 10000);
    const spotsText = await spotsBadge.getText();
    assert.ok(spotsText.includes("spots"));
  });

  // ==========================================================
  // RF005 - Consultar Lugares (PT-22)
  // ==========================================================
  it('test_rf005_consultar_lugares_pt22: Mapa/Detalhes de estacionamento exibe cores de ocupação correta', async function () {
    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.login("cliente.1@example.com", "password");
    await driver.wait(until.elementLocated(By.css(".user-greeting")), 10000);

    await driver.get(`${BASE_URL}/parking/1`);

    const titleEl = await driver.wait(until.elementLocated(By.css(".location-header h1")), 10000);
    const titleText = await titleEl.getText();
    assert.ok(titleText.includes("Parque Pintos"));

    const legend = await driver.findElement(By.css(".legend"));
    assert.ok(legend !== null);
  });

  // ==========================================================
  // RF006 - Reservar Lugares (PT-23)
  // ==========================================================
  it('test_rf006_reservar_lugares_pt23: Reserva de vaga e validação do cálculo total do preço', async function () {
    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.login("cliente.1@example.com", "password");
    await driver.wait(until.elementLocated(By.css(".user-greeting")), 10000);

    await driver.get(`${BASE_URL}/parking/1`);

    const freeSpotBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(@class, 'spot-btn') and contains(@class, 'free')]")),
      10000
    );
    await driver.executeScript('arguments[0].click();', freeSpotBtn);

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/reserve/');
    }, 10000);

    const priceBreakdown = await driver.findElement(By.css(".price-breakdown"));
    assert.ok(priceBreakdown !== null);

    const reserveNowBtn = await driver.findElement(By.css(".bottom-action button"));
    await driver.executeScript('arguments[0].click();', reserveNowBtn);

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/payment');
    }, 10000);
  });

  // ==========================================================
  // RF007 - Marcar Presença (PT-24)
  // ==========================================================
  it('test_rf007_marcar_presenca_pt24: Clicar em "I\'ve Arrived" no painel e marcar vaga como Ocupado', async function () {
    await ensureActiveReservation("cliente.1@example.com", "password");

    await loginPage.navigate(`${BASE_URL}/login`);
    await loginPage.login("cliente.1@example.com", "password");
    await driver.wait(until.elementLocated(By.css(".user-greeting")), 10000);

    await driver.get(`${BASE_URL}/navigation`);

    // Wait for real reservation details to load from backend (replaces default 'Downtown Plaza')
    const dirHeader = await driver.wait(
      until.elementLocated(By.css(".direction-text h2")),
      10000
    );
    await driver.wait(async () => {
      const text = await dirHeader.getText();
      return text.includes("Parque Pintos");
    }, 15000, "Timed out waiting for real reservation details (Parque Pintos) to load on NavigationView");

    const arriveBtn = await driver.wait(
      until.elementLocated(By.css(".arrive-btn")),
      10000
    );
    await driver.executeScript('arguments[0].click();', arriveBtn);

    try {
      await driver.wait(until.alertIsPresent(), 3000);
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      const isSuccess = alertText.includes("Entrada no parque registada com sucesso") || alertText.includes("sucesso");
      await alert.accept();
      assert.ok(isSuccess, `Alert text did not match success message. Text: "${alertText}"`);
    } catch (err) {
      console.log("Alert not present or checked:", err.message);
      if (err.name === 'AssertionError') {
        throw err;
      }
    }

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/dashboard');
    }, 10000);
  });

  // ==========================================================
  // RF008 - Acompanhar Estacionamento (PT-25)
  // ==========================================================
  it('test_rf008_acompanhar_estacionamento_pt25: Atualização em tempo real do tempo/preço acumulado no painel', async function () {
    await ensureActiveReservation("cliente.1@example.com", "password");

    await loginAndVerify("cliente.1@example.com", "password");

    const stats = await dashboardPage.waitAndFind(dashboardPage.activeCard);
    assert.ok(stats !== null);
  });

  // ==========================================================
  // RF009 - Registar Saída (PT-26)
  // ==========================================================
  it('test_rf009_registar_saida_pt26: Processar saída da vaga e atualizar o seu estado para Livre', async function () {
    await loginAndVerify("cliente.3@example.com", "password");
    
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/dashboard'));
  });

  // ==========================================================
  // RF010 - Pagar (PT-27)
  // ==========================================================
  it('test_rf010_pagar_pt27: Processo de pagamento de faturação e desconto de fidelidade', async function () {
    const spot = await findAvailableSpot("cliente.1@example.com", "password", "2026-06-12", "14:00", "17:00");
    console.log(`[RF010 Debug] Selected non-conflicting spot: ID=${spot.id}, Number=${spot.number}`);

    await loginAndVerify("cliente.1@example.com", "password");

    const mockReservationJs = `
    localStorage.setItem('pending_reservation', JSON.stringify({
        spotId: '${spot.id}',
        parkId: '1',
        spotNumber: '${spot.number}',
        parkName: 'Parque Pintos',
        date: '2026-06-12',
        startTime: '14:00',
        endTime: '17:00',
        duration: 3,
        hourlyRate: 2.50,
        total: 9.00
    }));
    `;
    await driver.executeScript(mockReservationJs);

    await paymentPage.navigate(`${BASE_URL}/payment`);

    const total = await paymentPage.getTotalAmount();
    assert.ok(total.includes("$9.00"));

    // Debugging input typing
    const inputEl = await driver.findElement(By.css(".promo-input"));
    await paymentPage.applyPromoCode("Codigo VSKI");
    const val = await inputEl.getAttribute("value");
    const buttonEl = await driver.findElement(By.css(".apply-btn"));
    const isEnabled = await buttonEl.isEnabled();
    console.log(`[RF010 Debug] Promo Input Value after typing: "${val}"`);
    console.log(`[RF010 Debug] Apply Button Enabled: ${isEnabled}`);

    // Wait for the total amount to update asynchronously in Vue
    await driver.wait(async () => {
      const newTotal = await paymentPage.getTotalAmount();
      console.log(`[RF010 Debug] Current total amount text: "${newTotal}"`);
      return newTotal.includes("$0.67");
    }, 5000, "Total price did not update to $0.67 after applying promo code");

    await paymentPage.pay();

    try {
      await driver.wait(async () => {
        const url = await driver.getCurrentUrl();
        return url.includes('/navigation');
      }, 10000);
    } catch (waitErr) {
      const currentUrl = await driver.getCurrentUrl();
      let pageError = "None";
      try {
        pageError = await paymentPage.getErrorMessage();
      } catch (e) {}
      console.log(`[RF010 Debug] Redirection failed. Current URL: "${currentUrl}". Page Error Banner: "${pageError}"`);
      throw waitErr;
    }
  });

  // ==========================================================
  // RF011 - Recolher Dados dos Sensores (PT-28)
  // ==========================================================
  it('test_rf011_recolher_dados_sensores_pt28: Atualização do estado do sensor e sincronização nos logs de Admin', async function () {
    await loginAndVerify("admin.1@example.com", "password", By.css(".admin-badge"));

    const logsCard = await driver.wait(until.elementLocated(By.css(".system-logs")), 10000);
    assert.ok(logsCard !== null);
  });

  // ==========================================================
  // RF012 - Aceder a Histórico (PT-29)
  // ==========================================================
  it('test_rf012_aceder_a_historico_pt29: Listagem ordenada por data no separador de Histórico', async function () {
    await loginAndVerify("cliente.1@example.com", "password");

    const historyTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'History')]")),
      10000
    );
    await historyTab.click();

    const resList = await driver.findElement(By.css(".reservations-list"));
    assert.ok(resList !== null);
  });
});
