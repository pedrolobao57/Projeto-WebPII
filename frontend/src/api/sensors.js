import apiClient from './client'

/**
 * SENSORS API
 * Use Cases: Detetar ocupação de vaga, Reportar avaria de sensor
 */

// POST /sensors/{sensorId}/events - Simulate vehicle detection via a sensor
export const triggerSensorEvent = (sensorId, eventData) => {
  return apiClient.post(`/sensors/${sensorId}/events`, eventData)
}

// POST /maintenance/report - Report a sensor issue by vaga or sensor id
export const reportSensorError = (reportData) => {
  return apiClient.post('/maintenance/report', reportData)
}

// GET /maintenance/pending - Get list of pending/reported sensor issues (Admin only)
export const getPendingReports = () => {
  return apiClient.get('/maintenance/pending')
}

// POST /maintenance/resolve - Mark a report as resolved (Admin only)
export const resolveReport = (resolveData) => {
  return apiClient.post('/maintenance/resolve', resolveData)
}

