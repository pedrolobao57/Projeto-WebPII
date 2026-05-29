import apiClient from './client'

/**
 * RESERVATIONS API
 * Use Cases: Reservar vaga, Prolongar reserva, Navegar até a vaga
 */

// POST /reservations - Create a new reservation for a spot
export const createReservation = (reservationData) => {
  return apiClient.post('/reservations', reservationData)
}

// GET /reservations/{reservationId} - Get reservation details (includes location/destination and vehicle)
export const getReservation = (reservationId) => {
  return apiClient.get(`/reservations/${reservationId}`)
}

// GET /users/me/reservations - Get all reservations of the current authenticated user
export const getUserReservations = () => {
  return apiClient.get('/users/me/reservations')
}

// DELETE /reservations/{reservationId} - Cancel a reservation
export const cancelReservation = (reservationId) => {
  return apiClient.delete(`/reservations/${reservationId}`)
}

// POST /reservations/{reservationId}/extend - Extend a reservation with a new end time and optional price option
export const extendReservation = (reservationId, extendData) => {
  return apiClient.post(`/reservations/${reservationId}/extend`, extendData)
}

// GET /reservations/{reservationId}/quote?newEndTime=... - Simulate cost to extend reservation
export const getExtensionQuote = (reservationId, newEndTime) => {
  return apiClient.get(`/reservations/${reservationId}/quote`, { newEndTime })
}
