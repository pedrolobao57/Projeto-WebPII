import apiClient from './client'

/**
 * PARKS API
 * Use Cases: Procurar lugares disponíveis
 */

// GET /parks - List all parks
export const getParks = () => {
  return apiClient.get('/parks')
}

// GET /parks/{parkId} - Get park details
export const getParkDetails = (parkId) => {
  return apiClient.get(`/parks/${parkId}`)
}

// GET /parks/{parkId}/spots - List spots in a park grouped by level/zone
export const getParkSpots = (parkId) => {
  return apiClient.get(`/parks/${parkId}/spots`)
}

// GET /parks/{parkId}/spots?available=true - List available spots in a park
export const getAvailableSpots = (parkId) => {
  return apiClient.get(`/parks/${parkId}/spots`, { available: true })
}
