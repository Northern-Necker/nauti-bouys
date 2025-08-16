const sampleCocktails = [{ name: 'Margarita', price: 12, isAvailable: true }];
const sampleSpirits = [{ name: 'Bourbon', price: 45, isAvailable: true }];
const sampleWines = [{ name: 'Merlot', price: 25, isAvailable: true }];
const sampleBeers = [{ name: 'IPA', price: 8, isAvailable: true }];
const sampleMocktails = [{ name: 'Virgin Mojito', price: 6, isAvailable: true }];
const sampleNonAlcoholic = [{ name: 'Soda', price: 3, isAvailable: true }];

const mockCocktailFind = jest.fn(() => ({ 
  sort: jest.fn(() => ({ 
    limit: jest.fn(() => ({ 
      lean: jest.fn().mockResolvedValue(sampleCocktails) 
    })) 
  })) 
}));

const mockSpiritFind = jest.fn(() => ({ 
  sort: jest.fn(() => ({ 
    limit: jest.fn(() => ({ 
      lean: jest.fn().mockResolvedValue(sampleSpirits) 
    })) 
  })) 
}));

const mockWineFind = jest.fn(() => ({ 
  sort: jest.fn(() => ({ 
    limit: jest.fn(() => ({ 
      lean: jest.fn().mockResolvedValue(sampleWines) 
    })) 
  })) 
}));

const mockBeerFind = jest.fn(() => ({ 
  sort: jest.fn(() => ({ 
    limit: jest.fn(() => ({ 
      lean: jest.fn().mockResolvedValue(sampleBeers) 
    })) 
  })) 
}));

const mockMocktailFind = jest.fn(() => ({ 
  sort: jest.fn(() => ({ 
    limit: jest.fn(() => ({ 
      lean: jest.fn().mockResolvedValue(sampleMocktails) 
    })) 
  })) 
}));

const mockOtherFind = jest.fn(() => ({ 
  sort: jest.fn(() => ({ 
    limit: jest.fn(() => ({ 
      lean: jest.fn().mockResolvedValue(sampleNonAlcoholic) 
    })) 
  })) 
}));

let spiritChangeCallback;
const mockSpiritWatch = jest.fn(() => ({
  on: jest.fn((event, cb) => {
    if (event === 'change') spiritChangeCallback = cb;
  })
}));
const mockGenericWatch = jest.fn(() => ({ on: jest.fn() }));

jest.mock('../models/Cocktail', () => ({ find: mockCocktailFind, watch: mockGenericWatch }));
jest.mock('../models/Spirit', () => ({ find: mockSpiritFind, watch: mockSpiritWatch }));
jest.mock('../models/Wine', () => ({ find: mockWineFind, watch: mockGenericWatch }));
jest.mock('../models/Beer', () => ({ find: mockBeerFind, watch: mockGenericWatch }));
jest.mock('../models/Mocktail', () => ({ find: mockMocktailFind, watch: mockGenericWatch }));
jest.mock('../models/OtherNonAlcoholic', () => ({ find: mockOtherFind, watch: mockGenericWatch }));

// Mock node-cache
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => mockCache);
});

const service = require('./didStreamingService');

beforeEach(() => {
  jest.clearAllMocks();
  mockCache.get.mockReturnValue(null); // Cache miss by default
});

describe('DID Streaming Service Caching', () => {
  test('getCachedInventory returns cached results when cache hit', async () => {
    // Setup cache hit
    mockCache.get.mockReturnValue(sampleSpirits);
    
    const result = await service.getCachedInventory('spirits');
    
    expect(result).toEqual(sampleSpirits);
    expect(mockCache.get).toHaveBeenCalledWith('spirits');
    expect(mockSpiritFind).not.toHaveBeenCalled(); // Should not hit database
  });

  test('getCachedInventory fetches from database on cache miss', async () => {
    // Setup cache miss
    mockCache.get.mockReturnValue(null);
    
    const result = await service.getCachedInventory('spirits');
    
    expect(result).toEqual(sampleSpirits);
    expect(mockCache.get).toHaveBeenCalledWith('spirits');
    expect(mockCache.set).toHaveBeenCalledWith('spirits', sampleSpirits);
    expect(mockSpiritFind).toHaveBeenCalledTimes(1);
  });

  test('refreshCache updates all beverage types', async () => {
    await service.refreshCache('cocktails');
    await service.refreshCache('spirits');
    await service.refreshCache('wines');
    await service.refreshCache('beers');
    await service.refreshCache('mocktails');
    await service.refreshCache('nonAlcoholic');
    
    expect(mockCocktailFind).toHaveBeenCalledTimes(1);
    expect(mockSpiritFind).toHaveBeenCalledTimes(1);
    expect(mockWineFind).toHaveBeenCalledTimes(1);
    expect(mockBeerFind).toHaveBeenCalledTimes(1);
    expect(mockMocktailFind).toHaveBeenCalledTimes(1);
    expect(mockOtherFind).toHaveBeenCalledTimes(1);
  });

  test('refreshInventoryCache refreshes all cache keys', async () => {
    const spy = jest.spyOn(service, 'refreshCache');
    
    await service.refreshInventoryCache();
    
    expect(spy).toHaveBeenCalledWith('spirits');
    expect(spy).toHaveBeenCalledWith('cocktails');
    expect(spy).toHaveBeenCalledWith('wines');
    expect(spy).toHaveBeenCalledWith('beers');
    expect(spy).toHaveBeenCalledWith('mocktails');
    expect(spy).toHaveBeenCalledWith('nonAlcoholic');
    expect(spy).toHaveBeenCalledTimes(6);
  });

  test('cache includes all extended beverage categories', async () => {
    const cacheKeys = service.cacheKeys;
    
    expect(cacheKeys).toHaveProperty('spirits');
    expect(cacheKeys).toHaveProperty('cocktails');
    expect(cacheKeys).toHaveProperty('wines');
    expect(cacheKeys).toHaveProperty('beers');
    expect(cacheKeys).toHaveProperty('mocktails');
    expect(cacheKeys).toHaveProperty('nonAlcoholic');
  });

  test('change watchers are set up for all models', () => {
    // Verify watchers were set up during service initialization
    expect(mockSpiritWatch).toHaveBeenCalled();
    expect(mockGenericWatch).toHaveBeenCalledTimes(5); // Other 5 models
  });
});
