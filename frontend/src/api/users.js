import apiClient from './client'
import { generateFakeUser } from '../../utils/GenerateFakeUsers'

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

// Simulate login with a generated fake user for development/testing
export const loginFakeUser = async () => {
  const fakeUser = generateFakeUser()

  try {
    // Tenta criar o utilizador falso. Se já existir (erro 409), será capturado.
    await createUser(fakeUser)
  } catch (error) {
    // Se o erro for 409 (Conflict), significa que o utilizador já existe.
    // Podemos ignorar este erro e prosseguir para o login.
    if (error.status === 409) {
      console.log(`Utilizador falso com email ${fakeUser.email} já existe. A prosseguir para o login.`)
    } else {
      // Para qualquer outro erro durante a criação, relança-o.
      console.error('Erro ao criar utilizador falso:', error)
      throw error
    }
  }

  // Após garantir que o utilizador existe (criado ou já existente), tenta fazer login.
  const response = await loginUser({ email: fakeUser.email, password: fakeUser.password })
  localStorage.setItem('token', response.token)
  if (response.refreshToken) {
    localStorage.setItem('refreshToken', response.refreshToken)
  }
  return response.user
}

// POST /users/me/vehicles - Add a vehicle to the authenticated user's profile
export const addVehicle = (vehicleData) => {
  return apiClient.post('/users/me/vehicles', vehicleData)
}

// GET /users/me - Get current user profile
export const getUserProfile = () => {
  return apiClient.get('/users/me')
}


