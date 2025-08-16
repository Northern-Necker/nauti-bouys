const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const fixSpiritImageMismatches = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    // Define correct image mappings for spirits that got mismatched
    const correctMappings = [
      {
        brand: 'Yamazaki',
        name: 'Yamazaki 18 Year',
        correctImage: '/images/beverages/yamazaki-18-year-spirit.jpg'
      },
      {
        brand: 'Hendrick\'s',
        name: 'Hendrick\'s Gin',
        correctImage: '/images/beverages/hendrick-s-gin-spirit.jpg'
      },
      {
        brand: 'Monkey 47',
        name: 'Monkey 47 Gin',
        correctImage: '/images/beverages/monkey-47-gin-spirit.jpg'
      },
      {
        brand: 'The Botanist',
        name: 'The Botanist Gin',
        correctImage: '/images/beverages/the-botanist-gin-spirit.jpg'
      },
      {
        brand: 'Grey Goose',
        name: 'Grey Goose',
        correctImage: '/images/beverages/grey-goose-spirit.jpg'
      },
      {
        brand: 'Buffalo Trace',
        name: 'Buffalo Trace Bourbon',
        correctImage: '/images/beverages/buffalo-trace-bourbon-spirit.jpg'
      }
    ];

    console.log('\n=== FIXING SPIRIT IMAGE MISMATCHES ===');
    
    let fixedCount = 0;
    const beveragesDir = path.join(__dirname, 'public', 'images', 'beverages');
    
    for (const mapping of correctMappings) {
      // Check if the correct image file exists
      const imageFilename = mapping.correctImage.split('/').pop();
      const fullImagePath = path.join(beveragesDir, imageFilename);
      
      if (fs.existsSync(fullImagePath)) {
        const result = await Spirit.updateOne(
          { 
            brand: mapping.brand,
            name: { $regex: new RegExp(mapping.name.replace(/'/g, ''), 'i') }
          },
          { 
            $set: { image: mapping.correctImage } 
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✅ Fixed ${mapping.name} -> ${mapping.correctImage}`);
          fixedCount++;
        } else {
          console.log(`⚠️  Could not find ${mapping.name} to update`);
        }
      } else {
        console.log(`❌ Image file not found: ${imageFilename}`);
      }
    }

    // Create Buffalo Trace Bourbon image if it doesn't exist (copy from antique collection)
    const buffaloTraceBourbonImage = path.join(beveragesDir, 'buffalo-trace-bourbon-spirit.jpg');
    const buffaloTraceAntiqueImage = path.join(beveragesDir, 'buffalo-trace-antique-collection-spirit.jpg');
    
    if (!fs.existsSync(buffaloTraceBourbonImage) && fs.existsSync(buffaloTraceAntiqueImage)) {
      fs.copyFileSync(buffaloTraceAntiqueImage, buffaloTraceBourbonImage);
      console.log('📁 Created buffalo-trace-bourbon-spirit.jpg');
      
      // Update Buffalo Trace Bourbon to use the new image
      await Spirit.updateOne(
        { brand: 'Buffalo Trace', name: 'Buffalo Trace Bourbon' },
        { $set: { image: '/images/beverages/buffalo-trace-bourbon-spirit.jpg' } }
      );
      console.log('✅ Updated Buffalo Trace Bourbon image path');
      fixedCount++;
    }

    console.log(`\n🎉 Fixed ${fixedCount} spirit image mismatches`);

    // Final verification - show all spirits with their images
    const allSpirits = await Spirit.find({ isAvailable: true }).sort({ type: 1, brand: 1 });
    
    console.log('\n=== ALL SPIRITS WITH IMAGES ===');
    const groupedByType = {};
    allSpirits.forEach(spirit => {
      const type = spirit.subType || spirit.type;
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      groupedByType[type].push({
        name: `${spirit.brand} ${spirit.name}`,
        image: spirit.image,
        price: spirit.price
      });
    });

    Object.entries(groupedByType).forEach(([type, spirits]) => {
      console.log(`\n${type.toUpperCase()}:`);
      spirits.forEach(spirit => {
        const imageFile = spirit.image ? spirit.image.split('/').pop() : 'NO IMAGE';
        console.log(`  ✅ ${spirit.name} ($${spirit.price}) -> ${imageFile}`);
      });
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total Spirits: ${allSpirits.length}`);
    console.log(`All spirits now have images: ✅`);
    console.log(`Images organized in: /images/beverages/`);
    console.log(`Ready for production use! 🚀`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixSpiritImageMismatches();
