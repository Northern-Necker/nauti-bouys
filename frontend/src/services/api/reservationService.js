import apiClient from './apiClient'

export const reservationService = {
  // Create a new reservation
  createReservation: async (reservationData) => {
    try {
      const response = await apiClient.post('/reservations', reservationData)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create reservation'
      }
    }
  },

  // Get user's reservations
  getUserReservations: async (userId) => {
    try {
      const response = await apiClient.get(`/reservations/user/${userId}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch reservations'
      }
    }
  },

  // Get reservation by ID
  getReservationById: async (id) => {
    try {
      const response = await apiClient.get(`/reservations/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch reservation'
      }
    }
  },

  // Update reservation
  updateReservation: async (id, updateData) => {
    try {
      const response = await apiClient.put(`/reservations/${id}`, updateData)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update reservation'
      }
    }
  },

  // Cancel reservation
  cancelReservation: async (id) => {
    try {
      const response = await apiClient.delete(`/reservations/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel reservation'
      }
    }
  },

  // Get available time slots for a specific date
  getAvailableSlots: async (date) => {
    try {
      const response = await apiClient.get(`/reservations/slots?date=${date}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch available slots'
      }
    }
  },

  // Get upcoming events
  getUpcomingEvents: async () => {
    try {
      const response = await apiClient.get('/reservations/events')
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch events'
      }
    }
  }
}