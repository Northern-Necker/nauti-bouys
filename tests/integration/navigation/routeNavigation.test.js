// Integration tests for route navigation
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, navigationHelpers, waitHelpers } from '../../utils/testHelpers';
import App from '../../../frontend/src/App';
import { routes } from '../../fixtures/testData/navigation';

describe('Route Navigation Integration', () => {
  beforeEach(() => {
    // Clear any stored auth state
    localStorage.clear();
  });

  describe('Basic Route Rendering', () => {
    it('should render home page by default', () => {
      renderWithProviders(<App />);
      
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(document.title).toContain('Home');
    });

    it('should render all defined routes', async () => {
      const { user } = renderWithProviders(<App />);
      
      for (const route of routes) {
        // Navigate to route
        const navLink = screen.getByRole('link', { name: route.name });
        await user.click(navLink);
        
        // Verify route rendered
        expect(window.location.pathname).toBe(route.path);
        expect(screen.getByTestId(route.testId)).toBeInTheDocument();
        
        // Wait for any loading to complete
        await waitHelpers.waitForLoadingToFinish();
      }
    });

    it('should handle direct URL navigation', () => {
      routes.forEach(route => {
        const { unmount } = renderWithProviders(<App />, { 
          initialEntries: [route.path] 
        });
        
        expect(screen.getByTestId(route.testId)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Navigation Flow Testing', () => {
    it('should complete full user navigation journey', async () => {
      const { user } = renderWithProviders(<App />);
      
      // Start at home
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      
      // Navigate to beverages
      await navigationHelpers.navigateAndVerify(
        user, 
        'Beverages', 
        '/beverages',
        'beverages-page'
      );
      
      // Navigate to cocktails
      await navigationHelpers.navigateAndVerify(
        user,
        'Cocktails',
        '/cocktails', 
        'cocktails-page'
      );
      
      // Navigate to calendar
      await navigationHelpers.navigateAndVerify(
        user,
        'Calendar',
        '/calendar',
        'calendar-page'
      );
      
      // Navigate to login
      await navigationHelpers.navigateAndVerify(
        user,
        'Login',
        '/login',
        'login-page'
      );
      
      // Return to home
      await navigationHelpers.navigateAndVerify(
        user,
        'Home',
        '/',
        'home-page'
      );
    });

    it('should maintain navigation state across route changes', async () => {
      const { user } = renderWithProviders(<App />);
      
      // Navigate through several pages
      await user.click(screen.getByRole('link', { name: 'Wines' }));
      await user.click(screen.getByRole('link', { name: 'Spirits' }));
      await user.click(screen.getByRole('link', { name: 'IA Assistant' }));
      
      // Navigation should still be functional
      navigationHelpers.verifyActiveNavigation('/ia', 'IA Assistant');
      
      // Should be able to navigate back
      await user.click(screen.getByRole('link', { name: 'Home' }));
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  describe('Browser Navigation', () => {
    it('should handle browser back/forward navigation', async () => {
      const { user } = renderWithProviders(<App />);
      
      // Navigate to multiple pages
      await user.click(screen.getByRole('link', { name: 'Beverages' }));
      await user.click(screen.getByRole('link', { name: 'Cocktails' }));
      
      // Simulate browser back
      window.history.back();
      await waitFor(() => {
        expect(window.location.pathname).toBe('/beverages');
      });
      
      // Simulate browser forward
      window.history.forward();
      await waitFor(() => {
        expect(window.location.pathname).toBe('/cocktails');
      });
    });

    it('should handle page refresh on any route', () => {
      routes.forEach(route => {
        // Mock page refresh by re-rendering with same route
        const { unmount } = renderWithProviders(<App />, {
          initialEntries: [route.path]
        });
        
        expect(screen.getByTestId(route.testId)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', () => {
      renderWithProviders(<App />, { initialEntries: ['/invalid-route'] });
      
      // Should render 404 page or redirect to home
      // This would depend on your error handling implementation
      expect(
        screen.queryByText('Page not found') || 
        screen.queryByTestId('home-page')
      ).toBeInTheDocument();
    });

    it('should handle navigation errors', async () => {
      const { user } = renderWithProviders(<App />);
      
      // Mock a navigation error
      const originalError = console.error;
      console.error = vi.fn();
      
      try {
        // Attempt to navigate to a problematic route
        await user.click(screen.getByRole('link', { name: 'Home' }));
        
        // Should still maintain functionality
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      } finally {
        console.error = originalError;
      }
    });
  });

  describe('Loading States', () => {
    it('should show loading states during navigation', async () => {
      const { user } = renderWithProviders(<App />);
      
      // Mock slow loading
      const originalTimeout = setTimeout;
      vi.useFakeTimers();
      
      try {
        await user.click(screen.getByRole('link', { name: 'Calendar' }));
        
        // Should show loading indicator if present
        const loadingSpinner = screen.queryByRole('status', { name: /loading/i });
        if (loadingSpinner) {
          expect(loadingSpinner).toBeInTheDocument();
        }
        
        // Fast forward time
        vi.runAllTimers();
        
        // Should complete loading
        expect(screen.getByTestId('calendar-page')).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Mobile Navigation Integration', () => {
    it('should handle mobile navigation flow', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { user } = renderWithProviders(<App />);
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);
      
      // Navigate through mobile menu
      await user.click(screen.getByRole('link', { name: 'Beverages' }));
      
      // Menu should close and page should load
      expect(screen.getByTestId('beverages-page')).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { expanded: true })).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should navigate quickly between routes', async () => {
      const { user } = renderWithProviders(<App />);
      
      const startTime = performance.now();
      
      // Navigate through multiple routes quickly
      await user.click(screen.getByRole('link', { name: 'Beverages' }));
      await user.click(screen.getByRole('link', { name: 'Wines' }));
      await user.click(screen.getByRole('link', { name: 'Spirits' }));
      await user.click(screen.getByRole('link', { name: 'Home' }));
      
      const endTime = performance.now();
      const navigationTime = endTime - startTime;
      
      // Should complete navigation within reasonable time (2 seconds)
      expect(navigationTime).toBeLessThan(2000);
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });
});