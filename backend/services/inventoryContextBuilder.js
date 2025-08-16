/**
 * Smart Inventory Context Builder
 * Dynamically builds relevant beverage context based on user queries
 */

const Cocktail = require('../models/Cocktail');
const Spirit = require('../models/Spirit');
const Wine = require('../models/Wine');
const Beer = require('../models/Beer');
const Mocktail = require('../models/Mocktail');
const OtherNonAlcoholic = require('../models/OtherNonAlcoholic');

class InventoryContextBuilder {
  constructor() {
    // Keyword mappings for semantic understanding
    this.beverageKeywords = {
      spirits: {
        keywords: ['bourbon', 'whiskey', 'whisky', 'vodka', 'gin', 'rum', 'tequila', 'mezcal', 'cognac', 'brandy', 'scotch', 'rye', 'spirit', 'liquor'],
        subcategories: {
          bourbon: ['bourbon', 'whiskey', 'whisky', 'rye'],
          vodka: ['vodka'],
          gin: ['gin'],
          rum: ['rum'],
          tequila: ['tequila', 'mezcal'],
          cognac: ['cognac', 'brandy'],
          scotch: ['scotch', 'whisky', 'whiskey']
        }
      },
      cocktails: {
        keywords: ['cocktail', 'mixed drink', 'martini', 'manhattan', 'old fashioned', 'negroni', 'margarita', 'mojito', 'daiquiri', 'cosmopolitan']
      },
      wines: {
        keywords: ['wine', 'red wine', 'white wine', 'rosé', 'champagne', 'prosecco', 'sparkling', 'chardonnay', 'cabernet', 'merlot', 'pinot']
      },
      beers: {
        keywords: ['beer', 'ale', 'lager', 'ipa', 'stout', 'porter', 'pilsner', 'wheat beer']
      },
      nonAlcoholic: {
        keywords: ['mocktail', 'non-alcoholic', 'virgin', 'soda', 'juice', 'water', 'coffee', 'tea']
      }
    };
  }

  /**
   * Extract relevant keywords from user message
   */
  extractKeywords(message) {
    const lowerMessage = message.toLowerCase();
    const foundKeywords = {
      categories: [],
      subcategories: [],
      specific: []
    };

    // Check each category
    Object.entries(this.beverageKeywords).forEach(([category, data]) => {
      const hasKeyword = data.keywords.some(keyword => lowerMessage.includes(keyword));
      if (hasKeyword) {
        foundKeywords.categories.push(category);
        
        // Check subcategories if they exist
        if (data.subcategories) {
          Object.entries(data.subcategories).forEach(([subcat, subKeywords]) => {
            const hasSubKeyword = subKeywords.some(keyword => lowerMessage.includes(keyword));
            if (hasSubKeyword) {
              foundKeywords.subcategories.push(subcat);
            }
          });
        }
      }
    });

    return foundKeywords;
  }

  /**
   * Get all available inventory
   */
  async getAllInventory() {
    const [cocktails, spirits, wines, beers, mocktails, nonAlcoholic] = await Promise.all([
      Cocktail.find({ isAvailable: true }).lean(),
      Spirit.find({ isAvailable: true }).lean(),
      Wine.find({ isAvailable: true }).lean(),
      Beer.find({ isAvailable: true }).lean(),
      Mocktail.find({ isAvailable: true }).lean(),
      OtherNonAlcoholic.find({ isAvailable: true }).lean()
    ]);

    return {
      cocktails,
      spirits,
      wines,
      beers,
      mocktails,
      nonAlcoholic
    };
  }

  /**
   * Filter spirits by subcategory (e.g., bourbon, vodka, etc.)
   */
  filterSpiritsByType(spirits, subcategory) {
    switch (subcategory) {
      case 'bourbon':
        return spirits.filter(s => 
          s.type.toLowerCase().includes('whiskey') || 
          s.type.toLowerCase().includes('whisky') ||
          s.brand.toLowerCase().includes('pappy') ||
          s.brand.toLowerCase().includes('blanton') ||
          s.brand.toLowerCase().includes('weller') ||
          s.brand.toLowerCase().includes('buffalo') ||
          s.brand.toLowerCase().includes('maker') ||
          s.name.toLowerCase().includes('bourbon')
        );
      case 'vodka':
        return spirits.filter(s => s.type.toLowerCase().includes('vodka'));
      case 'gin':
        return spirits.filter(s => s.type.toLowerCase().includes('gin'));
      case 'rum':
        return spirits.filter(s => s.type.toLowerCase().includes('rum'));
      case 'tequila':
        return spirits.filter(s => 
          s.type.toLowerCase().includes('tequila') || 
          s.type.toLowerCase().includes('mezcal')
        );
      case 'cognac':
        return spirits.filter(s => 
          s.type.toLowerCase().includes('cognac') || 
          s.type.toLowerCase().includes('brandy')
        );
      case 'scotch':
        return spirits.filter(s => 
          s.type.toLowerCase().includes('scotch') ||
          (s.type.toLowerCase().includes('whisky') && s.origin?.toLowerCase().includes('scotland'))
        );
      default:
        return spirits;
    }
  }

