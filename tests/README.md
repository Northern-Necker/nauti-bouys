# Test Automation Infrastructure

This directory contains comprehensive test automation infrastructure for the Nauti Bouys application.

## 🧪 Test Structure

### Unit Tests (`/unit`)
- **Components**: Individual component testing with mocked dependencies
- **Hooks**: Custom React hooks testing
- **Services**: API service layer testing
- **Utils**: Utility function testing

### Integration Tests (`/integration`)
- **Navigation**: Route navigation and user flow testing
- **Auth**: Authentication flow integration
- **API**: API client integration testing

### E2E Tests (`/e2e`)
- **User Flows**: Complete user journey testing
- **Mobile**: Mobile-specific interaction testing
- **Accessibility**: A11y compliance testing

### Test Data (`/fixtures`)
- **mockData**: Mock API responses and data
- **testData**: Test configuration and scenarios

## 🛠️ Test Utilities

### `testHelpers.js`
Comprehensive testing utilities including:
- `renderWithProviders()`: Render components with React Router and Auth context
- `navigationHelpers`: Navigation testing utilities
- `formHelpers`: Form interaction testing
- `mockHelpers`: API mocking utilities
- `a11yHelpers`: Accessibility testing helpers
- `responsiveHelpers`: Responsive design testing

## 🎯 Test Coverage Goals

- **Navigation**: 100% route coverage
- **Components**: >90% component coverage  
- **User Interactions**: >85% interaction coverage
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile**: All breakpoints tested

## 🚀 Running Tests

### Prerequisites
Install testing dependencies:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Test Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires Playwright)
npm run test:e2e
```

## 📋 Test Scenarios

### Navigation Testing
- ✅ All 9 routes render correctly
- ✅ Header navigation (desktop/mobile)
- ✅ Active navigation states
- ✅ Mobile menu functionality
- ✅ Browser navigation (back/forward)
- ✅ Direct URL access

### Component Testing
- Header responsive behavior
- Form validation and submission
- Loading states and error handling
- Search/filter functionality
- Calendar interactions
- IA Assistant interface

### Integration Testing
- Authentication flows
- API communication
- Route transitions
- State management
- Error boundaries

### E2E Testing
- Complete user journeys
- Cross-browser testing
- Performance testing
- Accessibility auditing

## 🔧 Configuration

### Vitest Config (needed)
Create `vitest.config.js`:
```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    globals: true
  }
})
```

### Test Setup (needed)  
Create `tests/setup.js`:
```javascript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

## 🎯 Test Examples

### Basic Component Test
```javascript
import { renderWithProviders } from '../utils/testHelpers'
import MyComponent from '../../src/components/MyComponent'

test('renders component correctly', () => {
  renderWithProviders(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### Navigation Test
```javascript
test('navigates to beverages page', async () => {
  const { user } = renderWithProviders(<App />)
  
  await user.click(screen.getByRole('link', { name: 'Beverages' }))
  expect(window.location.pathname).toBe('/beverages')
})
```

### Mobile Test
```javascript
test('opens mobile menu', async () => {
  responsiveHelpers.setViewport(375, 667)
  const { user } = renderWithProviders(<Header />)
  
  await navigationHelpers.testMobileMenu(user)
})
```

## 📊 Test Reports

Test results and coverage reports are generated in:
- `coverage/` - Coverage reports
- `test-results/` - Test execution results  
- `playwright-report/` - E2E test reports (if using Playwright)

## 🚨 Current Status

### ✅ Ready
- Test infrastructure setup
- Mock data creation
- Test utilities
- Basic unit test examples
- Integration test framework

### 🚧 TODO (Needs Frontend Test Dependencies)
- Install Vitest and Testing Library
- Configure test setup
- Run actual test implementations
- Set up E2E framework (Playwright recommended)
- CI/CD test integration

## 📝 Notes

This test infrastructure is ready for implementation once the frontend testing dependencies are installed. The structure follows best practices for React testing with comprehensive coverage of navigation, components, and user interactions.