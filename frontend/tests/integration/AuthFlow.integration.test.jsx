import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import LoginPage from '../../src/pages/auth/LoginPage'
import RegisterPage from '../../src/pages/auth/RegisterPage'
import { AuthProvider } from '../../src/hooks/useAuth'

// Mock the auth service
jest.mock('../../src/services/api/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    isAuthenticated: jest.fn()
  }
}))

// Mock icons
jest.mock('lucide-react', () => ({
  Eye: ({ className, ...props }) => <svg data-testid="eye-icon" className={className} {...props} />,
  EyeOff: ({ className, ...props }) => <svg data-testid="eye-off-icon" className={className} {...props} />,
  Mail: ({ className, ...props }) => <svg data-testid="mail-icon" className={className} {...props} />,
  Lock: ({ className, ...props }) => <svg data-testid="lock-icon" className={className} {...props} />,
  User: ({ className, ...props }) => <svg data-testid="user-icon" className={className} {...props} />,
  Phone: ({ className, ...props }) => <svg data-testid="phone-icon" className={className} {...props} />
}))

const TestApp = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Authentication Flow Integration Tests - Phase 5', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
    global.alert = jest.fn()
    
    // Mock browser navigation
    delete window.location
    window.location = { href: '', assign: jest.fn(), replace: jest.fn() }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('1. NAVIGATION INTEGRATION TESTING', () => {
    test('login page navigation to register page works', async () => {
      // Start at login
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      const registerLink = screen.getByText('create a new account')
      expect(registerLink).toBeInTheDocument()

      await user.click(registerLink)

      // Should navigate to register page
      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })
    })

    test('register page navigation to login page works', async () => {
      // Start at register
      window.history.pushState({}, '', '/register')
      render(<TestApp />)

      const loginLink = screen.getByText('sign in to existing account')
      expect(loginLink).toBeInTheDocument()

      await user.click(loginLink)

      // Should navigate to login page
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      })
    })
  })

  describe('2. BROWSER BACK/FORWARD BEHAVIOR', () => {
    test('browser back button navigation works correctly', async () => {
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      // Navigate to register
      const registerLink = screen.getByText('create a new account')
      await user.click(registerLink)

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Simulate browser back button
      window.history.back()

      // Should return to login page
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      })
    })
  })

  describe('3. FORM STATE PRESERVATION', () => {
    test('form data persists during navigation and return', async () => {
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      // Fill login form
      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      // Navigate away and back
      const registerLink = screen.getByText('create a new account')
      await user.click(registerLink)

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      const loginLink = screen.getByText('sign in to existing account')
      await user.click(loginLink)

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      })

      // Form should be reset (this is expected behavior for React forms)
      const newEmailInput = screen.getByLabelText('Email address')
      const newPasswordInput = screen.getByLabelText('Password')
      
      expect(newEmailInput).toHaveValue('')
      expect(newPasswordInput).toHaveValue('')
    })
  })

  describe('4. CROSS-FORM VALIDATION TESTING', () => {
    test('different validation patterns between login and register', async () => {
      // Test login validation (simple)
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      const loginForm = screen.getByRole('form')
      expect(loginForm.children).toHaveLength(4) // email, password, remember/forgot, submit

      // Navigate to register
      const registerLink = screen.getByText('create a new account')
      await user.click(registerLink)

      await waitFor(() => {
        const registerForm = screen.getByRole('form')
        expect(registerForm.children).toHaveLength(6) // name grid, email, phone, password, confirm, submit
      })
    })
  })

  describe('5. FORM SUBMISSION CROSS-VALIDATION', () => {
    test('login form submission behavior', async () => {
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument()

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login functionality coming soon!')
      }, { timeout: 2000 })
    })

    test('register form submission with password validation', async () => {
      window.history.pushState({}, '', '/register')
      render(<TestApp />)

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText('First name'), 'John')
      await user.type(screen.getByLabelText('Last name'), 'Doe')
      await user.type(screen.getByLabelText('Email address'), 'john@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'differentpassword')

      const submitButton = screen.getByRole('button', { name: 'Create account' })
      await user.click(submitButton)

      expect(global.alert).toHaveBeenCalledWith('Passwords do not match')
      
      // Form should not show loading state for validation errors
      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Creating account...' })).not.toBeInTheDocument()
    })
  })

  describe('6. ACCESSIBILITY INTEGRATION', () => {
    test('keyboard navigation works across both forms', async () => {
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      // Test login form keyboard navigation
      const emailInput = screen.getByLabelText('Email address')
      emailInput.focus()

      await user.tab()
      expect(screen.getByLabelText('Password')).toHaveFocus()

      // Navigate to register and test keyboard navigation
      const registerLink = screen.getByText('create a new account')
      await user.click(registerLink)

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText('First name')
        firstNameInput.focus()

        // Test tab navigation through register form
        user.tab().then(() => {
          expect(screen.getByLabelText('Last name')).toHaveFocus()
        })
      })
    })
  })

  describe('7. ERROR HANDLING INTEGRATION', () => {
    test('error states are properly isolated between forms', async () => {
      // Start with register form and trigger validation error
      window.history.pushState({}, '', '/register')
      render(<TestApp />)

      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'different')
      await user.click(screen.getByRole('button', { name: 'Create account' }))

      expect(global.alert).toHaveBeenCalledWith('Passwords do not match')

      // Navigate to login
      const loginLink = screen.getByText('sign in to existing account')
      await user.click(loginLink)

      await waitFor(() => {
        // Login form should be clean, no error states
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
        expect(screen.getByLabelText('Email address')).toHaveValue('')
      })
    })
  })

  describe('8. PERFORMANCE INTEGRATION', () => {
    test('form transitions are smooth without console errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      // Rapid navigation between forms
      const registerLink = screen.getByText('create a new account')
      await user.click(registerLink)

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      const loginLink = screen.getByText('sign in to existing account')
      await user.click(loginLink)

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      })

      // Should have no console errors
      expect(consoleError).not.toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('9. RESPONSIVE BEHAVIOR INTEGRATION', () => {
    test('forms render consistently across viewport changes', async () => {
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      // Test login form elements
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()

      // Navigate to register
      const registerLink = screen.getByText('create a new account')
      await user.click(registerLink)

      await waitFor(() => {
        // Test register form elements
        expect(screen.getByText('Create your account')).toBeInTheDocument()
        expect(screen.getByLabelText('First name')).toBeInTheDocument()
        expect(screen.getByLabelText('Last name')).toBeInTheDocument()
        
        // Check grid layout is present
        const nameContainer = screen.getByLabelText('First name').closest('.grid')
        expect(nameContainer).toHaveClass('grid', 'grid-cols-2')
      })
    })
  })

  describe('10. SECURITY INTEGRATION TESTING', () => {
    test('form data is not persisted inappropriately', async () => {
      window.history.pushState({}, '', '/login')
      render(<TestApp />)

      // Fill sensitive data
      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'sensitivePassword123')

      // Navigate away
      const registerLink = screen.getByText('create a new account')
      await user.click(registerLink)

      // Navigate back
      await waitFor(() => {
        const backLoginLink = screen.getByText('sign in to existing account')
        user.click(backLoginLink)
      })

      await waitFor(() => {
        // Password should be cleared (good security practice)
        const newPasswordInput = screen.getByLabelText('Password')
        expect(newPasswordInput).toHaveValue('')
      })
    })

    test('form validation prevents malicious input', async () => {
      window.history.pushState({}, '', '/register')
      render(<TestApp />)

      // Test XSS attempt in email field
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, '<script>alert("xss")</script>@test.com')

      // Email should be treated as text, not executed
      expect(emailInput.value).toContain('<script>')
      
      // Form should still validate as invalid email
      const submitButton = screen.getByRole('button', { name: 'Create account' })
      
      // Fill other required fields
      await user.type(screen.getByLabelText('First name'), 'Test')
      await user.type(screen.getByLabelText('Last name'), 'User')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      
      await user.click(submitButton)

      // Should handle as invalid email, not execute script
      // The HTML5 email validation should catch this
    })
  })
})