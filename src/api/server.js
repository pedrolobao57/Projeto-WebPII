const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

// Lista de marcas permitidas
const ALLOWED_BRANDS = ['Toyota', 'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Renault', 'Peugeot', 'Tesla', 'Fiat'];

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Helper para ler/escrever na "Base de Dados"
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- USERS ---
app.post('/users', (req, res) => {
  const db = readDB();
  const { name, email, password, vehicles } = req.body;

  // Validações de Backend
  if (!name || name.length < 2) {
    return res.status(400).json({ message: 'Nome deve ter pelo menos 2 caracteres.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Email inválido (deve conter @).' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'A password deve ter pelo menos 6 caracteres.' });
  }

  // Validar se as marcas enviadas são permitidas
  if (vehicles && Array.isArray(vehicles)) {
    const invalidBrand = vehicles.find(v => v.brand && !ALLOWED_BRANDS.includes(v.brand));
    if (invalidBrand) {
      return res.status(400).json({ message: `A marca ${invalidBrand.brand} não é suportada.` });
    }
  }

  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Este email já está registado.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { 
    ...req.body, 
    id: Date.now().toString(), 
    password: hashedPassword 
  };

  db.users.push(newUser);
  writeDB(db);
  res.status(201).json(newUser);
});

app.post('/users/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  
  if (user && bcrypt.compareSync(password, user.password)) {
    res.json({ token: `fake-jwt-token-${user.id}`, user });
  } else {
    res.status(401).json({ message: 'Credenciais inválidas' });
  }
});

// --- PARKS & SPOTS ---
app.get('/parks/:parkId/spots', (req, res) => {
  const db = readDB();
  const park = db.parks.find(p => p.id === req.params.parkId);
  if (!park) return res.status(404).json({ message: 'Parque não encontrado' });
  
  const available = req.query.available === 'true';
  const spots = available ? park.spots.filter(s => s.available) : park.spots;
  res.json(spots);
});

// --- RESERVATIONS ---
app.post('/reservations', (req, res) => {
  const db = readDB();
  const newReservation = {
    id: Math.random().toString(36).substr(2, 9),
    status: 'active',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.reservations.push(newReservation);
  writeDB(db);
  res.status(201).json(newReservation);
});

app.get('/reservations/:id', (req, res) => {
  const db = readDB();
  const reser = db.reservations.find(r => r.id === req.params.id);
  reser ? res.json(reser) : res.status(404).send();
});

app.delete('/reservations/:id', (req, res) => {
  const db = readDB();
  db.reservations = db.reservations.filter(r => r.id !== req.params.id);
  writeDB(db);
  res.status(204).send();
});

// --- PAYMENTS ---
app.post('/reservations/:id/payments', (req, res) => {
  const db = readDB();
  const order = { id: Date.now(), reservationId: req.params.id, status: 'paid', ...req.body };
  db.orders.push(order);
  writeDB(db);
  res.json(order);
});

app.get('/users/me/payment-methods', (req, res) => {
  const db = readDB();
  res.json(db.paymentMethods);
});

// --- SENSORS (Simulação) ---
app.post('/sensors/:sensorId/events', (req, res) => {
  console.log(`Sensor ${req.params.sensorId} detetou evento:`, req.body);
  res.json({ success: true, timestamp: new Date() });
});

// --- REPORTS ---
app.get('/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders.filter(o => o.status === 'paid'));
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});