import { useState, useEffect, createContext, useContext } from 'react'
import { authService } from '../services/api/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on app start
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      const currentUser = authService.getCurrentUser()
      
      setIsAuthenticated(authenticated)
      setUser(currentUser)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    setIsLoading(true)
    const result = await authService.login(credentials)
    
    if (result.success) {
      setUser(result.data.user)
      setIsAuthenticated(true)
    }
    
    setIsLoading(false)
    return result
  }

  const register = async (userData) => {
    setIsLoading(true)
    const result = await authService.register(userData)
    
    if (result.success) {
      setUser(result.data.user)
      setIsAuthenticated(true)
    }
    
    setIsLoading(false)
    return result
  }

  const logout = async () => {
    setIsLoading(true)
    await authService.logout()
    setUser(null)
    setIsAuthenticated(false)
    setIsLoading(false)
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}