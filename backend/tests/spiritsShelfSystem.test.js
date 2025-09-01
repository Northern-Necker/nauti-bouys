const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Spirit = require('../models/Spirit');
const spiritsAuthService = require('../services/spiritsAuthService');

// Mock data for testing
const mockSpirit = {
  name: 'Test Ultra Spirit',
  brand: 'Premium Distillery',
  type: 'Whiskey',
  subType: 'Bourbon',
  abv: 40,
  description: 'A premium bourbon for testing',
  origin: 'Kentucky, USA',
  bottleSize: '750ml',
  distillery: 'Test Distillery',
  shelf_tier: 'ultra',
  mixing_appropriate: false
};

const mockPatron = {
  sessionId: 'test-session-123',
  patronName: 'John Test'
};

describe('Spirits Shelf System API', () => {
  let spiritId;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/nauti-bouys-test');
  });

  afterAll(async () => {
    // Clean up test data
    await Spirit.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test spirit
    const spirit = new Spirit(mockSpirit);
    await spirit.save();
    spiritId = spirit._id.toString();
  });

  afterEach(async () => {
    // Clean up after each test
    await Spirit.deleteMany({});
  });

  describe('GET /api/spirits/by-shelf/:tier', () => {
    test('should return spirits by shelf tier', async () => {
      const response = await request(app)
        .get('/api/spirits/by-shelf/ultra')
        .expect(200);

      expect(response.body.shelf_tier).toBe('ultra');
      expect(response.body.count).toBe(1);
      expect(response.body.spirits).toHaveLength(1);
      expect(response.body.spirits[0].shelf_tier).toBe('ultra');
    });

    test('should filter by mixing appropriateness', async () => {
      const response = await request(app)
        .get('/api/spirits/by-shelf/ultra?mixing_appropriate=false')
        .expect(200);

      expect(response.body.spirits).toHaveLength(1);
      expect(response.body.spirits[0].mixing_appropriate).toBe(false);
    });

    test('should return 400 for invalid shelf tier', async () => {
      const response = await request(app)
        .get('/api/spirits/by-shelf/invalid')
        .expect(400);

      expect(response.body.message).toBe('Invalid shelf tier');
    });
  });

  describe('POST /api/spirits/request-ultra', () => {
    test('should create ultra shelf authorization request', async () => {
      const response = await request(app)
        .post('/api/spirits/request-ultra')
        .send({
          spiritId,
          patronName: mockPatron.patronName,
          sessionId: mockPatron.sessionId
        })
        .expect(201);

      expect(response.body.message).toContain('Authorization request submitted');
      expect(response.body.requestId).toBeDefined();
      expect(response.body.spirit.name).toBe(mockSpirit.name);
    });

    test('should reject request for non-ultra spirit', async () => {
      // Create a lower shelf spirit
      const lowerSpirit = new Spirit({
        ...mockSpirit,
        name: 'Lower Shelf Spirit',
        shelf_tier: 'lower'
      });
      await lowerSpirit.save();

      const response = await request(app)
        .post('/api/spirits/request-ultra')
        .send({
          spiritId: lowerSpirit._id.toString(),
          patronName: mockPatron.patronName,
          sessionId: mockPatron.sessionId
        })
        .expect(400);

      expect(response.body.message).toBe('Authorization only required for ultra shelf spirits');
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/spirits/request-ultra')
        .send({
          spiritId
          // Missing patronName and sessionId
        })
        .expect(400);

      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/spirits/authorizations', () => {
    test('should return empty authorizations for new session', async () => {
      const response = await request(app)
        .get(`/api/spirits/authorizations?sessionId=${mockPatron.sessionId}`)
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.authorizations).toHaveLength(0);
    });

    test('should return 400 for missing session ID', async () => {
      const response = await request(app)
        .get('/api/spirits/authorizations')
        .expect(400);

      expect(response.body.message).toBe('Session ID is required');
    });
  });

  describe('GET /api/spirits/check-authorization/:sessionId/:spiritId', () => {
    test('should return false for unauthorized spirit', async () => {
      const response = await request(app)
        .get(`/api/spirits/check-authorization/${mockPatron.sessionId}/${spiritId}`)
        .expect(200);

      expect(response.body.authorized).toBe(false);
      expect(response.body.sessionId).toBe(mockPatron.sessionId);
      expect(response.body.spiritId).toBe(spiritId);
    });
  });

  describe('Spirit Model Validation', () => {
    test('should create spirit with shelf tier and mixing appropriateness', async () => {
      const spirit = new Spirit(mockSpirit);
      await spirit.save();

      expect(spirit.shelf_tier).toBe('ultra');
      expect(spirit.mixing_appropriate).toBe(false);
      expect(spirit.price).toBeUndefined();
      expect(spirit.pricePerOz).toBeUndefined();
    });

    test('should default to lower shelf and mixing appropriate', async () => {
      const spirit = new Spirit({
        name: 'Default Spirit',
        brand: 'Test Brand',
        type: 'Vodka',
        abv: 40,
        description: 'Test description',
        origin: 'Test Origin',
        bottleSize: '750ml',
        distillery: 'Test Distillery'
      });
      
      await spirit.save();

      expect(spirit.shelf_tier).toBe('lower');
      expect(spirit.mixing_appropriate).toBe(true);
    });

    test('should validate shelf tier enum values', async () => {
      const spirit = new Spirit({
        ...mockSpirit,
        shelf_tier: 'invalid_tier'
      });

      await expect(spirit.save()).rejects.toThrow();
    });
  });

  describe('Spirits Auth Service', () => {
    test('should check authorization for spirit', async () => {
      const isAuthorized = await spiritsAuthService.isAuthorizedForSpirit(
        mockPatron.sessionId,
        spiritId
      );

      expect(isAuthorized).toBe(false);
    });

    test('should request ultra shelf authorization', async () => {
      const result = await spiritsAuthService.requestUltraShelfAuthorization(
        mockPatron.sessionId,
        spiritId,
        mockPatron.patronName
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Authorization request submitted');
      expect(result.requestId).toBeDefined();
    });

    test('should get session authorizations', async () => {
      const authorizations = await spiritsAuthService.getSessionAuthorizations(
        mockPatron.sessionId
      );

      expect(Array.isArray(authorizations)).toBe(true);
      expect(authorizations).toHaveLength(0);
    });

    test('should get pending requests', async () => {
      // First create a request
      await spiritsAuthService.requestUltraShelfAuthorization(
        mockPatron.sessionId,
        spiritId,
        mockPatron.patronName
      );

      const pendingRequests = await spiritsAuthService.getPendingRequests();
      expect(Array.isArray(pendingRequests)).toBe(true);
      expect(pendingRequests.length).toBeGreaterThan(0);
    });

    test('should get authorization stats', async () => {
      const stats = await spiritsAuthService.getAuthorizationStats();

      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('approved');
      expect(stats).toHaveProperty('denied');
      expect(stats).toHaveProperty('total');
      expect(typeof stats.pending).toBe('number');
    });
  });
});