  /**
   * Build relevant inventory context based on user message
   */
  async buildRelevantContext(message, topN = 5) {
    const keywords = this.extractKeywords(message);
    const allInventory = await this.getAllInventory();
    
    const relevantInventory = {
      primary: {},
      secondary: {},
      general: {}
    };

    // If specific subcategories mentioned (e.g., bourbon), prioritize those
    if (keywords.subcategories.length > 0) {
      keywords.subcategories.forEach(subcat => {
        if (subcat === 'bourbon' || subcat === 'vodka' || subcat === 'gin' || subcat === 'rum' || subcat === 'tequila' || subcat === 'cognac' || subcat === 'scotch') {
          relevantInventory.primary[subcat] = this.filterSpiritsByType(allInventory.spirits, subcat).slice(0, topN);
        }
      });
    }

    // Add category-level matches
    keywords.categories.forEach(category => {
      switch (category) {
        case 'spirits':
          if (!Object.keys(relevantInventory.primary).length) {
            relevantInventory.secondary.spirits = allInventory.spirits.slice(0, topN);
          }
          break;
        case 'cocktails':
          relevantInventory.secondary.cocktails = allInventory.cocktails.slice(0, topN);
          break;
        case 'wines':
          relevantInventory.secondary.wines = allInventory.wines.slice(0, topN);
          break;
        case 'beers':
          relevantInventory.secondary.beers = allInventory.beers.slice(0, topN);
          break;
        case 'nonAlcoholic':
          relevantInventory.secondary.mocktails = allInventory.mocktails.slice(0, topN);
          relevantInventory.secondary.nonAlcoholic = allInventory.nonAlcoholic.slice(0, topN);
          break;
      }
    });

    // If no specific matches, provide general selection
    if (!Object.keys(relevantInventory.primary).length && !Object.keys(relevantInventory.secondary).length) {
      relevantInventory.general = {
        topCocktails: allInventory.cocktails.slice(0, topN),
        topSpirits: allInventory.spirits.slice(0, topN),
        topWines: allInventory.wines.slice(0, topN)
      };
    }

    return relevantInventory;
  }

  /**
   * Format inventory for AI consumption
   */
  formatInventoryForAI(relevantInventory, topN = 5) {
    let formattedContext = '';

    // Format primary matches (most relevant)
    if (Object.keys(relevantInventory.primary).length > 0) {
      formattedContext += '*** PRIMARY RECOMMENDATIONS (Most Relevant) ***\n';
      Object.entries(relevantInventory.primary).forEach(([category, items]) => {
        formattedContext += `\n${category.toUpperCase()} SELECTION:\n`;
        items.forEach(item => {
          const name = item.brand ? `${item.brand} ${item.name}` : item.name;
          const details = [];
          if (item.age) details.push(`${item.age} year aged`);
          if (item.type) details.push(item.type);
          if (item.origin) details.push(`from ${item.origin}`);
          
          formattedContext += `• ${name} ($${item.price})${details.length ? ' - ' + details.join(', ') : ''}\n`;
        });
      });
    }

    // Format secondary matches
    if (Object.keys(relevantInventory.secondary).length > 0) {
      formattedContext += '\n*** ADDITIONAL OPTIONS ***\n';
      Object.entries(relevantInventory.secondary).forEach(([category, items]) => {
        formattedContext += `\n${category.toUpperCase()}:\n`;
        items.slice(0, topN).forEach(item => {
          const name = item.brand ? `${item.brand} ${item.name}` : item.name;
          formattedContext += `• ${name} ($${item.price})\n`;
        });
      });
    }

    // Format general selection
    if (Object.keys(relevantInventory.general).length > 0) {
      formattedContext += '\n*** FEATURED SELECTIONS ***\n';
      Object.entries(relevantInventory.general).forEach(([category, items]) => {
        formattedContext += `\n${category.replace(/([A-Z])/g, ' $1').toUpperCase()}:\n`;
        items.slice(0, topN).forEach(item => {
          const name = item.brand ? `${item.brand} ${item.name}` : item.name;
          formattedContext += `• ${name} ($${item.price})\n`;
        });
      });
    }

    return formattedContext;
  }

  /**
   * Main method: Build complete context for AI
   */
  async buildContextForAI(message, topN = 5) {
    const relevantInventory = await this.buildRelevantContext(message, topN);
    const formattedInventory = this.formatInventoryForAI(relevantInventory, topN);
    
    return {
      relevantInventory,
      formattedInventory,
      hasSpecificMatches: Object.keys(relevantInventory.primary).length > 0,
      categories: this.extractKeywords(message)
    };
  }
}

module.exports = new InventoryContextBuilder();
