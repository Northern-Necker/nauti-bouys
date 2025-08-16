import apiClient from './apiClient'

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      const { token, user } = response.data
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      return { success: true, data: { token, user } }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData)
      const { token, user } = response.data
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      return { success: true, data: { token, user } }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      return { success: true }
    } catch (error) {
      // Still remove local storage even if API call fails
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      return { success: true }
    }
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch (error) {
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('auth_token')
    return !!token
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh')
      const { token } = response.data
      
      localStorage.setItem('auth_token', token)
      return { success: true, token }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token refresh failed'
      }
    }
  }
}