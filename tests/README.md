# 🧪 Projeto de Automação de Testes (TPW - ESMAD)

Este diretório contém o ecossistema completo de automação de testes funcionais (E2E) e não funcionais (Carga e Stress) desenvolvido para a plataforma **ParkSmart**, no âmbito da Entrega Final da unidade curricular de **Testes e Performance Web (TPW)** da **ESMAD**.

O objetivo deste projeto é validar o comportamento do sistema de gestão de estacionamento sob as perspetivas de usabilidade do utilizador e desempenho sob concorrência, mapeando diretamente as execuções aos Casos de Teste (Test Cases) do **Jira/Xray** (Projeto PT).

---

## 🏗️ Arquitetura do Projeto

Os testes encontram-se estruturados da seguinte forma:

```text
tests/
├── README.md                 # Este guia de configuração, execução e rastreabilidade
├── package.json              # Dependências e scripts de execução do Mocha/Selenium JS
├── test_functional.js        # Cobertura dos 12 Casos de Teste (RF001 a RF012 / PT-18 a PT-29)
├── pages/                    # Padrão Page Object Model (POM) para isolar seletores
│   ├── BasePage.js           # Abstrações de esperas explícitas (WebDriverWait)
│   ├── LandingPage.js        # Elementos da página inicial
│   ├── LoginPage.js          # Elementos do formulário de autenticação
│   ├── RegisterPage.js       # Elementos do formulário de criação de conta
│   ├── ForgotPasswordPage.js # Elementos da página de redefinição de password
│   ├── DashboardPage.js      # Elementos do painel de controlo (Cliente / Admin)
│   └── PaymentPage.js        # Elementos do checkout de reserva
└── jmeter/                   # Testes Não Funcionais (Performance e Carga)
    ├── data/
    │   └── users.csv         # Massa de dados de utilizadores virtuais (seeded)
    └── scripts/
        └── test_performance.jmx # Plano de Teste XML válido para Apache JMeter
```

---

## ⚙️ Pré-requisitos

Garante que tens as seguintes ferramentas instaladas no teu computador:
1.  **Node.js 18+** (com o gestor de pacotes `npm`).
2.  **Google Chrome** (o WebDriver do Chrome será gerido e descarregado automaticamente pelo Selenium WebDriver).
3.  **Apache JMeter 5.5+** (adiciona a pasta `/bin` do JMeter ao `PATH` do teu sistema operativo).

---

## 🏃 Execução dos Testes de Automação UI (Selenium + Mocha)

### 1. Instalar as dependências do Node.js
Navega até à pasta `tests` e instala as dependências declaradas em `package.json`:
```bash
cd tests
npm install
```

### 2. Executar os Testes
Certifica-te de que a aplicação está ativa localmente (Frontend em `http://localhost:5173` e Backend em `http://localhost:3000`).

*   **Executar em Modo Headless (Sem abrir a janela do Chrome - Recomendado para CI/CD):**
    ```bash
    npm test
    ```

*   **Executar em Modo Visual (Headed - Abre a janela do Chrome para acompanhar a execução):**
    *   **No PowerShell (Windows):**
        ```powershell
        $env:HEADED="true"; npm test
        ```
    *   **No Prompt de Comando (cmd.exe):**
        ```cmd
        set HEADED=true&& npm test
        ```
    *   **No Bash (Linux/macOS):**
        ```bash
        HEADED=true npm test
        ```

*   **Evidências de Falha:** Caso algum teste falhe, o Mocha capturará automaticamente um screenshot do ecrã e gravá-lo-á na pasta `/tests/evidence/`.

---

## 📊 Execução dos Testes de Performance (Apache JMeter)

O plano de testes `test_performance.jmx` simula fluxos sob carga utilizando 3 Thread Groups:
*   **Grupo 1:** Login simultâneo de 50 utilizadores em simultâneo (RF002).
*   **Grupo 2:** Consulta recorrente de vagas por 30 utilizadores virtuais (RF005).
*   **Grupo 3:** Simulação física de sensores IoT (5 sensores a comunicar entradas/saídas continuamente - RF011).

