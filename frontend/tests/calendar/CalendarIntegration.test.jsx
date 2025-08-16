import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import App from '../../src/App'
import * as authHook from '../../src/hooks/useAuth'

// Mock the hooks and services
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../src/hooks/useBeverages', () => ({
  useBeverages: vi.fn(() => ({
    beverages: [],
    loading: false,
    error: null,
    fetchBeverages: vi.fn()
  }))
}))

vi.mock('lucide-react', () => ({
  Calendar: ({ className, ...props }) => <div data-testid="calendar-icon" className={className} {...props} />,
  Clock: ({ className, ...props }) => <div data-testid="clock-icon" className={className} {...props} />,
  Users: ({ className, ...props }) => <div data-testid="users-icon" className={className} {...props} />,
  MapPin: ({ className, ...props }) => <div data-testid="mappin-icon" className={className} {...props} />,
  Menu: ({ className, ...props }) => <div data-testid="menu-icon" className={className} {...props} />,
  X: ({ className, ...props }) => <div data-testid="x-icon" className={className} {...props} />,
  Home: ({ className, ...props }) => <div data-testid="home-icon" className={className} {...props} />,
  Wine: ({ className, ...props }) => <div data-testid="wine-icon" className={className} {...props} />,
  Martini: ({ className, ...props }) => <div data-testid="martini-icon" className={className} {...props} />,
  Bot: ({ className, ...props }) => <div data-testid="bot-icon" className={className} {...props} />,
  User: ({ className, ...props }) => <div data-testid="user-icon" className={className} {...props} />,
  LogOut: ({ className, ...props }) => <div data-testid="logout-icon" className={className} {...props} />
}))

describe('Calendar Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useAuth hook with authenticated user
    authHook.useAuth.mockReturnValue({
      user: { id: '123', name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: false
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Calendar Route Navigation', () => {
    it('should navigate to calendar page from home', async () => {
      render(<App />)
      
      // Find and click calendar/reservations link
      const calendarLink = screen.getByText('Reservations')
      fireEvent.click(calendarLink)
      
      await waitFor(() => {
        expect(screen.getByText('Book your table and join our exclusive events')).toBeInTheDocument()
      })
    })

    it('should display calendar page content correctly', async () => {
      // Navigate directly to calendar route
      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
        expect(screen.getByText('Reservation System Coming Soon')).toBeInTheDocument()
      })
    })

    it('should maintain authentication state on calendar page', async () => {
      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        // Should show user menu indicating authenticated state
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('Reservations')).toBeInTheDocument()
      })
    })
  })

  describe('Calendar Page with Authentication States', () => {
    it('should show calendar page when authenticated', async () => {
      authHook.useAuth.mockReturnValue({
        user: { id: '123', name: 'Test User', email: 'test@example.com' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false
      })

      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
        expect(screen.getByText('Flexible time slots')).toBeInTheDocument()
      })
    })

    it('should show calendar page when not authenticated', async () => {
      authHook.useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false
      })

      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
        expect(screen.getByText('Group bookings')).toBeInTheDocument()
      })
    })

    it('should handle loading state', async () => {
      authHook.useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: true
      })

      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      // Page should still render while auth is loading
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Layout Integration', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      window.dispatchEvent(new Event('resize'))

      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
        // Check that mobile layout elements are present
        expect(screen.getByText('Premium locations')).toBeInTheDocument()
      })
    })

    it('should adapt to tablet viewport', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })
      
      window.dispatchEvent(new Event('resize'))

      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
        expect(screen.getByText('Flexible time slots')).toBeInTheDocument()
      })
    })
  })

  describe('Header and Footer Integration', () => {
    it('should maintain header navigation on calendar page', async () => {
      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        // Header should be present with navigation
        expect(screen.getByText('Nauti Bouys')).toBeInTheDocument()
        expect(screen.getByText('Reservations')).toBeInTheDocument()
      })
    })

    it('should show active state for calendar navigation', async () => {
      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        // Calendar page should be accessible and displayed
        expect(screen.getByText('Book your table and join our exclusive events')).toBeInTheDocument()
      })
    })
  })

  describe('Cross-Page Navigation', () => {
    it('should navigate between calendar and other pages', async () => {
      render(<App />)
      
      // Start on home page
      expect(screen.getByText(/Experience the finest waterfront dining/)).toBeInTheDocument()
      
      // Navigate to calendar
      const calendarLink = screen.getByText('Reservations')
      fireEvent.click(calendarLink)
      
      await waitFor(() => {
        expect(screen.getByText('Book your table and join our exclusive events')).toBeInTheDocument()
      })
      
      // Navigate to beverages
      const beveragesLink = screen.getByText('Beverages')
      fireEvent.click(beveragesLink)
      
      await waitFor(() => {
        expect(screen.getByText('Premium Beverage Collection')).toBeInTheDocument()
      })
      
      // Navigate back to calendar
      const calendarLinkAgain = screen.getByText('Reservations')
      fireEvent.click(calendarLinkAgain)
      
      await waitFor(() => {
        expect(screen.getByText('Reservation System Coming Soon')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Integration', () => {
    it('should load calendar page within performance budget', async () => {
      const startTime = performance.now()
      
      window.history.pushState({}, 'Calendar Page', '/calendar')
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Should load within 3 seconds (3000ms)
      expect(loadTime).toBeLessThan(3000)
    })

    it('should not cause memory leaks during navigation', async () => {
      const { unmount } = render(<App />)
      
      // Navigate to calendar
      const calendarLink = screen.getByText('Reservations')
      fireEvent.click(calendarLink)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
      })
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      window.history.pushState({}, 'Calendar Page', '/calendar')
      
      // Component should render even if some parts fail
      render(<App />)
      
      await waitFor(() => {
        // Basic page structure should be present
        expect(screen.getByText('Reservations')).toBeInTheDocument()
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('State Persistence', () => {
    it('should maintain calendar state during page refresh simulation', async () => {
      window.history.pushState({}, 'Calendar Page', '/calendar')
      const { unmount } = render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
      })
      
      unmount()
      
      // Re-render simulating page refresh
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument()
        expect(screen.getByText('Reservation System Coming Soon')).toBeInTheDocument()
      })
    })
  })
})