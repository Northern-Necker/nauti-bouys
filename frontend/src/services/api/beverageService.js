import apiClient from './apiClient'

export const beverageService = {
  // Get all beverages with optional filters
  getAllBeverages: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key])
        }
      })
      
      const response = await apiClient.get(`/beverages/available?${params.toString()}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch beverages'
      }
    }
  },

  // Get beverage by ID
  getBeverageById: async (id) => {
    try {
      const response = await apiClient.get(`/beverages/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch beverage'
      }
    }
  },

  // Get beverages by category
  getBeveragesByCategory: async (category, options = {}) => {
    try {
      const params = new URLSearchParams()
      
      // Set a high limit to get all items by default
      const limit = options.limit || 100
      params.append('limit', limit)
      
      // Add other options if provided
      Object.keys(options).forEach(key => {
        if (options[key] && key !== 'limit') {
          params.append(key, options[key])
        }
      })
      
      const response = await apiClient.get(`/beverages/${category}?${params.toString()}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch beverages'
      }
    }
  },

  // Search beverages
  searchBeverages: async (query) => {
    try {
      const response = await apiClient.get(`/beverages/search?q=${encodeURIComponent(query)}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Search failed'
      }
    }
  },

  // Get featured beverages
  getFeaturedBeverages: async () => {
    try {
      const response = await apiClient.get('/beverages/featured')
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch featured beverages'
      }
    }
  },

  // Get available beverages (for today's specials)
  getAvailableBeverages: async () => {
    try {
      const response = await apiClient.get('/beverages/available')
      return { success: true, data: response.data.beverages || [] }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch available beverages'
      }
    }
  }
}
