import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import RegisterPage from '../../src/pages/auth/RegisterPage'

// Mock components and services
jest.mock('lucide-react', () => ({
  Eye: ({ className, ...props }) => <svg data-testid="eye-icon" className={className} {...props} />,
  EyeOff: ({ className, ...props }) => <svg data-testid="eye-off-icon" className={className} {...props} />,
  Mail: ({ className, ...props }) => <svg data-testid="mail-icon" className={className} {...props} />,
  Lock: ({ className, ...props }) => <svg data-testid="lock-icon" className={className} {...props} />,
  User: ({ className, ...props }) => <svg data-testid="user-icon" className={className} {...props} />,
  Phone: ({ className, ...props }) => <svg data-testid="phone-icon" className={className} {...props} />
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('RegisterPage - Phase 5 Authentication Flow Testing', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('1. REGISTER PAGE RENDERING AND LAYOUT', () => {
    test('renders register page with all required elements', () => {
      renderWithRouter(<RegisterPage />)

      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
      
      const loginLink = screen.getByText('sign in to existing account')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
    })

    test('renders form with proper grid layout for name fields', () => {
      renderWithRouter(<RegisterPage />)

      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()

      // Check all form fields are present
      expect(screen.getByLabelText('First name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
    })
  })

  describe('2. NAME FIELDS TESTING (First Name & Last Name)', () => {
    test('first name input has correct attributes and validation', () => {
      renderWithRouter(<RegisterPage />)

      const firstNameInput = screen.getByLabelText('First name')
      expect(firstNameInput).toHaveAttribute('type', 'text')
      expect(firstNameInput).toHaveAttribute('required')
      expect(firstNameInput).toHaveAttribute('placeholder', 'First name')
      expect(firstNameInput).toHaveClass('pl-10', 'input-field')
    })

    test('first name input displays user icon', () => {
      renderWithRouter(<RegisterPage />)
      // Should have user icon in header and first name field
      expect(screen.getAllByTestId('user-icon')).toHaveLength(2)
    })

    test('first name input accepts and updates value', async () => {
      renderWithRouter(<RegisterPage />)

      const firstNameInput = screen.getByLabelText('First name')
      await user.type(firstNameInput, 'John')
      
      expect(firstNameInput).toHaveValue('John')
    })

    test('last name input has correct attributes and validation', () => {
      renderWithRouter(<RegisterPage />)

      const lastNameInput = screen.getByLabelText('Last name')
      expect(lastNameInput).toHaveAttribute('type', 'text')
      expect(lastNameInput).toHaveAttribute('required')
      expect(lastNameInput).toHaveAttribute('placeholder', 'Last name')
      expect(lastNameInput).toHaveClass('input-field')
      expect(lastNameInput).not.toHaveClass('pl-10') // No icon for last name
    })

    test('last name input accepts and updates value', async () => {
      renderWithRouter(<RegisterPage />)

      const lastNameInput = screen.getByLabelText('Last name')
      await user.type(lastNameInput, 'Doe')
      
      expect(lastNameInput).toHaveValue('Doe')
    })
  })

  describe('3. EMAIL INPUT FIELD TESTING', () => {
    test('email input has correct attributes and validation', () => {
      renderWithRouter(<RegisterPage />)

      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email')
    })

    test('email input displays mail icon', () => {
      renderWithRouter(<RegisterPage />)
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
    })

    test('email input format validation', async () => {
      renderWithRouter(<RegisterPage />)

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'invalid-email')
      
      // HTML5 validation should handle invalid email format
      expect(emailInput).toHaveValue('invalid-email')
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('4. PHONE INPUT FIELD TESTING (Optional Field)', () => {
    test('phone input has correct attributes (optional field)', () => {
      renderWithRouter(<RegisterPage />)

      const phoneInput = screen.getByLabelText('Phone number')
      expect(phoneInput).toHaveAttribute('type', 'tel')
      expect(phoneInput).not.toHaveAttribute('required')
      expect(phoneInput).toHaveAttribute('placeholder', '(555) 123-4567')
    })

    test('phone input displays phone icon', () => {
      renderWithRouter(<RegisterPage />)
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument()
    })

    test('phone input accepts and updates value (optional)', async () => {
      renderWithRouter(<RegisterPage />)

      const phoneInput = screen.getByLabelText('Phone number')
      await user.type(phoneInput, '(555) 123-4567')
      
      expect(phoneInput).toHaveValue('(555) 123-4567')
    })

    test('form can be submitted without phone number', async () => {
      renderWithRouter(<RegisterPage />)

      // Fill required fields only
      await user.type(screen.getByLabelText('First name'), 'John')
      await user.type(screen.getByLabelText('Last name'), 'Doe')
      await user.type(screen.getByLabelText('Email address'), 'john@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      
      // Leave phone empty and submit
      const submitButton = screen.getByRole('button', { name: 'Create account' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Registration functionality coming soon!')
      }, { timeout: 2000 })
    })
  })

  describe('5. PASSWORD FIELDS TESTING', () => {
    test('password input has correct attributes', () => {
      renderWithRouter(<RegisterPage />)

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('placeholder', 'Create password')
    })

    test('confirm password input has correct attributes', () => {
      renderWithRouter(<RegisterPage />)

      const confirmPasswordInput = screen.getByLabelText('Confirm password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('required')
      expect(confirmPasswordInput).toHaveAttribute('placeholder', 'Confirm password')
    })

    test('both password fields display lock icons', () => {
      renderWithRouter(<RegisterPage />)
      // Should have 2 lock icons for password fields
      expect(screen.getAllByTestId('lock-icon')).toHaveLength(2)
    })
  })

  describe('6. PASSWORD VISIBILITY TOGGLES TESTING', () => {
    test('both password fields have visibility toggle buttons', () => {
      renderWithRouter(<RegisterPage />)

      const toggleButtons = screen.getAllByRole('button', { name: '' })
      // Should have 2 toggle buttons (one for each password field)
      expect(toggleButtons).toHaveLength(2)
      expect(screen.getAllByTestId('eye-icon')).toHaveLength(2)
    })

    test('password visibility toggle works independently', async () => {
      renderWithRouter(<RegisterPage />)

      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm password')
      const toggleButtons = screen.getAllByRole('button', { name: '' })

      // Initially both are password type
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      // Toggle first password field
      await user.click(toggleButtons[0])
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password') // Second should remain hidden

      // Toggle second password field
      await user.click(toggleButtons[1])
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(confirmPasswordInput).toHaveAttribute('type', 'text') // Now both visible

      // Toggle first back to hidden
      await user.click(toggleButtons[0])
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'text') // Second remains visible
    })
  })

  describe('7. PASSWORD MATCHING VALIDATION', () => {
    test('form shows alert when passwords do not match', async () => {
      renderWithRouter(<RegisterPage />)

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText('First name'), 'John')
      await user.type(screen.getByLabelText('Last name'), 'Doe')
      await user.type(screen.getByLabelText('Email address'), 'john@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'differentpassword')

      const submitButton = screen.getByRole('button', { name: 'Create account' })
      await user.click(submitButton)

      expect(global.alert).toHaveBeenCalledWith('Passwords do not match')
    })

    test('form submits when passwords match', async () => {
      renderWithRouter(<RegisterPage />)

      // Fill form with matching passwords
      await user.type(screen.getByLabelText('First name'), 'John')
      await user.type(screen.getByLabelText('Last name'), 'Doe')
      await user.type(screen.getByLabelText('Email address'), 'john@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')

      const submitButton = screen.getByRole('button', { name: 'Create account' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Registration functionality coming soon!')
      }, { timeout: 2000 })
    })
  })

  describe('8. FORM SUBMISSION AND LOADING STATES', () => {
    test('form shows loading state during submission', async () => {
      renderWithRouter(<RegisterPage />)

      // Fill form completely
      await user.type(screen.getByLabelText('First name'), 'John')
      await user.type(screen.getByLabelText('Last name'), 'Doe')
      await user.type(screen.getByLabelText('Email address'), 'john@example.com')
      await user.type(screen.getByLabelText('Phone number'), '(555) 123-4567')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')

      const submitButton = screen.getByRole('button', { name: 'Create account' })
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByRole('button', { name: 'Creating account...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled()
    })
  })

  describe('9. TAB NAVIGATION TESTING', () => {
    test('tab navigation works through all form fields', async () => {
      renderWithRouter(<RegisterPage />)

      const firstNameInput = screen.getByLabelText('First name')
      const lastNameInput = screen.getByLabelText('Last name')
      const emailInput = screen.getByLabelText('Email address')
      const phoneInput = screen.getByLabelText('Phone number')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm password')
      const submitButton = screen.getByRole('button', { name: 'Create account' })

      // Start with first name focused
      firstNameInput.focus()
      expect(firstNameInput).toHaveFocus()

      // Tab through fields
      await user.tab()
      expect(lastNameInput).toHaveFocus()

      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(phoneInput).toHaveFocus()

      await user.tab()
      expect(passwordInput).toHaveFocus()

      await user.tab()
      await user.tab() // Skip password toggle button
      expect(confirmPasswordInput).toHaveFocus()

      await user.tab()
      await user.tab() // Skip confirm password toggle button
      expect(submitButton).toHaveFocus()
    })
  })

  describe('10. FORM DATA STRUCTURE TESTING', () => {
    test('form collects all field data correctly', async () => {
      renderWithRouter(<RegisterPage />)

      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        password: 'securePassword123',
        confirmPassword: 'securePassword123'
      }

      // Fill all fields
      await user.type(screen.getByLabelText('First name'), formData.firstName)
      await user.type(screen.getByLabelText('Last name'), formData.lastName)
      await user.type(screen.getByLabelText('Email address'), formData.email)
      await user.type(screen.getByLabelText('Phone number'), formData.phone)
      await user.type(screen.getByLabelText('Password'), formData.password)
      await user.type(screen.getByLabelText('Confirm password'), formData.confirmPassword)

      // Verify all values
      expect(screen.getByLabelText('First name')).toHaveValue(formData.firstName)
      expect(screen.getByLabelText('Last name')).toHaveValue(formData.lastName)
      expect(screen.getByLabelText('Email address')).toHaveValue(formData.email)
      expect(screen.getByLabelText('Phone number')).toHaveValue(formData.phone)
      expect(screen.getByLabelText('Password')).toHaveValue(formData.password)
      expect(screen.getByLabelText('Confirm password')).toHaveValue(formData.confirmPassword)
    })
  })

  describe('11. CSS CLASSES AND STYLING TESTING', () => {
    test('form inputs have correct CSS classes', () => {
      renderWithRouter(<RegisterPage />)

      expect(screen.getByLabelText('First name')).toHaveClass('pl-10', 'input-field')
      expect(screen.getByLabelText('Last name')).toHaveClass('input-field')
      expect(screen.getByLabelText('Email address')).toHaveClass('pl-10', 'input-field')
      expect(screen.getByLabelText('Phone number')).toHaveClass('pl-10', 'input-field')
      expect(screen.getByLabelText('Password')).toHaveClass('pl-10', 'pr-10', 'input-field')
      expect(screen.getByLabelText('Confirm password')).toHaveClass('pl-10', 'pr-10', 'input-field')
    })

    test('submit button has correct CSS classes', () => {
      renderWithRouter(<RegisterPage />)

      const submitButton = screen.getByRole('button', { name: 'Create account' })
      expect(submitButton).toHaveClass('w-full', 'btn-primary')
    })

    test('form uses grid layout for name fields', () => {
      renderWithRouter(<RegisterPage />)

      // Find the container with grid classes
      const nameFieldsContainer = screen.getByLabelText('First name').closest('.grid')
      expect(nameFieldsContainer).toHaveClass('grid', 'grid-cols-2', 'gap-4')
    })
  })

  describe('12. ACCESSIBILITY TESTING', () => {
    test('all form fields have proper labels and ids', () => {
      renderWithRouter(<RegisterPage />)

      expect(screen.getByLabelText('First name')).toHaveAttribute('id', 'firstName')
      expect(screen.getByLabelText('Last name')).toHaveAttribute('id', 'lastName')
      expect(screen.getByLabelText('Email address')).toHaveAttribute('id', 'email')
      expect(screen.getByLabelText('Phone number')).toHaveAttribute('id', 'phone')
      expect(screen.getByLabelText('Password')).toHaveAttribute('id', 'password')
      expect(screen.getByLabelText('Confirm password')).toHaveAttribute('id', 'confirmPassword')
    })

    test('password toggle buttons are accessible', () => {
      renderWithRouter(<RegisterPage />)

      const toggleButtons = screen.getAllByRole('button', { name: '' })
      toggleButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })
  })
})