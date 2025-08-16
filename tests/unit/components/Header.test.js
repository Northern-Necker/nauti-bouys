// Unit tests for Header navigation component
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, navigationHelpers, responsiveHelpers } from '../../utils/testHelpers';
import Header from '../../../frontend/src/components/layout/Header';
import { headerNavigation, authNavigation } from '../../fixtures/testData/navigation';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="close-icon" />,
  User: () => <div data-testid="user-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Wine: () => <div data-testid="wine-icon" />,
  Coffee: () => <div data-testid="coffee-icon" />,
  Flame: () => <div data-testid="flame-icon" />
}));

describe('Header Component', () => {
  beforeEach(() => {
    // Reset viewport to desktop size
    responsiveHelpers.setViewport(1280, 720);
  });

  describe('Desktop Navigation', () => {
    it('should render all navigation items', () => {
      renderWithProviders(<Header />);
      
      headerNavigation.forEach(item => {
        expect(screen.getByRole('link', { name: item.name })).toBeInTheDocument();
      });
    });

    it('should render auth navigation items', () => {
      renderWithProviders(<Header />);
      
      authNavigation.forEach(item => {
        expect(screen.getByRole('link', { name: item.name })).toBeInTheDocument();
      });
    });

    it('should highlight active navigation item', () => {
      renderWithProviders(<Header />, { initialEntries: ['/cocktails'] });
      
      navigationHelpers.verifyActiveNavigation('/cocktails', 'Cocktails');
    });

    it('should render brand logo and name', () => {
      renderWithProviders(<Header />);
      
      expect(screen.getByRole('link', { name: /nauti bouys/i })).toBeInTheDocument();
      expect(screen.getByText('Nauti Bouys')).toBeInTheDocument();
    });

    it('should not show mobile menu button on desktop', () => {
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.queryByRole('button', { name: /menu/i });
      expect(mobileMenuButton).not.toBeVisible();
    });

    it('should navigate to all routes', async () => {
      const { user } = renderWithProviders(<Header />);
      
      for (const item of headerNavigation) {
        await navigationHelpers.navigateAndVerify(user, item.name, item.href);
      }
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      responsiveHelpers.setViewport(375, 667);
    });

    it('should show mobile menu button', () => {
      renderWithProviders(<Header />);
      
      expect(screen.getByRole('button', { name: /menu/i })).toBeVisible();
    });

    it('should hide desktop navigation on mobile', () => {
      renderWithProviders(<Header />);
      
      // Desktop nav should be hidden
      const desktopNav = screen.getByTestId('desktop-navigation');
      expect(desktopNav).not.toBeVisible();
    });

    it('should toggle mobile menu', async () => {
      const { user } = renderWithProviders(<Header />);
      
      await navigationHelpers.testMobileMenu(user);
    });

    it('should render all navigation items in mobile menu', async () => {
      const { user } = renderWithProviders(<Header />);
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);
      
      // Check all nav items are present
      headerNavigation.forEach(item => {
        expect(screen.getByRole('link', { name: item.name })).toBeInTheDocument();
      });
    });

    it('should close mobile menu after navigation', async () => {
      const { user } = renderWithProviders(<Header />);
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);
      
      // Click a navigation link
      const beveragesLink = screen.getByRole('link', { name: 'Beverages' });
      await user.click(beveragesLink);
      
      // Menu should be closed
      expect(screen.queryByRole('navigation', { expanded: true })).not.toBeInTheDocument();
    });

    it('should show correct icon states for menu toggle', async () => {
      const { user } = renderWithProviders(<Header />);
      
      // Initially should show menu icon
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('close-icon')).not.toBeInTheDocument();
      
      // After clicking should show close icon
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);
      
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-icon')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should switch between desktop and mobile layouts', () => {
      const { rerender } = renderWithProviders(<Header />);
      
      // Test desktop layout
      responsiveHelpers.testDesktopLayout();
      
      // Switch to mobile
      responsiveHelpers.setViewport(375, 667);
      rerender(<Header />);
      
      // Test mobile layout
      expect(screen.getByRole('button', { name: /menu/i })).toBeVisible();
    });

    it('should work at tablet breakpoint', () => {
      responsiveHelpers.setViewport(768, 1024);
      renderWithProviders(<Header />);
      
      // Should use desktop navigation at tablet size
      headerNavigation.forEach(item => {
        expect(screen.getByRole('link', { name: item.name })).toBeVisible();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const { user } = renderWithProviders(<Header />);
      
      // Tab through navigation items
      const navLinks = screen.getAllByRole('link');
      
      for (let i = 0; i < navLinks.length; i++) {
        await user.tab();
        expect(document.activeElement).toBe(navLinks[i]);
      }
    });

    it('should have accessible mobile menu button', async () => {
      responsiveHelpers.setViewport(375, 667);
      const { user } = renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /menu/i });
      
      // Should be focusable
      await user.tab();
      expect(document.activeElement).toBe(menuButton);
      
      // Should activate with Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByRole('navigation', { expanded: true })).toBeVisible();
    });

    it('should provide proper link descriptions', () => {
      renderWithProviders(<Header />);
      
      headerNavigation.forEach(item => {
        const link = screen.getByRole('link', { name: item.name });
        expect(link).toHaveAttribute('href', item.href);
      });
    });
  });

  describe('Visual States', () => {
    it('should apply correct styling for active links', () => {
      renderWithProviders(<Header />, { initialEntries: ['/wines'] });
      
      const activeLink = screen.getByRole('link', { name: 'Wines' });
      expect(activeLink).toHaveClass('text-teal-700', 'bg-teal-50');
    });

    it('should apply hover states correctly', async () => {
      const { user } = renderWithProviders(<Header />);
      
      const beveragesLink = screen.getByRole('link', { name: 'Beverages' });
      
      await user.hover(beveragesLink);
      expect(beveragesLink).toHaveClass('hover:text-teal-700', 'hover:bg-teal-50');
    });

    it('should style brand elements correctly', () => {
      renderWithProviders(<Header />);
      
      const brandLink = screen.getByRole('link', { name: /nauti bouys/i });
      const brandText = screen.getByText('Nauti Bouys');
      
      expect(brandText).toHaveClass('text-xl', 'font-bold', 'text-teal-900');
    });
  });
});