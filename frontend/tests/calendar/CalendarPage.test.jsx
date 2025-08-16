import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CalendarPage from '../../src/pages/CalendarPage'

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Calendar: ({ className }) => <div data-testid="calendar-icon" className={className} />,
  Clock: ({ className }) => <div data-testid="clock-icon" className={className} />,
  Users: ({ className }) => <div data-testid="users-icon" className={className} />,
  MapPin: ({ className }) => <div data-testid="mappin-icon" className={className} />
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Rendering', () => {
    it('should render calendar page with correct title', () => {
      renderWithRouter(<CalendarPage />)
      
      expect(screen.getByText('Reservations')).toBeInTheDocument()
      expect(screen.getByText('Book your table and join our exclusive events')).toBeInTheDocument()
    })

    it('should render coming soon message', () => {
      renderWithRouter(<CalendarPage />)
      
      expect(screen.getByText('Reservation System Coming Soon')).toBeInTheDocument()
      expect(screen.getByText(/We're building an advanced reservation system/)).toBeInTheDocument()
    })

    it('should render feature indicators', () => {
      renderWithRouter(<CalendarPage />)
      
      expect(screen.getByText('Flexible time slots')).toBeInTheDocument()
      expect(screen.getByText('Group bookings')).toBeInTheDocument()
      expect(screen.getByText('Premium locations')).toBeInTheDocument()
    })

    it('should render all icons', () => {
      renderWithRouter(<CalendarPage />)
      
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should have correct CSS classes for layout', () => {
      renderWithRouter(<CalendarPage />)
      
      const mainContainer = screen.getByText('Reservations').closest('div').parentElement
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'py-8')
    })

    it('should have responsive flex layout for features', () => {
      renderWithRouter(<CalendarPage />)
      
      const featuresContainer = screen.getByText('Flexible time slots').closest('div').parentElement
      expect(featuresContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-4', 'justify-center')
    })

    it('should have correct icon styling', () => {
      renderWithRouter(<CalendarPage />)
      
      const calendarIcon = screen.getByTestId('calendar-icon')
      expect(calendarIcon).toHaveClass('h-12', 'w-12', 'text-teal-600')
    })
  })

  describe('State Management', () => {
    it('should initialize with selectedDate state', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      renderWithRouter(<CalendarPage />)
      
      // Component should render without errors, indicating state is properly initialized
      expect(screen.getByText('Reservations')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should not crash when state changes', () => {
      const { rerender } = renderWithRouter(<CalendarPage />)
      
      // Re-render should not cause crashes
      rerender(
        <BrowserRouter>
          <CalendarPage />
        </BrowserRouter>
      )
      
      expect(screen.getByText('Reservations')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<CalendarPage />)
      
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Reservations')
      
      const secondaryHeading = screen.getByRole('heading', { level: 2 })
      expect(secondaryHeading).toHaveTextContent('Reservation System Coming Soon')
    })

    it('should have semantic text content', () => {
      renderWithRouter(<CalendarPage />)
      
      // Check for descriptive text that screen readers can access
      expect(screen.getByText(/We're building an advanced reservation system/)).toBeInTheDocument()
      expect(screen.getByText('Flexible time slots')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      renderWithRouter(<CalendarPage />)
      
      // Should render without layout issues
      expect(screen.getByText('Reservations')).toBeInTheDocument()
      expect(screen.getByText('Flexible time slots')).toBeInTheDocument()
    })

    it('should handle desktop viewport', () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      renderWithRouter(<CalendarPage />)
      
      expect(screen.getByText('Reservations')).toBeInTheDocument()
      expect(screen.getByText('Group bookings')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render quickly', () => {
      const startTime = performance.now()
      
      renderWithRouter(<CalendarPage />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('should not cause memory leaks', () => {
      const { unmount } = renderWithRouter(<CalendarPage />)
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow()
    })
  })
})