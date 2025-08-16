const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const finalImageVerification = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    const spirits = await Spirit.find({ isAvailable: true });
    const beveragesDir = path.join(__dirname, 'public', 'images', 'beverages');
    
    console.log('=== FINAL SPIRIT IMAGE VERIFICATION ===');
    console.log(`Checking ${spirits.length} spirits...`);
    
    let allHaveImages = true;
    let correctImages = 0;
    let missingImages = 0;
    
    spirits.forEach(spirit => {
      const spiritName = `${spirit.brand} ${spirit.name}`;
      
      if (!spirit.image) {
        console.log(`❌ ${spiritName} -> NO IMAGE PATH`);
        allHaveImages = false;
        missingImages++;
        return;
      }
      
      // Extract filename from image path
      const imagePath = spirit.image.replace('/images/beverages/', '');
      const fullPath = path.join(beveragesDir, imagePath);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        console.log(`✅ ${spiritName} -> ${imagePath}`);
        correctImages++;
      } else {
        console.log(`❌ ${spiritName} -> ${spirit.image} (FILE NOT FOUND)`);
        allHaveImages = false;
        missingImages++;
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Spirits: ${spirits.length}`);
    console.log(`With Correct Images: ${correctImages}`);
    console.log(`Missing/Broken Images: ${missingImages}`);
    console.log(`Success Rate: ${Math.round((correctImages / spirits.length) * 100)}%`);
    console.log(`All spirits have images: ${allHaveImages ? '✅ YES' : '❌ NO'}`);
    
    if (allHaveImages) {
      console.log('\n🎉 SUCCESS! All spirits have proper images in the correct directory!');
      console.log('📁 Images are located in: backend/public/images/beverages/');
      console.log('🔗 Database paths point to: /images/beverages/');
      console.log('🚀 Ready for production use!');
    } else {
      console.log('\n⚠️  Some spirits still need attention.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

finalImageVerification();
