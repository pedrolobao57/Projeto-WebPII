import apiClient from './client'

/**
 * NAVIGATION API
 * Use Cases: Navegar até a vaga, Localizar veículo
 */

// GET /navigation/route?origin=...&destination=... - Generate a route/ETA between two points
export const getRoute = (origin, destination) => {
  return apiClient.get('/navigation/route', { origin, destination })
}

// GET /vehicles/{vehicleId}/location - Get the last known location of a vehicle
export const getVehicleLocation = (vehicleId) => {
  return apiClient.get(`/vehicles/${vehicleId}/location`)
}
