const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const checkAllSpiritImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    // Get all spirits
    const spirits = await Spirit.find({ isAvailable: true });
    console.log(`\n=== CHECKING ${spirits.length} SPIRITS FOR IMAGES ===`);

    // Check what images exist in the public/images directory
    const imagesDir = path.join(__dirname, 'public', 'images');
    const existingImages = fs.readdirSync(imagesDir).filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    console.log(`\nFound ${existingImages.length} image files in public/images/:`);
    existingImages.forEach(img => console.log(`  - ${img}`));

    // Check each spirit
    const spiritsWithoutImages = [];
    const spiritsWithImages = [];
    const spiritsWithMissingFiles = [];

    spirits.forEach(spirit => {
      const spiritName = `${spirit.brand} ${spirit.name}`;
      
      if (!spirit.image || spirit.image === null) {
        spiritsWithoutImages.push({
          name: spiritName,
          brand: spirit.brand,
          type: spirit.type,
          subType: spirit.subType,
          id: spirit._id
        });
      } else {
        // Check if the image file actually exists
        const imagePath = spirit.image.replace('/images/', '');
        const imageExists = existingImages.some(img => 
          img.toLowerCase().includes(spirit.brand.toLowerCase().replace(/[^a-z0-9]/g, '-')) ||
          img.toLowerCase().includes(spirit.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))
        );

        if (imageExists) {
          spiritsWithImages.push({
            name: spiritName,
            image: spirit.image,
            actualFile: existingImages.find(img => 
              img.toLowerCase().includes(spirit.brand.toLowerCase().replace(/[^a-z0-9]/g, '-')) ||
              img.toLowerCase().includes(spirit.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))
            )
          });
        } else {
          spiritsWithMissingFiles.push({
            name: spiritName,
            image: spirit.image,
            brand: spirit.brand,
            type: spirit.type,
            subType: spirit.subType
          });
        }
      }
    });

    console.log(`\n=== SPIRITS WITH IMAGES (${spiritsWithImages.length}) ===`);
    spiritsWithImages.forEach(s => {
      console.log(`✅ ${s.name} -> ${s.actualFile}`);
    });

    console.log(`\n=== SPIRITS WITHOUT IMAGE FIELD (${spiritsWithoutImages.length}) ===`);
    spiritsWithoutImages.forEach(s => {
      console.log(`❌ ${s.name} (${s.type}${s.subType ? ` - ${s.subType}` : ''})`);
    });

    console.log(`\n=== SPIRITS WITH MISSING IMAGE FILES (${spiritsWithMissingFiles.length}) ===`);
    spiritsWithMissingFiles.forEach(s => {
      console.log(`⚠️  ${s.name} -> ${s.image} (file not found)`);
    });

    // Generate suggested image mappings
    console.log(`\n=== SUGGESTED IMAGE MAPPINGS ===`);
    const allSpiritsNeedingImages = [...spiritsWithoutImages, ...spiritsWithMissingFiles];
    
    allSpiritsNeedingImages.forEach(spirit => {
      // Try to find a matching image file
      const brandSlug = spirit.brand.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const nameSlug = spirit.name ? spirit.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : '';
      
      const matchingImage = existingImages.find(img => {
        const imgLower = img.toLowerCase();
        return imgLower.includes(brandSlug) || 
               (nameSlug && imgLower.includes(nameSlug)) ||
               imgLower.includes(spirit.type.toLowerCase());
      });

      if (matchingImage) {
        console.log(`📸 ${spirit.name} -> /images/${matchingImage}`);
      } else {
        console.log(`🔍 ${spirit.name} -> NEEDS NEW IMAGE (${spirit.type}${spirit.subType ? ` - ${spirit.subType}` : ''})`);
      }
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total Spirits: ${spirits.length}`);
    console.log(`With Images: ${spiritsWithImages.length}`);
    console.log(`Without Images: ${spiritsWithoutImages.length}`);
    console.log(`Missing Files: ${spiritsWithMissingFiles.length}`);
    console.log(`Need Attention: ${allSpiritsNeedingImages.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkAllSpiritImages();
