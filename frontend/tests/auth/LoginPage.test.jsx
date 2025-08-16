import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LoginPage from '../../src/pages/auth/LoginPage'

// Mock components and services
jest.mock('lucide-react', () => ({
  Eye: ({ className, ...props }) => <svg data-testid="eye-icon" className={className} {...props} />,
  EyeOff: ({ className, ...props }) => <svg data-testid="eye-off-icon" className={className} {...props} />,
  Mail: ({ className, ...props }) => <svg data-testid="mail-icon" className={className} {...props} />,
  Lock: ({ className, ...props }) => <svg data-testid="lock-icon" className={className} {...props} />
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('LoginPage - Phase 5 Authentication Flow Testing', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    // Reset any mocks
    jest.clearAllMocks()
    // Mock alert to prevent actual alerts during testing
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('1. LOGIN PAGE RENDERING AND LAYOUT', () => {
    test('renders login page with all required elements', () => {
      renderWithRouter(<LoginPage />)

      // Check main heading and branding
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
      
      // Check navigation link to register
      const registerLink = screen.getByText('create a new account')
      expect(registerLink).toBeInTheDocument()
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
    })

    test('renders form with proper structure', () => {
      renderWithRouter(<LoginPage />)

      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()

      // Check form fields are present
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Remember me')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    test('displays forgot password link', () => {
      renderWithRouter(<LoginPage />)

      const forgotLink = screen.getByText('Forgot your password?')
      expect(forgotLink).toBeInTheDocument()
      expect(forgotLink).toHaveAttribute('href', '#')
    })
  })

  describe('2. EMAIL INPUT FIELD TESTING', () => {
    test('email input has correct attributes and validation', () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email')
    })

    test('email input displays mail icon', () => {
      renderWithRouter(<LoginPage />)
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
    })

    test('email input accepts and updates value', async () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    test('email input shows validation state (required field behavior)', async () => {
      renderWithRouter(<LoginPage />)

      const form = screen.getByRole('form')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })
      
      // Try to submit without email
      await user.click(submitButton)
      
      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toBeRequired()
    })
  })

  describe('3. PASSWORD INPUT FIELD TESTING', () => {
    test('password input has correct attributes', () => {
      renderWithRouter(<LoginPage />)

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password')
    })

    test('password input displays lock icon', () => {
      renderWithRouter(<LoginPage />)
      expect(screen.getAllByTestId('lock-icon')).toHaveLength(2) // One in header, one in password field
    })

    test('password input accepts and updates value', async () => {
      renderWithRouter(<LoginPage />)

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'mypassword123')
      
      expect(passwordInput).toHaveValue('mypassword123')
    })
  })

  describe('4. PASSWORD VISIBILITY TOGGLE TESTING', () => {
    test('password visibility toggle button exists', () => {
      renderWithRouter(<LoginPage />)

      const toggleButton = screen.getByRole('button', { name: '' })
      expect(toggleButton).toBeInTheDocument()
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
    })

    test('password visibility toggle changes input type', async () => {
      renderWithRouter(<LoginPage />)

      const passwordInput = screen.getByLabelText('Password')
      const toggleButton = screen.getByRole('button', { name: '' })

      // Initially password type
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()

      // Click to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument()

      // Click again to hide password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
    })
  })

  describe('5. REMEMBER ME CHECKBOX TESTING', () => {
    test('remember me checkbox renders and functions', async () => {
      renderWithRouter(<LoginPage />)

      const checkbox = screen.getByLabelText('Remember me')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveAttribute('type', 'checkbox')
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('6. FORM VALIDATION AND ERROR STATES', () => {
    test('form shows loading state during submission', async () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      await user.click(submitButton)

      // Check loading state
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    })

    test('form shows success alert after submission', async () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      await user.click(submitButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login functionality coming soon!')
      }, { timeout: 2000 })
    })
  })

  describe('7. FORM INTERACTION AND NAVIGATION', () => {
    test('tab navigation works through form fields', async () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const rememberMe = screen.getByLabelText('Remember me')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // Start with email focused
      emailInput.focus()
      expect(emailInput).toHaveFocus()

      // Tab to password
      await user.tab()
      expect(passwordInput).toHaveFocus()

      // Tab to remember me
      await user.tab()
      await user.tab() // Skip password toggle button
      expect(rememberMe).toHaveFocus()

      // Tab to submit button  
      await user.tab()
      await user.tab() // Skip forgot password link
      expect(submitButton).toHaveFocus()
    })

    test('form submission with Enter key works', async () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login functionality coming soon!')
      }, { timeout: 2000 })
    })
  })

  describe('8. CSS CLASSES AND STYLING', () => {
    test('form inputs have correct CSS classes', () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveClass('pl-10', 'input-field')
      expect(passwordInput).toHaveClass('pl-10', 'pr-10', 'input-field')
    })

    test('submit button has correct CSS classes', () => {
      renderWithRouter(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: 'Sign in' })
      expect(submitButton).toHaveClass('w-full', 'btn-primary')
    })
  })

  describe('9. ACCESSIBILITY TESTING', () => {
    test('form has proper labels and ids', () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const rememberMe = screen.getByLabelText('Remember me')

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(rememberMe).toHaveAttribute('id', 'remember-me')
    })

    test('password toggle button is accessible', () => {
      renderWithRouter(<LoginPage />)

      const toggleButton = screen.getByRole('button', { name: '' })
      expect(toggleButton).toHaveAttribute('type', 'button')
    })
  })

  describe('10. SECURITY CONSIDERATIONS', () => {
    test('password field is hidden by default', () => {
      renderWithRouter(<LoginPage />)

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('form data structure matches expected format', async () => {
      renderWithRouter(<LoginPage />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'securepassword')

      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('securepassword')
    })
  })
})