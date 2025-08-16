const Wine = require('../models/Wine');

const wineData = [
  // RED WINES - Cabernet Sauvignon
  {
    name: "Opus One 2019",
    winery: "Opus One Winery",
    vineyard: "Opus One Estate",
    varietal: "Cabernet Sauvignon Blend",
    region: "Napa Valley",
    vintage: 2019,
    type: "Red",
    domORintl: "Domestic",
    body: "Full",
    price: 450,
    description: "A legendary Bordeaux-style blend from Napa Valley, showcasing power and elegance with notes of blackcurrant, cedar, and graphite.",
    abv: 14.5,
    wsRank: 96,
    tastingNotes: ["Blackcurrant", "Cedar", "Graphite", "Dark chocolate"],
    foodPairing: "Prime rib, aged cheeses, dark chocolate desserts",
    isReserve: true
  },
  {
    name: "Caymus Cabernet Sauvignon 2021",
    winery: "Caymus Vineyards",
    vineyard: "Caymus Estate",
    varietal: "Cabernet Sauvignon",
    region: "Napa Valley",
    vintage: 2021,
    type: "Red",
    domORintl: "Domestic",
    body: "Full",
    price: 85,
    description: "Rich and concentrated with dark fruit flavors, vanilla, and spice. A classic Napa Valley expression.",
    abv: 14.8,
    wsRank: 92,
    tastingNotes: ["Dark cherry", "Vanilla", "Spice", "Tobacco"],
    foodPairing: "Grilled steak, lamb, mushroom risotto"
  },
  {
    name: "Silver Oak Alexander Valley 2018",
    winery: "Silver Oak Cellars",
    vineyard: "Alexander Valley Estate",
    varietal: "Cabernet Sauvignon",
    region: "Sonoma",
    vintage: 2018,
    type: "Red",
    domORintl: "Domestic",
    body: "Full",
    price: 95,
    description: "Elegant and refined with layers of dark fruit, complemented by American oak aging.",
    abv: 14.4,
    wsRank: 91,
    tastingNotes: ["Blackberry", "Cassis", "Oak", "Vanilla"],
    foodPairing: "Beef tenderloin, roasted vegetables, hard cheeses"
  },
  {
    name: "Château Margaux 2016",
    winery: "Château Margaux",
    vineyard: "Margaux Estate",
    varietal: "Cabernet Sauvignon Blend",
    region: "Bordeaux",
    vintage: 2016,
    type: "Red",
    domORintl: "International",
    body: "Full",
    price: 850,
    description: "One of Bordeaux's First Growths, offering exceptional elegance and complexity with silky tannins.",
    abv: 13.5,
    wsRank: 99,
    tastingNotes: ["Violet", "Blackcurrant", "Cedar", "Mineral"],
    foodPairing: "Rack of lamb, truffle dishes, aged Gruyère",
    isReserve: true
  },
  {
    name: "Stag's Leap Artemis 2020",
    winery: "Stag's Leap Wine Cellars",
    vineyard: "Stag's Leap District",
    varietal: "Cabernet Sauvignon",
    region: "Napa Valley",
    vintage: 2020,
    type: "Red",
    domORintl: "Domestic",
    body: "Medium",
    price: 65,
    description: "Approachable yet sophisticated, with bright fruit flavors and smooth tannins.",
    abv: 14.2,
    wsRank: 89,
    tastingNotes: ["Red cherry", "Plum", "Herbs", "Soft tannins"],
    foodPairing: "Grilled chicken, pasta with meat sauce, mild cheeses"
  },

  // RED WINES - Pinot Noir
  {
    name: "Domaine de la Romanée-Conti La Tâche 2018",
    winery: "Domaine de la Romanée-Conti",
    vineyard: "La Tâche",
    varietal: "Pinot Noir",
    region: "Burgundy",
    vintage: 2018,
    type: "Red",
    domORintl: "International",
    body: "Medium",
    price: 2500,
    description: "The pinnacle of Burgundy, offering ethereal complexity and unmatched elegance from one of the world's greatest vineyards.",
    abv: 13.0,
    wsRank: 100,
    tastingNotes: ["Rose petals", "Red cherry", "Earth", "Spice"],
    foodPairing: "Duck breast, wild mushrooms, soft cheeses",
    isReserve: true
  },
  {
    name: "Kosta Browne Pinot Noir 2021",
    winery: "Kosta Browne Winery",
    vineyard: "Russian River Valley",
    varietal: "Pinot Noir",
    region: "Sonoma",
    vintage: 2021,
    type: "Red",
    domORintl: "Domestic",
    body: "Medium",
    price: 75,
    description: "Rich and velvety with concentrated dark fruit flavors and a long, elegant finish.",
    abv: 14.1,
    wsRank: 93,
    tastingNotes: ["Dark cherry", "Raspberry", "Vanilla", "Spice"],
    foodPairing: "Salmon, roasted duck, mushroom dishes"
  },
  {
    name: "Cloudy Bay Pinot Noir 2022",
    winery: "Cloudy Bay",
    vineyard: "Central Otago",
    varietal: "Pinot Noir",
    region: "Marlborough",
    vintage: 2022,
    type: "Red",
    domORintl: "International",
    body: "Light",
    price: 35,
    description: "Bright and fresh with vibrant red fruit flavors and a silky texture from New Zealand's premier region.",
    abv: 13.5,
    wsRank: 88,
    tastingNotes: ["Strawberry", "Cherry", "Herbs", "Mineral"],
    foodPairing: "Grilled salmon, roasted chicken, goat cheese"
  },

  // RED WINES - Merlot
  {
    name: "Château Pétrus 2015",
    winery: "Château Pétrus",
    vineyard: "Pomerol Estate",
    varietal: "Merlot",
    region: "Bordeaux",
    vintage: 2015,
    type: "Red",
    domORintl: "International",
    body: "Full",
    price: 3200,
    description: "The world's most famous Merlot, offering unparalleled richness and complexity from Pomerol's clay soils.",
    abv: 14.0,
    wsRank: 98,
    tastingNotes: ["Plum", "Chocolate", "Truffle", "Velvet tannins"],
    foodPairing: "Beef Wellington, foie gras, dark chocolate",
    isReserve: true
  },
  {
    name: "Duckhorn Merlot 2020",
    winery: "Duckhorn Vineyards",
    vineyard: "Napa Valley Estate",
    varietal: "Merlot",
    region: "Napa Valley",
    vintage: 2020,
    type: "Red",
    domORintl: "Domestic",
    body: "Medium",
    price: 55,
    description: "Smooth and approachable with ripe fruit flavors and well-integrated oak.",
    abv: 14.3,
    wsRank: 90,
    tastingNotes: ["Black cherry", "Plum", "Mocha", "Soft tannins"],
    foodPairing: "Roasted pork, pasta dishes, medium cheeses"
  },

  // WHITE WINES - Chardonnay
  {
    name: "Domaine Leflaive Montrachet 2020",
    winery: "Domaine Leflaive",
    vineyard: "Montrachet",
    varietal: "Chardonnay",
    region: "Burgundy",
    vintage: 2020,
    type: "White",
    domORintl: "International",
    body: "Full",
    price: 1200,
    description: "The king of white Burgundy, offering incredible complexity and mineral precision from the world's greatest Chardonnay vineyard.",
    abv: 13.0,
    wsRank: 98,
    tastingNotes: ["Citrus", "Mineral", "Hazelnut", "Butter"],
    foodPairing: "Lobster, foie gras, aged Comté",
    isReserve: true
  },
  {
    name: "Kistler Chardonnay 2021",
    winery: "Kistler Vineyards",
    vineyard: "Les Noisetiers",
    varietal: "Chardonnay",
    region: "Sonoma",
    vintage: 2021,
    type: "White",
    domORintl: "Domestic",
    body: "Full",
    price: 65,
    description: "Rich and creamy with perfect balance of fruit and oak, showcasing California's finest Chardonnay style.",
    abv: 14.2,
    wsRank: 91,
    tastingNotes: ["Apple", "Pear", "Vanilla", "Toasted oak"],
    foodPairing: "Roasted chicken, seafood pasta, brie cheese"
  },
  {
    name: "Chablis Premier Cru Montmains 2022",
    winery: "Domaine Christian Moreau",
    vineyard: "Montmains",
    varietal: "Chardonnay",
    region: "Burgundy",
    vintage: 2022,
    type: "White",
    domORintl: "International",
    body: "Light",
    price: 45,
    description: "Crisp and mineral-driven Chablis with bright acidity and subtle complexity.",
    abv: 12.5,
    wsRank: 89,
    tastingNotes: ["Green apple", "Citrus", "Mineral", "Oyster shell"],
    foodPairing: "Oysters, sushi, goat cheese"
  },

  // WHITE WINES - Sauvignon Blanc
  {
    name: "Cloudy Bay Sauvignon Blanc 2023",
    winery: "Cloudy Bay",
    vineyard: "Marlborough Estate",
    varietal: "Sauvignon Blanc",
    region: "Marlborough",
    vintage: 2023,
    type: "White",
    domORintl: "International",
    body: "Light",
    price: 25,
    description: "The wine that put New Zealand on the map, with vibrant tropical fruit and herbaceous notes.",
    abv: 13.0,
    wsRank: 90,
    tastingNotes: ["Passion fruit", "Lime", "Grass", "Mineral"],
    foodPairing: "Seafood, salads, fresh herbs"
  },
  {
    name: "Sancerre Henri Bourgeois 2022",
    winery: "Henri Bourgeois",
    vineyard: "La Bourgeoise",
    varietal: "Sauvignon Blanc",
    region: "Loire Valley",
    vintage: 2022,
    type: "White",
    domORintl: "International",
    body: "Light",
    price: 35,
    description: "Classic Loire Valley Sauvignon Blanc with elegant minerality and citrus precision.",
    abv: 12.5,
    wsRank: 88,
    tastingNotes: ["Grapefruit", "Mineral", "Herbs", "Flint"],
    foodPairing: "Goat cheese, shellfish, light salads"
  },

  // SPARKLING WINES
  {
    name: "Dom Pérignon 2013",
    winery: "Dom Pérignon",
    vineyard: "Champagne Estate",
    varietal: "Chardonnay/Pinot Noir",
    region: "Champagne",
    vintage: 2013,
    type: "Sparkling",
    domORintl: "International",
    body: "Medium",
    price: 220,
    description: "The most prestigious Champagne house's flagship cuvée, offering exceptional elegance and complexity.",
    abv: 12.5,
    wsRank: 95,
    tastingNotes: ["Brioche", "Citrus", "Almond", "Mineral"],
    foodPairing: "Caviar, lobster, celebration",
    isReserve: true
  },
  {
    name: "Krug Grande Cuvée NV",
    winery: "Krug",
    vineyard: "Champagne Blend",
    varietal: "Chardonnay/Pinot Noir/Pinot Meunier",
    region: "Champagne",
    vintage: 2015,
    type: "Sparkling",
    domORintl: "International",
    body: "Full",
    price: 180,
    description: "Complex and rich Champagne with incredible depth from multiple vintages and extended aging.",
    abv: 12.0,
    wsRank: 93,
    tastingNotes: ["Honey", "Nuts", "Spice", "Toast"],
    foodPairing: "Foie gras, aged cheeses, rich seafood",
    isReserve: true
  },

  // ROSÉ WINES
  {
    name: "Château d'Esclans Whispering Angel 2023",
    winery: "Château d'Esclans",
    vineyard: "Provence Estate",
    varietal: "Grenache/Cinsault",
    region: "Provence",
    vintage: 2023,
    type: "Rose",
    domORintl: "International",
    body: "Light",
    price: 22,
    description: "The benchmark Provence rosé with delicate fruit flavors and elegant minerality.",
    abv: 13.0,
    wsRank: 87,
    tastingNotes: ["Strawberry", "Citrus", "Herbs", "Mineral"],
    foodPairing: "Salads, grilled fish, Mediterranean cuisine"
  },
  {
    name: "Domaines Ott Château de Selle 2023",
    winery: "Domaines Ott",
    vineyard: "Château de Selle",
    varietal: "Grenache/Cinsault/Syrah",
    region: "Provence",
    vintage: 2023,
    type: "Rose",
    domORintl: "International",
    body: "Light",
    price: 35,
    description: "Premium Provence rosé with exceptional elegance and complexity.",
    abv: 13.5,
    wsRank: 90,
    tastingNotes: ["Peach", "Rose petals", "Mineral", "Herbs"],
    foodPairing: "Seafood, light pasta, soft cheeses",
    isReserve: true
  },

  // DESSERT WINES
  {
    name: "Château d'Yquem 2016",
    winery: "Château d'Yquem",
    vineyard: "Sauternes Estate",
    varietal: "Sémillon/Sauvignon Blanc",
    region: "Bordeaux",
    vintage: 2016,
    type: "Dessert",
    domORintl: "International",
    body: "Full",
    price: 450,
    description: "The world's greatest dessert wine, with incredible complexity and centuries of aging potential.",
    abv: 14.0,
    wsRank: 99,
    tastingNotes: ["Honey", "Apricot", "Spice", "Botrytis"],
    foodPairing: "Foie gras, blue cheese, fruit tarts",
    isReserve: true
  },

  // FORTIFIED WINES
  {
    name: "Vintage Port 2000",
    winery: "Taylor Fladgate",
    vineyard: "Quinta de Vargellas",
    varietal: "Port Blend",
    region: "Douro",
    vintage: 2000,
    type: "Fortified",
    domORintl: "International",
    body: "Full",
    price: 150,
    description: "Declared vintage Port from an exceptional year, rich and concentrated.",
    abv: 20.0,
    wsRank: 94,
    tastingNotes: ["Dark fruit", "Chocolate", "Spice", "Alcohol"],
    foodPairing: "Blue cheese, chocolate desserts, nuts",
    isReserve: true
  },

  // VALUE WINES
  {
    name: "Bogle Cabernet Sauvignon 2021",
    winery: "Bogle Vineyards",
    vineyard: "California Estate",
    varietal: "Cabernet Sauvignon",
    region: "California",
    vintage: 2021,
    type: "Red",
    domORintl: "Domestic",
    body: "Medium",
    price: 18,
    description: "Excellent value California Cabernet with rich fruit flavors.",
    abv: 13.8,
    wsRank: 85,
    tastingNotes: ["Blackberry", "Vanilla", "Spice", "Oak"],
    foodPairing: "Burgers, BBQ, casual dining"
  },
  {
    name: "Oyster Bay Sauvignon Blanc 2023",
    winery: "Oyster Bay",
    vineyard: "Marlborough Vineyards",
    varietal: "Sauvignon Blanc",
    region: "Marlborough",
    vintage: 2023,
    type: "White",
    domORintl: "International",
    body: "Light",
    price: 12,
    description: "Crisp and refreshing New Zealand Sauvignon Blanc with tropical fruit flavors.",
    abv: 12.5,
    wsRank: 84,
    tastingNotes: ["Passion fruit", "Citrus", "Herbs", "Crisp"],
    foodPairing: "Seafood, salads, light appetizers"
  }
];

// Seed function
const seedWines = async () => {
  try {
    console.log('🍷 Seeding wine data...');
    
    // Clear existing wines
    await Wine.deleteMany({});
    console.log('Cleared existing wine data');
    
    // Insert new wine data
    const wines = await Wine.insertMany(wineData);
    console.log(`✅ Successfully seeded ${wines.length} wines`);
    
    return wines;
  } catch (error) {
    console.error('❌ Error seeding wines:', error);
    throw error;
  }
};

module.exports = { seedWines, wineData };
