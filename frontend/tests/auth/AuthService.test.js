import { authService } from '../../src/services/api/authService'
import apiClient from '../../src/services/api/apiClient'

// Mock the API client
jest.mock('../../src/services/api/apiClient')

// Mock localStorage
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('AuthService - Security Testing', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('CRITICAL SECURITY ISSUE: JWT in localStorage', () => {
    test('SECURITY VIOLATION: JWT tokens stored in localStorage', async () => {
      const mockResponse = {
        data: {
          token: 'jwt.token.here',
          user: { id: 1, email: 'test@example.com' }
        }
      }
      apiClient.post.mockResolvedValue(mockResponse)

      await authService.login({ email: 'test@example.com', password: 'password' })

      // CRITICAL SECURITY ISSUE: JWT stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'jwt.token.here')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user))
    })

    test('SECURITY RISK: Token accessible via JavaScript', () => {
      localStorageMock.setItem('auth_token', 'vulnerable.jwt.token')
      
      const token = authService.isAuthenticated()
      expect(token).toBe(true)
      
      // This demonstrates the vulnerability - any script can access the token
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
    })

    test('SECURITY CONCERN: User data stored in localStorage', async () => {
      const userData = {
        id: 1,
        email: 'test@example.com',
        role: 'admin',
        personalInfo: 'sensitive data'
      }
      
      const mockResponse = {
        data: {
          token: 'jwt.token.here',
          user: userData
        }
      }
      apiClient.post.mockResolvedValue(mockResponse)

      await authService.register(userData)

      // User data including potentially sensitive info stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(userData))
    })
  })

  describe('Login Function Testing', () => {
    test('successful login stores token and user data', async () => {
      const mockResponse = {
        data: {
          token: 'valid.jwt.token',
          user: { id: 1, email: 'test@example.com', name: 'Test User' }
        }
      }
      apiClient.post.mockResolvedValue(mockResponse)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
    })

    test('failed login returns error message', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      }
      apiClient.post.mockRejectedValue(errorResponse)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })

    test('network error returns default error message', async () => {
      apiClient.post.mockRejectedValue(new Error('Network error'))

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Login failed')
    })
  })

  describe('Register Function Testing', () => {
    test('successful registration stores token and user data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-123-4567'
      }

      const mockResponse = {
        data: {
          token: 'new.user.token',
          user: { id: 2, ...userData }
        }
      }
      apiClient.post.mockResolvedValue(mockResponse)

      const result = await authService.register(userData)

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
    })

    test('failed registration returns error message', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Email already exists'
          }
        }
      }
      apiClient.post.mockRejectedValue(errorResponse)

      const result = await authService.register({
        email: 'existing@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
    })
  })

  describe('Logout Function Testing', () => {
    test('successful logout clears local storage', async () => {
      localStorageMock.setItem('auth_token', 'token.to.clear')
      localStorageMock.setItem('user', '{"id": 1}')
      
      apiClient.post.mockResolvedValue({ data: {} })

      const result = await authService.logout()

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(result.success).toBe(true)
    })

    test('logout clears storage even if API call fails', async () => {
      localStorageMock.setItem('auth_token', 'token.to.clear')
      localStorageMock.setItem('user', '{"id": 1}')
      
      apiClient.post.mockRejectedValue(new Error('API error'))

      const result = await authService.logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(result.success).toBe(true)
    })
  })

  describe('User Management Functions Testing', () => {
    test('getCurrentUser returns parsed user data', () => {
      const userData = { id: 1, name: 'Test User', email: 'test@example.com' }
      localStorageMock.setItem('user', JSON.stringify(userData))

      const user = authService.getCurrentUser()

      expect(user).toEqual(userData)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('user')
    })

    test('getCurrentUser returns null for invalid JSON', () => {
      localStorageMock.setItem('user', 'invalid-json')

      const user = authService.getCurrentUser()

      expect(user).toBeNull()
    })

    test('getCurrentUser returns null when no user stored', () => {
      const user = authService.getCurrentUser()

      expect(user).toBeNull()
    })

    test('isAuthenticated returns true when token exists', () => {
      localStorageMock.setItem('auth_token', 'valid.token')

      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(true)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
    })

    test('isAuthenticated returns false when no token', () => {
      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(false)
    })
  })

  describe('Token Refresh Function Testing', () => {
    test('successful token refresh updates stored token', async () => {
      const mockResponse = {
        data: {
          token: 'refreshed.jwt.token'
        }
      }
      apiClient.post.mockResolvedValue(mockResponse)

      const result = await authService.refreshToken()

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'refreshed.jwt.token')
      expect(result.success).toBe(true)
      expect(result.token).toBe('refreshed.jwt.token')
    })

    test('failed token refresh returns error', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Refresh token expired'
          }
        }
      }
      apiClient.post.mockRejectedValue(errorResponse)

      const result = await authService.refreshToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Refresh token expired')
    })
  })

  describe('Data Persistence and Security Concerns', () => {
    test('VULNERABILITY: localStorage persists across browser sessions', () => {
      localStorageMock.setItem('auth_token', 'persistent.token')
      localStorageMock.setItem('user', '{"sensitive": "data"}')

      // Simulate page refresh/close and reopen
      const token = localStorageMock.getItem('auth_token')
      const user = localStorageMock.getItem('user')

      // Data persists - this is the security vulnerability
      expect(token).toBe('persistent.token')
      expect(user).toBe('{"sensitive": "data"}')
    })

    test('XSS vulnerability demonstration', () => {
      // Any malicious script can access localStorage
      const maliciousScript = () => {
        return window.localStorage.getItem('auth_token')
      }

      localStorageMock.setItem('auth_token', 'vulnerable.token')
      
      // This demonstrates how easily XSS attacks can steal tokens
      const stolenToken = maliciousScript()
      expect(stolenToken).toBe('vulnerable.token')
    })
  })
})