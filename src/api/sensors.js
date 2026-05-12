import apiClient from './client'

/**
 * SENSORS API
 * Use Cases: Detetar ocupação de vaga
 */

// POST /sensors/{sensorId}/events - Simulate vehicle detection via a sensor
export const triggerSensorEvent = (sensorId, eventData) => {
  return apiClient.post(`/sensors/${sensorId}/events`, eventData)
}
