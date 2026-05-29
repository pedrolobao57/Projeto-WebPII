import apiClient from './client'

/**
 * PAYMENTS API
 * Use Cases: Pagar estacionamento, Gerir métodos de pagamento
 */

// POST /reservations/{reservationId}/payments - Pay for a reservation
export const payReservation = (reservationId, paymentData) => {
  return apiClient.post(`/reservations/${reservationId}/payments`, paymentData)
}

// GET /users/me/payment-methods - List authenticated user's payment methods
export const getPaymentMethods = () => {
  return apiClient.get('/users/me/payment-methods')
}

// POST /users/me/payment-methods - Add a payment method (token from provider)
export const addPaymentMethod = (methodData) => {
  return apiClient.post('/users/me/payment-methods', methodData)
}

// PATCH /users/me/payment-methods/{paymentMethodId} - Update a payment method (e.g. set as default)
export const updatePaymentMethod = (paymentMethodId, updates) => {
  return apiClient.patch(`/users/me/payment-methods/${paymentMethodId}`, updates)
}

// DELETE /users/me/payment-methods/{paymentMethodId} - Remove a payment method
export const deletePaymentMethod = (paymentMethodId) => {
  return apiClient.delete(`/users/me/payment-methods/${paymentMethodId}`)
}
