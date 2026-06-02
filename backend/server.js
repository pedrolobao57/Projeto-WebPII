const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// Import Controllers
const UtilizadorController = require('./controllers/UtilizadorController');
const ParqueController = require('./controllers/ParqueController');
const ReservaController = require('./controllers/ReservaController');
const PagamentoController = require('./controllers/PagamentoController');
const EstacionamentoController = require('./controllers/EstacionamentoController');
const ManutencaoController = require('./controllers/ManutencaoController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Authentication Middlewares ---
const { verifyToken, verifyAdmin } = require('./middlewares/auth');
const authenticateToken = verifyToken;

// --- API Test Route ---
app.get('/api/teste', async (req, res) => {
  try {
    const [rows] = await sequelize.query('SELECT NOW() as hora');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- Auth Routes ---
app.post('/users', UtilizadorController.signup);
app.post('/users/login', UtilizadorController.login);
app.post('/users/refresh', UtilizadorController.refreshToken);
app.get('/users/me', authenticateToken, UtilizadorController.getProfile);
app.patch('/users/me', authenticateToken, UtilizadorController.updateProfile);
app.post('/users/me/change-password', authenticateToken, UtilizadorController.changePassword);
app.post('/users/me/vehicles', authenticateToken, UtilizadorController.adicionarVeiculo);


// --- Parks & Spots Routes ---
app.get('/parks', ParqueController.listarParques);
app.get('/parks/:parkId', ParqueController.obterParque);
app.get('/parks/:parkId/spots', ParqueController.listarVagas);

// --- Reservations Routes ---
app.post('/reservations', authenticateToken, ReservaController.criarReserva);
app.get('/users/me/reservations', authenticateToken, ReservaController.listarReservas);
app.get('/reservations/:id', authenticateToken, ReservaController.obterReserva);
app.delete('/reservations/:id', authenticateToken, ReservaController.cancelarReserva);

// --- Payments Routes ---
app.get('/users/me/payment-methods', authenticateToken, PagamentoController.obterMetodosPagamento);
app.post('/reservations/:reservationId/payments', authenticateToken, PagamentoController.criarPagamento);

// --- Real-time Entry/Exit simulation ---
app.post('/estacionamentos/entrada', EstacionamentoController.registarEntrada);
app.post('/estacionamentos/saida', EstacionamentoController.registarSaida);

// --- Maintenance Routes ---
app.post('/maintenance/report', ManutencaoController.reportarAvaria);
app.post('/maintenance/resolve', ManutencaoController.concluirReparacao);

// Initialize DB and start server
async function startServer() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');
        
        // Sync models to database (create missing tables/columns like tarifa)
        console.log('Synchronizing database models...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized successfully.');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();