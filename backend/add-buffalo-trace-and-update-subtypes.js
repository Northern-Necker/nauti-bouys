const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
require('dotenv').config();

const addBuffaloTraceAndUpdateSubTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    // First, add Buffalo Trace Bourbon
    const buffaloTrace = new Spirit({
      name: 'Buffalo Trace Bourbon',
      brand: 'Buffalo Trace',
      type: 'Whiskey',
      subType: 'Bourbon',
      abv: 45,
      price: 25,
      description: 'A classic Kentucky straight bourbon whiskey with a complex aroma of vanilla, mint and molasses. Pleasantly sweet to the taste with notes of brown sugar and spice that give way to oak, toffee, dark fruit and anise.',
      origin: 'Kentucky, USA',
      age: null, // No age statement
      bottleSize: '750ml',
      distillery: 'Buffalo Trace Distillery',
      tastingNotes: ['vanilla', 'caramel', 'oak', 'spice', 'brown sugar'],
      isAvailable: true,
      isPremium: false,
      isTopShelf: false,
      averageRating: 4.2,
      image: '/images/buffalo-trace-bourbon.jpg'
    });

    await buffaloTrace.save();
    console.log('✅ Added Buffalo Trace Bourbon');

    // Now update existing whiskey records with appropriate subTypes
    const whiskeyUpdates = [
      // Bourbon whiskeys
      { brand: 'Pappy Van Winkle', subType: 'Bourbon' },
      { brand: 'Blanton\'s', subType: 'Bourbon' },
      { brand: 'W.L. Weller', subType: 'Bourbon' },
      { brand: 'Michter\'s', subType: 'Bourbon' },
      { brand: 'Maker\'s Mark', subType: 'Bourbon' },
      { brand: 'Woodford Reserve', subType: 'Bourbon' },
      { brand: 'Four Roses', subType: 'Bourbon' },
      { brand: 'Wild Turkey', subType: 'Bourbon' },
      { brand: 'Jim Beam', subType: 'Bourbon' },
      { brand: 'Knob Creek', subType: 'Bourbon' },
      { brand: 'Basil Hayden', subType: 'Bourbon' },
      { brand: 'Booker\'s', subType: 'Bourbon' },
      { brand: 'Baker\'s', subType: 'Bourbon' },
      { brand: 'Elijah Craig', subType: 'Bourbon' },
      { brand: 'Henry McKenna', subType: 'Bourbon' },
      { brand: 'Old Forester', subType: 'Bourbon' },
      { brand: 'Very Old Barton', subType: 'Bourbon' },
      { brand: 'Ancient Age', subType: 'Bourbon' },
      
      // Scotch whiskeys
      { brand: 'Macallan', subType: 'Scotch Whisky' },
      { brand: 'Lagavulin', subType: 'Scotch Whisky' },
      { brand: 'Johnnie Walker', subType: 'Scotch Whisky' },
      { brand: 'Glenfiddich', subType: 'Scotch Whisky' },
      { brand: 'Glenlivet', subType: 'Scotch Whisky' },
      { brand: 'Ardbeg', subType: 'Scotch Whisky' },
      { brand: 'Laphroaig', subType: 'Scotch Whisky' },
      
      // Japanese whiskeys
      { brand: 'Yamazaki', subType: 'Japanese Whisky' },
      { brand: 'Hibiki', subType: 'Japanese Whisky' },
      { brand: 'Hakushu', subType: 'Japanese Whisky' },
      { brand: 'Nikka', subType: 'Japanese Whisky' },
      
      // Irish whiskeys
      { brand: 'Redbreast', subType: 'Irish Whiskey' },
      { brand: 'Jameson', subType: 'Irish Whiskey' },
      { brand: 'Bushmills', subType: 'Irish Whiskey' },
      { brand: 'Tullamore', subType: 'Irish Whiskey' },
      
      // Rye whiskeys
      { brand: 'Rittenhouse', subType: 'Rye Whiskey' },
      { brand: 'Sazerac', subType: 'Rye Whiskey' },
      { brand: 'High West', subType: 'Rye Whiskey' },
      
      // Tennessee whiskeys
      { brand: 'Jack Daniel\'s', subType: 'Tennessee Whiskey' },
      { brand: 'George Dickel', subType: 'Tennessee Whiskey' }
    ];

    let updatedCount = 0;
    for (const update of whiskeyUpdates) {
      const result = await Spirit.updateMany(
        { 
          type: 'Whiskey', 
          brand: { $regex: new RegExp(update.brand, 'i') },
          subType: { $exists: false } // Only update if subType is not already set
        },
        { 
          $set: { subType: update.subType } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} ${update.brand} whiskey(s) to subType: ${update.subType}`);
        updatedCount += result.modifiedCount;
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} whiskey records with subTypes`);

    // Display updated whiskey inventory
    const whiskeys = await Spirit.find({ type: 'Whiskey', isAvailable: true }).sort({ subType: 1, brand: 1 });
    
    console.log('\n=== UPDATED WHISKEY INVENTORY ===');
    const groupedBySubType = {};
    whiskeys.forEach(w => {
      const subType = w.subType || 'Unspecified';
      if (!groupedBySubType[subType]) {
        groupedBySubType[subType] = [];
      }
      groupedBySubType[subType].push(`${w.brand} ${w.name} ($${w.price})`);
    });

    Object.entries(groupedBySubType).forEach(([subType, spirits]) => {
      console.log(`\n${subType.toUpperCase()}:`);
      spirits.forEach(spirit => console.log(`  - ${spirit}`));
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

addBuffaloTraceAndUpdateSubTypes();
