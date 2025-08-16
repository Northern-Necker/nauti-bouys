// Test utility helpers for navigation and component testing
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../frontend/src/hooks/useAuth';

/**
 * Custom render function that wraps components with necessary providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const { 
    initialEntries = ['/'],
    authState = null,
    ...renderOptions 
  } = options;

  function Wrapper({ children }) {
    return (
      <BrowserRouter initialEntries={initialEntries}>
        <AuthProvider initialState={authState}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

/**
 * Navigation test helpers
 */
export const navigationHelpers = {
  /**
   * Navigate to a route and verify it loaded
   */
  async navigateAndVerify(user, linkText, expectedPath, expectedContent) {
    const link = screen.getByRole('link', { name: linkText });
    await user.click(link);
    
    expect(window.location.pathname).toBe(expectedPath);
    if (expectedContent) {
      expect(screen.getByText(expectedContent)).toBeInTheDocument();
    }
  },

  /**
   * Test mobile menu toggle
   */
  async testMobileMenu(user) {
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Menu should be closed initially
    expect(screen.queryByRole('navigation', { hidden: true })).not.toBeVisible();
    
    // Open menu
    await user.click(menuButton);
    expect(screen.getByRole('navigation', { expanded: true })).toBeVisible();
    
    // Close menu
    await user.click(menuButton);
    expect(screen.queryByRole('navigation', { hidden: true })).not.toBeVisible();
  },

  /**
   * Verify active navigation state
   */
  verifyActiveNavigation(currentPath, linkText) {
    const activeLink = screen.getByRole('link', { name: linkText });
    expect(activeLink).toHaveClass('text-teal-700', 'bg-teal-50');
  },

  /**
   * Test all navigation links
   */
  async testAllNavigationLinks(user, routes) {
    for (const route of routes) {
      await this.navigateAndVerify(user, route.name, route.path, route.expectedContent);
    }
  }
};

/**
 * Form testing helpers
 */
export const formHelpers = {
  /**
   * Fill out a form with test data
   */
  async fillForm(user, formData) {
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      await user.clear(field);
      await user.type(field, value);
    }
  },

  /**
   * Submit form and wait for response
   */
  async submitForm(user, submitText = /submit|sign in|register/i) {
    const submitButton = screen.getByRole('button', { name: submitText });
    await user.click(submitButton);
  },

  /**
   * Verify form validation errors
   */
  verifyValidationErrors(expectedErrors) {
    expectedErrors.forEach(error => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  }
};

/**
 * API mocking helpers
 */
export const mockHelpers = {
  /**
   * Mock successful API response
   */
  mockApiSuccess(data) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data)
    });
  },

  /**
   * Mock API error response
   */
  mockApiError(status, message) {
    return Promise.reject({
      ok: false,
      status,
      json: () => Promise.resolve({ error: message })
    });
  },

  /**
   * Setup auth mocks
   */
  setupAuthMocks(authState) {
    const mockAuth = {
      isAuthenticated: authState?.isAuthenticated || false,
      user: authState?.user || null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn()
    };
    
    return mockAuth;
  }
};

/**
 * Accessibility testing helpers
 */
export const a11yHelpers = {
  /**
   * Check for basic accessibility requirements
   */
  async checkBasicA11y() {
    // Check for proper heading structure
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for proper link text
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAccessibleName();
    });
    
    // Check for form labels
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveAccessibleName();
    });
  },

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(user) {
    const focusableElements = screen.getAllByRole('link')
      .concat(screen.getAllByRole('button'));
    
    // Tab through all focusable elements
    for (const element of focusableElements) {
      await user.tab();
      expect(document.activeElement).toBe(element);
    }
  }
};

/**
 * Responsive design testing helpers
 */
export const responsiveHelpers = {
  /**
   * Set viewport size for testing
   */
  setViewport(width, height) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  },

  /**
   * Test mobile responsiveness
   */
  async testMobileLayout(user) {
    this.setViewport(375, 667); // iPhone size
    
    // Check mobile-specific elements are visible
    expect(screen.getByRole('button', { name: /menu/i })).toBeVisible();
    
    // Check desktop navigation is hidden
    const desktopNav = screen.queryByTestId('desktop-navigation');
    if (desktopNav) {
      expect(desktopNav).not.toBeVisible();
    }
  },

  /**
   * Test desktop layout
   */
  testDesktopLayout() {
    this.setViewport(1280, 720);
    
    // Check desktop navigation is visible
    const desktopNav = screen.queryByTestId('desktop-navigation');
    if (desktopNav) {
      expect(desktopNav).toBeVisible();
    }
    
    // Check mobile menu button is hidden
    const mobileMenuButton = screen.queryByRole('button', { name: /menu/i });
    if (mobileMenuButton) {
      expect(mobileMenuButton).not.toBeVisible();
    }
  }
};

/**
 * Wait for element helpers
 */
export const waitHelpers = {
  /**
   * Wait for loading to complete
   */
  async waitForLoadingToFinish() {
    const loadingSpinner = screen.queryByRole('status', { name: /loading/i });
    if (loadingSpinner) {
      await waitForElementToBeRemoved(loadingSpinner);
    }
  },

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(apiMock) {
    await waitFor(() => {
      expect(apiMock).toHaveBeenCalled();
    });
  }
};