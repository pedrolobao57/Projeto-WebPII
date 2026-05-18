const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/teste', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() as hora');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.listen(3000, () => {
  console.log('Servidor a correr');
});