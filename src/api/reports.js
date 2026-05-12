import apiClient from './client'

/**
 * REPORTS API
 * Use Cases: Gerar relatórios (Admin only)
 */

// GET /orders?status=paid - Administrator retrieves all paid orders
export const getPaidOrders = () => {
  return apiClient.get('/orders', { status: 'paid' })
}

// GET / - Generate a park usage report with optional time range filters
export const getParkReport = (filters = {}) => {
  return apiClient.get('/', filters)
}
