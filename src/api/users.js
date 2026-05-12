import apiClient from './client'

/**
 * USERS API
 * Use Cases: Criar conta, Login
 */

// GET /users/{userId} - Get user by ID
export const getUserById = (userId) => {
  return apiClient.get(`/users/${userId}`)
}

// POST /users - Register a new user account
export const createUser = (userData) => {
  return apiClient.post('/users', userData)
}

// POST /users/login - Login and receive a JWT token
export const loginUser = (credentials) => {
  return apiClient.post('/users/login', credentials)
}
