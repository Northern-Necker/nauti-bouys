const mongoose = require('mongoose');
const Spirit = require('../models/Spirit');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Shelf tier mapping based on spirit characteristics
const shelfTierMapping = {
  // Ultra shelf - Premium, rare, expensive spirits
  ultra: [
    // Ultra Premium Whiskeys
    'Pappy Van Winkle 23 Year',
    'Michter\'s 20 Year Bourbon',
    'Macallan 25 Year Sherry Oak',
    'Yamazaki 18 Year',
    'Johnnie Walker Blue Label',
    'Redbreast 21 Year',
    'Lagavulin 16 Year',
    
    // Ultra Premium Tequilas
    'Don Julio 1942',
    'Clase Azul Reposado',
    'Patron en Lalique Serie 2',
    
    // Ultra Premium Cognacs
    'Hennessy Paradis',
    
    // Ultra Premium Rums
    'Appleton Estate 21 Year',
    'Mount Gay XO',
    'Diplomatico Reserva Exclusiva',
    
    // Ultra Premium Vodkas
    'Beluga Gold Line',
    
    // Ultra Premium Gins
    'Monkey 47',
    
    // Premium Mezcals
    'Del Maguey Vida Mezcal'
  ],
  
  // Top shelf - High quality, premium spirits
  top: [
    'Buffalo Trace Antique Collection',
    'Weller 12 Year',
    'Blanton\'s Single Barrel',
    'Grey Goose',
    'Hendrick\'s Gin',
    'The Botanist Gin',
    'Fortaleza Blanco'
  ],
  
  // Lower shelf - Standard, mixing spirits
  lower: [
    'Waterman\'s Bourbon',
    'Chesapeake Bay Vodka'
  ]
};

// Mixing appropriateness mapping
const mixingAppropriate = {
  // These spirits are generally not appropriate for mixing
  notForMixing: [
    'Pappy Van Winkle 23 Year',
    'Michter\'s 20 Year Bourbon',
    'Macallan 25 Year Sherry Oak',
    'Yamazaki 18 Year',
    'Johnnie Walker Blue Label',
    'Redbreast 21 Year',
    'Don Julio 1942',
    'Hennessy Paradis',
    'Appleton Estate 21 Year',
    'Patron en Lalique Serie 2'
  ]
};

async function updateSpiritsShelfTiers() {
  try {
    await connectDB();
    
    console.log('Starting spirits shelf tier update...');
    
    // Get all spirits
    const spirits = await Spirit.find({});
    console.log(`Found ${spirits.length} spirits to update`);
    
    let updatedCount = 0;
    
    for (const spirit of spirits) {
      let shelf_tier = 'lower'; // default
      let mixing_appropriate = true; // default
      
      // Determine shelf tier based on name matching
      if (shelfTierMapping.ultra.some(name => 
        spirit.name.toLowerCase().includes(name.toLowerCase()) ||
        `${spirit.brand} ${spirit.name}`.toLowerCase().includes(name.toLowerCase())
      )) {
        shelf_tier = 'ultra';
      } else if (shelfTierMapping.top.some(name => 
        spirit.name.toLowerCase().includes(name.toLowerCase()) ||
        `${spirit.brand} ${spirit.name}`.toLowerCase().includes(name.toLowerCase())
      )) {
        shelf_tier = 'top';
      } else {
        // Use heuristics for unmatched spirits
        const fullName = `${spirit.brand} ${spirit.name}`.toLowerCase();
        
        // Ultra shelf indicators
        if (
          spirit.age >= 18 || // Very aged spirits
          fullName.includes('reserve') ||
          fullName.includes('limited') ||
          fullName.includes('single barrel') ||
          fullName.includes('cask strength') ||
          fullName.includes('vintage') ||
          (spirit.type === 'Whiskey' && spirit.age >= 15) ||
          (spirit.type === 'Tequila' && fullName.includes('añejo')) ||
          (spirit.type === 'Cognac') ||
          fullName.includes('xo') ||
          fullName.includes('extra old')
        ) {
          shelf_tier = 'ultra';
        }
        // Top shelf indicators
        else if (
          spirit.age >= 10 ||
          fullName.includes('premium') ||
          fullName.includes('select') ||
          fullName.includes('special') ||
          fullName.includes('gold') ||
          fullName.includes('platinum') ||
          (spirit.type === 'Whiskey' && spirit.age >= 8) ||
          (spirit.type === 'Gin' && fullName.includes('botanist')) ||
          (spirit.type === 'Vodka' && (fullName.includes('grey goose') || fullName.includes('beluga')))
        ) {
          shelf_tier = 'top';
        }
      }
      
      // Determine mixing appropriateness
      if (mixingAppropriate.notForMixing.some(name => 
        spirit.name.toLowerCase().includes(name.toLowerCase()) ||
        `${spirit.brand} ${spirit.name}`.toLowerCase().includes(name.toLowerCase())
      )) {
        mixing_appropriate = false;
      } else {
        // Heuristics for mixing appropriateness
        const fullName = `${spirit.brand} ${spirit.name}`.toLowerCase();
        
        if (
          shelf_tier === 'ultra' ||
          spirit.age >= 18 ||
          fullName.includes('reserve') ||
          fullName.includes('limited edition') ||
          fullName.includes('single barrel') ||
          fullName.includes('cask strength') ||
          (spirit.type === 'Whiskey' && spirit.age >= 15) ||
          (spirit.type === 'Cognac') ||
          fullName.includes('paradis') ||
          fullName.includes('xo')
        ) {
          mixing_appropriate = false;
        }
      }
      
      // Update the spirit
      const updateData = {
        shelf_tier,
        mixing_appropriate
      };
      
      // Remove price fields if they exist
      await Spirit.updateOne(
        { _id: spirit._id },
        { 
          $set: updateData,
          $unset: { 
            price: 1, 
            pricePerOz: 1,
            isPremium: 1,
            isTopShelf: 1
          }
        }
      );
      
      updatedCount++;
      console.log(`Updated ${spirit.brand} ${spirit.name}: ${shelf_tier} shelf, mixing: ${mixing_appropriate}`);
    }
    
    console.log(`\nSuccessfully updated ${updatedCount} spirits with shelf tiers and mixing appropriateness`);
    
    // Show summary statistics
    const stats = await Spirit.aggregate([
      {
        $group: {
          _id: '$shelf_tier',
          count: { $sum: 1 },
          mixing_appropriate: { 
            $sum: { $cond: ['$mixing_appropriate', 1, 0] } 
          }
        }
      }
    ]);
    
    console.log('\nShelf Tier Summary:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} spirits (${stat.mixing_appropriate} mixing appropriate)`);
    });
    
  } catch (error) {
    console.error('Error updating spirits shelf tiers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update script
if (require.main === module) {
  updateSpiritsShelfTiers();
}

module.exports = updateSpiritsShelfTiers;