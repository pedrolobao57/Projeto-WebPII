const db = require('./db');

// Exemplo: buscar todos os parques
db.query('SELECT * FROM parque_estacionamento', (err, results) => {
  if (err) throw err;
  console.log(results);
});
import apiClient from './client'

/**
 * PARKS API
 * Use Cases: Procurar lugares disponíveis
 */

// GET /parks/{parkId}/spots?available=true - List available spots in a park
export const getAvailableSpots = (parkId) => {
  return apiClient.get(`/parks/${parkId}/spots`, { available: true })
}
