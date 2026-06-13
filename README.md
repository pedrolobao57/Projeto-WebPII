# 🅿️ ParkSmart — Sistema Integrado de Gestão de Estacionamento Inteligente

O **ParkSmart** é uma plataforma fullstack moderna e robusta projetada para simplificar e automatizar a gestão de parques de estacionamento, a reserva de lugares e a monitorização de sensores em tempo real. Este ecossistema foi concebido para resolver o problema clássico de ineficiência na procura de vagas, disponibilizando um painel de controlo interativo para clientes e administradores.

O projeto integra uma API REST robusta em Node.js com persistência de dados em MySQL (via Sequelize ORM) e uma interface rica desenvolvida com Vue 3 (Vite), complementada por simulações físicas de fluxo e sensores IoT, além de um ecossistema completo de testes funcionais e de performance.

---

## 🛠️ Tecnologias Utilizadas

A plataforma baseia-se numa arquitetura desacoplada e modular dividida em três pilares fundamentais:

### Backend
*   **Node.js & Express**: Criação do servidor HTTP e da API RESTful.
*   **Sequelize ORM**: Modelação de base de dados relacional e abstração de consultas SQL.
*   **MySQL**: Armazenamento persistente e estruturado de dados.
*   **@faker-js/faker**: Geração de dados de teste realistas (seeding) para simulações.
*   **BcryptJS**: Cifragem e segurança de credenciais de utilizador.

### Frontend
*   **Vue 3 (Composition API)**: Framework reativo para construção de interfaces SPA.
*   **Vite**: Ferramenta de build ultra-rápida e servidor de desenvolvimento.
*   **Leaflet.js**: Renderização e interatividade de mapas para localização visual de parques e lugares.
*   **Phosphor Icons**: Biblioteca moderna de ícones vetoriais.

### Automação de Testes
*   **Selenium WebDriver & Mocha**: Automação funcional de cenários E2E (End-to-End).
*   **Apache JMeter**: Testes não funcionais de carga, stress e concorrência sobre a API.

---

## 📂 Estrutura de Pastas do Monorepo

O projeto está organizado no formato de monorepo estruturado da seguinte forma:

```text
Projeto-WebPII/
├── backend/                  # Servidor API REST e Modelos de Base de Dados
│   ├── config/               # Configurações de ligação à base de dados (Sequelize)
│   ├── controllers/          # Lógica de negócio (Estacionamentos, Reservas, Utilizadores)
│   ├── middlewares/          # Autenticação e autorização (verifyToken, verifyAdmin)
│   ├── models/               # Modelos Sequelize (Vaga, Tarifa, Utilizador, Veiculo)
│   ├── sql/                  # Scripts SQL de schema e queries de teste
│   ├── seed.mjs              # Script de população fictícia de base de dados (Faker.js)
│   └── server.js             # Ficheiro de entrada da API Express
├── frontend/                 # Aplicação SPA em Vue 3
│   ├── src/
│   │   ├── api/              # Comunicação HTTP estruturada com o backend
│   │   ├── components/       # Componentes Vue reutilizáveis
│   │   ├── composables/      # Lógica partilhada (ex: useAuth para sessões)
│   │   ├── router/           # Encaminhamento de rotas e navegação da SPA
│   │   └── views/            # Páginas e dashboards (Cliente e Administração)
│   └── vite.config.js        # Configuração de build do Vite
├── tests/                    # Ecossistema de Automação de Testes
│   ├── pages/                # Page Object Model (POM) para UI E2E
│   ├── jmeter/               # Planos de teste de performance (.jmx) e massa de dados
│   └── test_functional.js    # Casos de teste funcionais JUnit/Mocha
└── docker-compose.yml        # Configuração de ambiente isolado via Docker (opcional)
```

---

## 🚀 Como Iniciar o Projeto (Passo a Passo)

### 📋 Pré-requisitos
Antes de começares, certifica-te de ter instalado no teu computador:
1.  **Node.js 18+** e npm (Node Package Manager).
2.  **Servidor MySQL** (local ou em container Docker).

---

### Passo 1: Configurar a Base de Dados
Acede ao teu terminal MySQL e importa o ficheiro de criação de base de dados:

```bash
# Se o MySQL exigir palavra-passe:
mysql -u root -p < backend/sql/schema.sql

# Se estiveres a usar palavra-passe vazia localmente:
mysql -u root < backend/sql/schema.sql
```

---

### Passo 2: Instalar as Dependências
Podes instalar as dependências de cada módulo executando a partir da raiz do monorepo:

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix tests
```

---

### Passo 3: Configurar Variáveis de Ambiente
Cria o ficheiro `.env` no diretório **backend/** a partir do exemplo fornecido:

*   **No Linux / macOS / Git Bash:**
    ```bash
    cp backend/.env.example backend/.env
    ```
*   **No Windows PowerShell:**
    ```powershell
    Copy-Item backend/.env.example backend/.env
    ```

Abre o ficheiro `backend/.env` e ajusta os valores de acordo com as credenciais do teu servidor MySQL local:
```env
DB_HOST=127.0.0.1
DB_USER=o_teu_utilizador_mysql
DB_PASSWORD=a_tua_palavra_passe_mysql
DB_NAME=gestor_estacionamento
DB_PORT=3306
PORT=3000
RESET_DATABASE=true
```

---

### Passo 4: Popular a Base de Dados (Seeding)
O script de seeding gera automaticamente utilizadores (clientes e admins), parques de estacionamento, vagas distribuídas por zonas, tarifas e históricos de estacionamento. Para o executar:

```bash
npm run seed:b
```

---

### Passo 5: Executar a Aplicação localmente

Podes correr o servidor e o cliente em simultâneo recorrendo aos scripts de conveniência definidos no package.json da raiz:

1.  **Iniciar a API do Backend:**
    ```bash
    npm run dev:b
    ```
    *(A API estará ativa em: `http://localhost:3000`)*

2.  **Iniciar o Servidor de Desenvolvimento Frontend:**
    ```bash
    npm run dev:f
    ```
    *(O frontend estará acessível em: `http://localhost:5173`)*

---

## 🧪 Validação e Testes do Sistema

O sistema dispõe de testes integrados e prontos a serem executados na pasta `tests/`.

### Testes Funcionais de Interface (E2E)
Os testes UI são baseados em Selenium WebDriver com padrão POM. Para os correr:
1. Certifica-te de que o frontend e o backend estão ativos nos respetivos endereços por omissão.
2. No diretório `tests/`, executa:
   ```bash
   cd tests
   npm test
   ```

### Testes de Carga e Stress (Apache JMeter)
Para correr o teste de performance sem interface gráfica (CLI) e gerar um relatório completo de desempenho em formato HTML:
```bash
cd tests/jmeter
jmeter -n -t scripts/test_performance.jmx -l results.jtl -e -o dashboard
```

*Para mais detalhes sobre cobertura de requisitos, mapeamento no Jira/Xray e importação de métricas, consulta o guia dedicado em [tests/README.md](file:///c:/Users/LYT/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/gon%C3%A7alo/escola/projeto2/Projeto-WebPII/tests/README.md).*

