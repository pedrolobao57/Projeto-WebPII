import apiClient from './client'

/**
 * PRICING API
 * Use Cases: Selecionar preço desejado
 */

// GET /price/options?context=reservation - Get price options for a given context (reservation or extension)
export const getPriceOptions = (context = 'reservation') => {
  return apiClient.get('/price/options', { context })
}
