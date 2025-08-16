import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { reservationService } from '../../src/services/api/reservationService'
import apiClient from '../../src/services/api/apiClient'

// Mock the apiClient
vi.mock('../../src/services/api/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('ReservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createReservation', () => {
    it('should successfully create a reservation', async () => {
      const mockReservationData = {
        date: '2024-08-07',
        time: '18:00',
        partySize: 4,
        name: 'John Doe',
        email: 'john@example.com'
      }
      const mockResponse = { data: { id: '123', ...mockReservationData } }
      
      apiClient.post.mockResolvedValue(mockResponse)
      
      const result = await reservationService.createReservation(mockReservationData)
      
      expect(apiClient.post).toHaveBeenCalledWith('/reservations', mockReservationData)
      expect(result).toEqual({ success: true, data: mockResponse.data })
    })

    it('should handle creation errors', async () => {
      const mockError = {
        response: { data: { message: 'Time slot not available' } }
      }
      
      apiClient.post.mockRejectedValue(mockError)
      
      const result = await reservationService.createReservation({})
      
      expect(result).toEqual({
        success: false,
        error: 'Time slot not available'
      })
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      apiClient.post.mockRejectedValue(networkError)
      
      const result = await reservationService.createReservation({})
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to create reservation'
      })
    })
  })

  describe('getUserReservations', () => {
    it('should fetch user reservations successfully', async () => {
      const userId = 'user123'
      const mockReservations = [
        { id: '1', date: '2024-08-07', time: '18:00' },
        { id: '2', date: '2024-08-08', time: '19:00' }
      ]
      
      apiClient.get.mockResolvedValue({ data: mockReservations })
      
      const result = await reservationService.getUserReservations(userId)
      
      expect(apiClient.get).toHaveBeenCalledWith(`/reservations/user/${userId}`)
      expect(result).toEqual({ success: true, data: mockReservations })
    })

    it('should handle fetch errors', async () => {
      const mockError = {
        response: { data: { message: 'User not found' } }
      }
      
      apiClient.get.mockRejectedValue(mockError)
      
      const result = await reservationService.getUserReservations('invalid-user')
      
      expect(result).toEqual({
        success: false,
        error: 'User not found'
      })
    })
  })

  describe('getReservationById', () => {
    it('should fetch reservation by ID successfully', async () => {
      const reservationId = 'res123'
      const mockReservation = { id: reservationId, date: '2024-08-07', time: '18:00' }
      
      apiClient.get.mockResolvedValue({ data: mockReservation })
      
      const result = await reservationService.getReservationById(reservationId)
      
      expect(apiClient.get).toHaveBeenCalledWith(`/reservations/${reservationId}`)
      expect(result).toEqual({ success: true, data: mockReservation })
    })

    it('should handle not found errors', async () => {
      const mockError = {
        response: { data: { message: 'Reservation not found' } }
      }
      
      apiClient.get.mockRejectedValue(mockError)
      
      const result = await reservationService.getReservationById('invalid-id')
      
      expect(result).toEqual({
        success: false,
        error: 'Reservation not found'
      })
    })
  })

  describe('updateReservation', () => {
    it('should update reservation successfully', async () => {
      const reservationId = 'res123'
      const updateData = { partySize: 6, time: '19:00' }
      const mockResponse = { data: { id: reservationId, ...updateData } }
      
      apiClient.put.mockResolvedValue(mockResponse)
      
      const result = await reservationService.updateReservation(reservationId, updateData)
      
      expect(apiClient.put).toHaveBeenCalledWith(`/reservations/${reservationId}`, updateData)
      expect(result).toEqual({ success: true, data: mockResponse.data })
    })

    it('should handle update errors', async () => {
      const mockError = {
        response: { data: { message: 'Cannot update past reservation' } }
      }
      
      apiClient.put.mockRejectedValue(mockError)
      
      const result = await reservationService.updateReservation('res123', {})
      
      expect(result).toEqual({
        success: false,
        error: 'Cannot update past reservation'
      })
    })
  })

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', async () => {
      const reservationId = 'res123'
      const mockResponse = { data: { message: 'Reservation cancelled' } }
      
      apiClient.delete.mockResolvedValue(mockResponse)
      
      const result = await reservationService.cancelReservation(reservationId)
      
      expect(apiClient.delete).toHaveBeenCalledWith(`/reservations/${reservationId}`)
      expect(result).toEqual({ success: true, data: mockResponse.data })
    })

    it('should handle cancellation errors', async () => {
      const mockError = {
        response: { data: { message: 'Cannot cancel reservation' } }
      }
      
      apiClient.delete.mockRejectedValue(mockError)
      
      const result = await reservationService.cancelReservation('res123')
      
      expect(result).toEqual({
        success: false,
        error: 'Cannot cancel reservation'
      })
    })
  })

  describe('getAvailableSlots', () => {
    it('should fetch available slots for a date', async () => {
      const date = '2024-08-07'
      const mockSlots = ['17:00', '17:30', '18:00', '18:30', '19:00']
      
      apiClient.get.mockResolvedValue({ data: mockSlots })
      
      const result = await reservationService.getAvailableSlots(date)
      
      expect(apiClient.get).toHaveBeenCalledWith(`/reservations/slots?date=${date}`)
      expect(result).toEqual({ success: true, data: mockSlots })
    })

    it('should handle invalid date errors', async () => {
      const mockError = {
        response: { data: { message: 'Invalid date format' } }
      }
      
      apiClient.get.mockRejectedValue(mockError)
      
      const result = await reservationService.getAvailableSlots('invalid-date')
      
      expect(result).toEqual({
        success: false,
        error: 'Invalid date format'
      })
    })
  })

  describe('getUpcomingEvents', () => {
    it('should fetch upcoming events successfully', async () => {
      const mockEvents = [
        { id: '1', name: 'Wine Tasting', date: '2024-08-10' },
        { id: '2', name: 'Live Music', date: '2024-08-15' }
      ]
      
      apiClient.get.mockResolvedValue({ data: mockEvents })
      
      const result = await reservationService.getUpcomingEvents()
      
      expect(apiClient.get).toHaveBeenCalledWith('/reservations/events')
      expect(result).toEqual({ success: true, data: mockEvents })
    })

    it('should handle events fetch errors', async () => {
      const mockError = {
        response: { data: { message: 'Failed to load events' } }
      }
      
      apiClient.get.mockRejectedValue(mockError)
      
      const result = await reservationService.getUpcomingEvents()
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to load events'
      })
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle undefined error responses', async () => {
      const unknownError = new Error('Unknown error')
      apiClient.post.mockRejectedValue(unknownError)
      
      const result = await reservationService.createReservation({})
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to create reservation'
      })
    })

    it('should handle empty error response', async () => {
      const emptyError = { response: { data: {} } }
      apiClient.get.mockRejectedValue(emptyError)
      
      const result = await reservationService.getUserReservations('user123')
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to fetch reservations'
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const mockResponse = { data: { id: '123' } }
      apiClient.post.mockResolvedValue(mockResponse)
      
      const promises = Array(10).fill(null).map(() =>
        reservationService.createReservation({ date: '2024-08-07' })
      )
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should timeout gracefully on slow requests', async () => {
      // Mock a slow request
      apiClient.get.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: [] }), 5000))
      )
      
      const startTime = Date.now()
      const result = await Promise.race([
        reservationService.getUserReservations('user123'),
        new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 1000))
      ])
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(2000)
    })
  })
})