/**
 * @file server.js
 * @description Ponto de entrada (Entrypoint) do servidor do backend.
 * Responsável por configurar o Express, definir as rotas da API RESTful,
 * estabelecer ligação com a base de dados MySQL via Sequelize, e iniciar a escuta de pedidos HTTP.
 */

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// --- Importação de Controladores (Controllers) ---
// Cada controlador agrupa a lógica de negócio correspondente às entidades da aplicação.
const UtilizadorController = require('./controllers/UtilizadorController');
const ParqueController = require('./controllers/ParqueController');
const ReservaController = require('./controllers/ReservaController');
const PagamentoController = require('./controllers/PagamentoController');
const EstacionamentoController = require('./controllers/EstacionamentoController');
const ManutencaoController = require('./controllers/ManutencaoController');

const app = express();
// Define a porta onde o servidor irá correr. Dá prioridade à variável de ambiente PORT.
const PORT = process.env.PORT || 3000;

// --- Configuração de Middlewares Globais ---
// Habilita o CORS (Cross-Origin Resource Sharing) para permitir pedidos de outras origens (como o frontend em Vite).
app.use(cors());
// Middleware para efetuar o parse automático do corpo dos pedidos no formato JSON.
app.use(express.json());

// --- Middlewares de Autenticação ---
// Carrega os validadores de autenticação e autorização para proteger rotas específicas.
const { verifyToken, verifyAdmin } = require('./middlewares/auth');
const authenticateToken = verifyToken;

// --- Rotas de Teste da API ---
/**
 * @route GET /api/teste
 * @description Rota utilitária simples para validar a conectividade com o servidor de base de dados.
 * Retorna a hora atual do servidor MySQL.
 */
app.get('/api/teste', async (req, res) => {
  try {
    // Executa uma query SQL direta na base de dados para testar a ligação.
    const [rows] = await sequelize.query('SELECT NOW() as hora');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- Rotas de Autenticação e Gestão de Utilizadores (Auth Routes) ---
// Rota para registo (sign up) de um novo utilizador no sistema.
app.post('/users', UtilizadorController.signup);
// Rota para login de utilizador (devolve um token fictício).
app.post('/users/login', UtilizadorController.login);
// Rota para renovação do token de acesso expirado recorrendo a um refresh token.
app.post('/users/refresh', UtilizadorController.refreshToken);
// Rota para iniciar o fluxo de recuperação de palavra-passe (envio de e-mail fictício).
app.post('/users/forgot-password', UtilizadorController.forgotPassword);
// Rota para redefinir a palavra-passe do utilizador usando o token de recuperação.
app.post('/users/reset-password', UtilizadorController.resetPassword);

// --- Rotas Protegidas de Perfil de Utilizador ---
// Obtém os dados do perfil do utilizador autenticado atual.
app.get('/users/me', authenticateToken, UtilizadorController.getProfile);
// Atualiza informações de perfil do utilizador autenticado atual (ex: nome, telemóvel).
app.patch('/users/me', authenticateToken, UtilizadorController.updateProfile);
// Altera a palavra-passe do utilizador autenticado atual.
app.post('/users/me/change-password', authenticateToken, UtilizadorController.changePassword);
// Associa/adiciona um veículo novo ao perfil do utilizador autenticado.
app.post('/users/me/vehicles', authenticateToken, UtilizadorController.adicionarVeiculo);
// Remove um veículo do perfil do utilizador autenticado.
app.delete('/users/me/vehicles/:vehicleId', authenticateToken, UtilizadorController.removerVeiculo);


// --- Rotas de Parques e Vagas de Estacionamento (Parks & Spots) ---
// Lista todos os parques de estacionamento disponíveis no sistema.
app.get('/parks', ParqueController.listarParques);
// Obtém os detalhes de um parque específico identificado pelo ID.
app.get('/parks/:parkId', ParqueController.obterParque);
// Lista todas as vagas e estados de um parque específico.
app.get('/parks/:parkId/spots', ParqueController.listarVagas);

// --- Rotas de Reservas (Reservations) ---
// Cria uma nova reserva de vaga para um período de tempo definido (Requer login).
app.post('/reservations', authenticateToken, ReservaController.criarReserva);
// Lista todas as reservas efetuadas pelo utilizador autenticado.
app.get('/users/me/reservations', authenticateToken, ReservaController.listarReservas);
// Obtém detalhes específicos de uma determinada reserva.
app.get('/reservations/:id', authenticateToken, ReservaController.obterReserva);
// Cancela uma reserva ativa e liberta o estado da respetiva vaga.
app.delete('/reservations/:id', authenticateToken, ReservaController.cancelarReserva);

// --- Rotas de Faturação e Pagamentos (Payments) ---
// Obtém os métodos de pagamento guardados e associados ao perfil do utilizador autenticado.
app.get('/users/me/payment-methods', authenticateToken, PagamentoController.obterMetodosPagamento);
// Efetua e processa o pagamento associado a uma determinada reserva.
app.post('/reservations/:reservationId/payments', authenticateToken, PagamentoController.criarPagamento);

// --- Simulação Física em Tempo Real (Entrada/Saída de Veículos) ---
// Simula a entrada de um veículo no parque (atualiza o estado da vaga para OCUPADA).
app.post('/estacionamentos/entrada', EstacionamentoController.registarEntrada);
// Simula a saída do veículo (calcula a estadia, aplica tarifas/descontos e gera o pagamento).
app.post('/estacionamentos/saida', EstacionamentoController.registarSaida);

// --- Rotas de Manutenção (Sensores e Parques) ---
// Cria um relatório de avaria de um sensor associado a uma vaga de estacionamento.
app.post('/maintenance/report', ManutencaoController.reportarAvaria);
// Conclui a reparação de uma avaria de sensor, voltando a colocá-lo operacional.
app.post('/maintenance/resolve', ManutencaoController.concluirReparacao);

// --- Fluxo de Inicialização do Servidor e da Base de Dados ---
/**
 * @function startServer
 * @async
 * @description Inicializa a ligação ao banco de dados MySQL via Sequelize, sincroniza os modelos definidos
 * (criando/alterando tabelas e colunas em falta de forma segura através do `{ alter: true }`)
 * e finalmente coloca o servidor Express em escuta na porta configurada.
 */
async function startServer() {
    try {
        console.log('Connecting to database...');
        // Testa a ligação física ao MySQL usando as credenciais do ficheiro .env.
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');
        
        // Sincroniza a estrutura dos modelos JS com o esquema da base de dados MySQL.
        console.log('Synchronizing database models...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized successfully.');
        
        // Inicia a escuta de ligações na porta definida.
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        // Encerra o processo da aplicação em caso de falha crítica na ligação à base de dados.
        process.exit(1);
    }
}

// Execução da função de arranque.
startServer();