const db = require('./db');

async function testarConexao() {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS resultado');
    console.log('✅ Conexão bem sucedida! Resultado:', rows[0].resultado);
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message);
  }
}

testarConexao();