// Mock beverage data for testing
export const mockBeverages = [
  {
    id: '1',
    name: 'Bay Wheat Beer',
    category: 'beer',
    type: 'wheat',
    price: 8.99,
    image: '/images/beverages/bay-wheat-beer.jpg',
    description: 'Local wheat beer with citrus notes'
  },
  {
    id: '2', 
    name: 'Chesapeake Lager',
    category: 'beer',
    type: 'lager',
    price: 7.99,
    image: '/images/beverages/chesapeake-lager-beer.jpg',
    description: 'Crisp and refreshing lager'
  },
  {
    id: '3',
    name: 'Bay Breeze Cocktail',
    category: 'cocktail',
    type: 'signature',
    price: 12.99,
    image: '/images/beverages/bay-breeze-signature-cocktail.jpg',
    description: 'Signature cocktail with tropical flavors',
    ingredients: ['vodka', 'cranberry juice', 'pineapple juice']
  },
  {
    id: '4',
    name: 'Virginia Chardonnay',
    category: 'wine',
    type: 'white',
    price: 45.99,
    image: '/images/beverages/virginia-chardonnay-wine.jpg',
    description: 'Local Virginia white wine'
  }
];

export const mockCocktails = [
  {
    id: '1',
    name: 'Bay Breeze',
    type: 'signature',
    price: 12.99,
    image: '/images/beverages/bay-breeze-signature-cocktail.jpg',
    description: 'Signature cocktail with tropical flavors',
    ingredients: ['vodka', 'cranberry juice', 'pineapple juice'],
    garnish: 'lime wheel'
  },
  {
    id: '2',
    name: 'Crab Cake Bloody Mary',
    type: 'brunch',
    price: 14.99,
    image: '/images/beverages/crab-cake-bloody-mary-cocktail.jpg',
    description: 'Local twist on the classic brunch cocktail',
    ingredients: ['vodka', 'tomato juice', 'old bay', 'celery salt'],
    garnish: 'mini crab cake'
  }
];

export const mockWines = [
  {
    id: '1',
    name: 'Virginia Chardonnay',
    type: 'white',
    vintage: 2022,
    region: 'Virginia',
    price: 45.99,
    image: '/images/beverages/virginia-chardonnay-wine.jpg',
    description: 'Crisp white wine from local Virginia vineyards'
  },
  {
    id: '2',
    name: 'Reedville Rosé',
    type: 'rosé',
    vintage: 2023,
    region: 'Reedville, VA',
    price: 42.99,
    image: '/images/beverages/reedville-rosé-wine.jpg',
    description: 'Light and refreshing rosé from the Northern Neck'
  }
];

export const mockSpirits = [
  {
    id: '1',
    name: "Waterman's Bourbon",
    type: 'bourbon',
    age: '8 years',
    proof: 90,
    price: 89.99,
    image: '/images/beverages/waterman-s-bourbon-spirit.jpg',
    description: 'Premium aged bourbon with maritime influence'
  },
  {
    id: '2',
    name: 'Chesapeake Bay Vodka',
    type: 'vodka',
    proof: 80,
    price: 34.99,
    image: '/images/beverages/chesapeake-bay-vodka-spirit.jpg',
    description: 'Smooth vodka distilled with Chesapeake Bay water'
  }
];