### Executar via Command Line (Modo Não-GUI - Recomendado)
Executa o teste a partir da pasta `tests/jmeter`, gravando as métricas de performance no ficheiro de logs `results.jtl` e gerando o dashboard HTML interativo na pasta `dashboard`:

```bash
cd tests/jmeter
jmeter -n -t scripts/test_performance.jmx -l results.jtl -e -o dashboard
```

*   **Resultados de Performance:** Abre o ficheiro `tests/jmeter/dashboard/index.html` em qualquer navegador para veres os gráficos de Apdex, tempos de resposta (NFR1 < 2000ms), throughput e taxa de erros.

---

## 📋 Rastreabilidade de Casos de Teste (Jira / Xray)

Para cumprir os critérios de avaliação, a tabela abaixo mapeia cada Requisito Funcional (RF) do enunciado ao respetivo Test Case ID do Jira/Xray e ao script de automação correspondente:

| Requisito | Jira ID | Descrição do Teste (Expected Result) | Função Automática (Selenium / JS) |
| :--- | :--- | :--- | :--- |
| **RF001** | `PT-18` | Registo de Cliente e verificação de gravação de dados. | `test_rf001_criar_conta_pt18` |
| **RF002** | `PT-19` | Login sucesso (Cliente/Admin) e rejeição de inválidos. | `test_rf002_login_pt19` |
| **RF003** | `PT-20` | Pedido de PIN de recuperação de password e erros. | `test_rf003_recuperar_password_pt20` |
| **RF004** | `PT-21` | Login de Admin e verificação de visualização de vagas livres. | `test_rf004_registar_lugares_pt21` |
| **RF005** | `PT-22` | Mapa/Detalhes de estacionamento exibe cores de ocupação correta. | `test_rf005_consultar_lugares_pt22` |
| **RF006** | `PT-23` | Reserva de vaga e validação do cálculo total do preço. | `test_rf006_reservar_lugares_pt23` |
| **RF007** | `PT-24` | Clicar em "I've Arrived" no painel e marcar vaga como Ocupado. | `test_rf007_marcar_presenca_pt24` |
| **RF008** | `PT-25` | Atualização em tempo real do tempo/preço acumulado no painel. | `test_rf008_acompanhar_estacionamento_pt25` |
| **RF009** | `PT-26` | Processar saída da vaga e atualizar o seu estado para Livre. | `test_rf009_registar_saida_pt26` |
| **RF010** | `PT-27` | Processo de pagamento de faturação e desconto de fidelidade. | `test_rf010_pagar_pt27` |
| **RF011** | `PT-28` | Atualização do estado do sensor e sincronização nos logs de Admin. | `test_rf011_recolher_dados_sensores_pt28` |
| **RF012** | `PT-29` | Listagem ordenada por data no separador de Histórico. | `test_rf012_aceder_a_historico_pt29` |

---

## 📤 Integração e Exportação de Resultados para o Jira/Xray

Para submeter os resultados obtidos automaticamente para a plataforma do Jira através da API do Xray, podes efetuar o upload dos relatórios gerados.

### 1. Importar os Resultados do E2E (JUnit / JSON)
Se utilizares um formatador junit com o Mocha (ex: `mocha-junit-reporter`), podes enviar o relatório XML resultante diretamente para a API do Xray:

```bash
curl -H "Content-Type: text/xml" -u "USERNAME:PASSWORD" -X POST --data @results_junit.xml "https://YOUR_JIRA_INSTANCE/rest/raven/2.0/import/execution/junit?projectKey=PT"
```

### 2. Importar os Resultados de Performance do JMeter (JTL / CSV)
Para anexar os logs de performance às execuções de testes do Xray no Jira:
1. Acede à execução de teste (Test Execution) correspondente no Jira.
2. Na secção de anexos, adiciona o ficheiro `results.jtl` e o ficheiro compactado em `.zip` contendo os relatórios do `dashboard` HTML para servir de evidência gráfica para o docente.