// Integration test for complete workflow
describe('Complete Ultra Shelf Authorization Workflow', () => {
  let spiritId;
  let requestId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/nauti-bouys-test');
  });

  afterAll(async () => {
    await Spirit.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const spirit = new Spirit(mockSpirit);
    await spirit.save();
    spiritId = spirit._id.toString();
  });

  afterEach(async () => {
    await Spirit.deleteMany({});
  });

  test('complete authorization workflow', async () => {
    // 1. Request authorization
    const requestResponse = await request(app)
      .post('/api/spirits/request-ultra')
      .send({
        spiritId,
        patronName: mockPatron.patronName,
        sessionId: mockPatron.sessionId
      })
      .expect(201);

    requestId = requestResponse.body.requestId;

    // 2. Check that authorization is initially false
    const checkResponse1 = await request(app)
      .get(`/api/spirits/check-authorization/${mockPatron.sessionId}/${spiritId}`)
      .expect(200);

    expect(checkResponse1.body.authorized).toBe(false);

    // 3. Owner approves request (mock auth required)
    // Note: This would require proper auth token in real scenario
    const approveResult = await spiritsAuthService.authorizeUltraShelfRequest(
      requestId,
      true,
      'Approved for testing'
    );

    expect(approveResult.success).toBe(true);

    // 4. Check that authorization is now true
    const checkResponse2 = await request(app)
      .get(`/api/spirits/check-authorization/${mockPatron.sessionId}/${spiritId}`)
      .expect(200);

    expect(checkResponse2.body.authorized).toBe(true);

    // 5. Get session authorizations
    const authResponse = await request(app)
      .get(`/api/spirits/authorizations?sessionId=${mockPatron.sessionId}`)
      .expect(200);

    expect(authResponse.body.count).toBe(1);
    expect(authResponse.body.authorizations[0].spirit._id).toBe(spiritId);
  });
});

module.exports = {
  mockSpirit,
  mockPatron
};