const { createDriver, getHelpers, takeScreenshot, BASE_URL } = require('./helpers/testHelper');

// Import the standalone tests
const test_rf001 = require('./test_rf001_criar_conta_pt18');
const test_rf002 = require('./test_rf002_login_pt19');
const test_rf003 = require('./test_rf003_recuperar_password_pt20');
const test_rf004 = require('./test_rf004_registar_lugares_pt21');
const test_rf005 = require('./test_rf005_consultar_lugares_pt22');
const test_rf006 = require('./test_rf006_reservar_lugares_pt23');
const test_rf007 = require('./test_rf007_marcar_presenca_pt24');
const test_rf008 = require('./test_rf008_acompanhar_estacionamento_pt25');
const test_rf009 = require('./test_rf009_registar_saida_pt26');
const test_rf010 = require('./test_rf010_pagar_pt27');
const test_rf011 = require('./test_rf011_recolher_dados_sensores_pt28');
const test_rf012 = require('./test_rf012_aceder_a_historico_pt29');

describe('ParkSmart - Testes Funcionais & E2E (Jira Xray PT)', function () {
  this.timeout(50000);
  let driver;
  let helpers;

  before(async function () {
    driver = await createDriver();
    helpers = getHelpers(driver);
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
    } catch (e) {}
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      await takeScreenshot(driver, this.currentTest.title);
    }
  });

  it('PT-18: test_rf001_criar_conta_pt18: Registo de Cliente e verificação de gravação de dados', async function () {
    await test_rf001.run(driver, helpers);
  });

  it('PT-19: test_rf002_login_pt19: Login sucesso (Cliente/Admin) e rejeição de inválidos', async function () {
    await test_rf002.run(driver, helpers);
  });

  it('PT-20: test_rf003_recuperar_password_pt20: Pedido de PIN de recuperação de password e erros', async function () {
    await test_rf003.run(driver, helpers);
  });

  it('PT-21: test_rf004_registar_lugares_pt21: Login de Admin e verificação de visualização de vagas livres', async function () {
    await test_rf004.run(driver, helpers);
  });

  it('PT-22: test_rf005_consultar_lugares_pt22: Mapa/Detalhes de estacionamento exibe cores de ocupação correta', async function () {
    await test_rf005.run(driver, helpers);
  });

  it('PT-23: test_rf006_reservar_lugares_pt23: Reserva de vaga e validação do cálculo total do preço', async function () {
    await test_rf006.run(driver, helpers);
  });

  it('PT-24: test_rf007_marcar_presenca_pt24: Clicar em "I\'ve Arrived" no painel e marcar vaga como Ocupado', async function () {
    await test_rf007.run(driver, helpers);
  });

  it('PT-25: test_rf008_acompanhar_estacionamento_pt25: Atualização em tempo real do tempo/preço acumulado no painel', async function () {
    await test_rf008.run(driver, helpers);
  });

  it('PT-26: test_rf009_registar_saida_pt26: Processar saída da vaga e atualizar o seu estado para Livre', async function () {
    await test_rf009.run(driver, helpers);
  });

  it('PT-27: test_rf010_pagar_pt27: Processo de pagamento de faturação e desconto de fidelidade', async function () {
    await test_rf010.run(driver, helpers);
  });

  it('PT-28: test_rf011_recolher_dados_sensores_pt28: Atualização do estado do sensor e sincronização nos logs de Admin', async function () {
    await test_rf011.run(driver, helpers);
  });

  it('PT-29: test_rf012_aceder_a_historico_pt29: Listagem ordenada por data no separador de Histórico', async function () {
    await test_rf012.run(driver, helpers);
  });
});
