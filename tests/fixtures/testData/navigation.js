// Test data for navigation testing
export const routes = [
  {
    path: '/',
    name: 'Home',
    component: 'HomePage',
    requiresAuth: false,
    testId: 'home-page'
  },
  {
    path: '/beverages',
    name: 'Beverages', 
    component: 'BeveragesPage',
    requiresAuth: false,
    testId: 'beverages-page'
  },
  {
    path: '/cocktails',
    name: 'Cocktails',
    component: 'CocktailsPage',
    requiresAuth: false,
    testId: 'cocktails-page'
  },
  {
    path: '/wines',
    name: 'Wines',
    component: 'WinesPage',
    requiresAuth: false,
    testId: 'wines-page'
  },
  {
    path: '/spirits',
    name: 'Spirits',
    component: 'SpiritsPage',
    requiresAuth: false,
    testId: 'spirits-page'
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: 'CalendarPage',
    requiresAuth: false,
    testId: 'calendar-page'
  },
  {
    path: '/login',
    name: 'Login',
    component: 'LoginPage',
    requiresAuth: false,
    testId: 'login-page'
  },
  {
    path: '/register',
    name: 'Sign Up',
    component: 'RegisterPage',
    requiresAuth: false,
    testId: 'register-page'
  },
  {
    path: '/ia',
    name: 'IA Assistant',
    component: 'IAPage',
    requiresAuth: false,
    testId: 'ia-page'
  }
];

export const headerNavigation = [
  { name: 'Home', href: '/', icon: null, testId: 'nav-home' },
  { name: 'Beverages', href: '/beverages', icon: 'Wine', testId: 'nav-beverages' },
  { name: 'Cocktails', href: '/cocktails', icon: 'Coffee', testId: 'nav-cocktails' },
  { name: 'Wines', href: '/wines', icon: 'Wine', testId: 'nav-wines' },
  { name: 'Spirits', href: '/spirits', icon: 'Flame', testId: 'nav-spirits' },
  { name: 'Calendar', href: '/calendar', icon: 'Calendar', testId: 'nav-calendar' },
  { name: 'IA Assistant', href: '/ia', icon: 'User', testId: 'nav-ia' }
];

export const authNavigation = [
  { name: 'Login', href: '/login', testId: 'nav-login' },
  { name: 'Sign Up', href: '/register', testId: 'nav-register' }
];

export const mobileBreakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  large: 1280
};

export const navigationTestScenarios = [
  {
    name: 'Desktop navigation',
    viewport: { width: 1280, height: 720 },
    tests: [
      'should render all navigation items',
      'should highlight active page',
      'should navigate to each route',
      'should show login/register buttons'
    ]
  },
  {
    name: 'Mobile navigation',
    viewport: { width: 375, height: 667 },
    tests: [
      'should show mobile menu button',
      'should toggle mobile menu',
      'should close menu after navigation',
      'should render all mobile nav items'
    ]
  },
  {
    name: 'Tablet navigation',
    viewport: { width: 768, height: 1024 },
    tests: [
      'should use desktop navigation layout',
      'should maintain functionality on tablet'
    ]
  }
];