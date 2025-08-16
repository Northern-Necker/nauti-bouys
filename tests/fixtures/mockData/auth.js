// Mock authentication data for testing
export const mockUsers = {
  validUser: {
    id: '1',
    email: 'test@nautibouys.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '555-123-4567'
  },
  adminUser: {
    id: '2',
    email: 'admin@nautibouys.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '555-987-6543',
    role: 'admin'
  }
};

export const mockCredentials = {
  valid: {
    email: 'test@nautibouys.com',
    password: 'Test123!@#'
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  },
  missingEmail: {
    password: 'Test123!@#'
  },
  missingPassword: {
    email: 'test@nautibouys.com'
  }
};

export const mockRegistrationData = {
  valid: {
    firstName: 'New',
    lastName: 'User',
    email: 'newuser@test.com',
    phone: '555-111-2222',
    password: 'NewUser123!',
    confirmPassword: 'NewUser123!'
  },
  invalidEmail: {
    firstName: 'New',
    lastName: 'User',
    email: 'invalid-email',
    phone: '555-111-2222',
    password: 'NewUser123!',
    confirmPassword: 'NewUser123!'
  },
  passwordMismatch: {
    firstName: 'New',
    lastName: 'User',
    email: 'newuser@test.com',
    phone: '555-111-2222',
    password: 'NewUser123!',
    confirmPassword: 'DifferentPassword123!'
  }
};

export const mockTokens = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJ0ZXN0QG5hdXRpYm91eXMuY29tIiwiaWF0IjoxNjM5NTc4MDAwLCJleHAiOjE2Mzk2NjQ0MDB9.test',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJ0ZXN0QG5hdXRpYm91eXMuY29tIiwiaWF0IjoxNjM5NDkxNjAwLCJleHAiOjE2Mzk1NzgwMDB9.expired',
  invalid: 'invalid.token.here'
};

export const mockApiResponses = {
  loginSuccess: {
    success: true,
    data: {
      user: mockUsers.validUser,
      token: mockTokens.valid
    },
    message: 'Login successful'
  },
  loginError: {
    success: false,
    error: 'Invalid credentials',
    message: 'Email or password is incorrect'
  },
  registerSuccess: {
    success: true,
    data: {
      user: mockUsers.validUser,
      token: mockTokens.valid
    },
    message: 'Registration successful'
  },
  registerError: {
    success: false,
    error: 'Email already exists',
    message: 'An account with this email already exists'
  }
};