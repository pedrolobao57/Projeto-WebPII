import apiClient from './client'

/**
 * PARKS API
 * Use Cases: Procurar lugares disponíveis
 */

// GET /parks/{parkId}/spots?available=true - List available spots in a park
export const getAvailableSpots = (parkId) => {
  return apiClient.get(`/parks/${parkId}/spots`, { available: true })
}
