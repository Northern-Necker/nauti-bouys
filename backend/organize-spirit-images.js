const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const organizeSpiritImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    const imagesDir = path.join(__dirname, 'public', 'images');
    const beveragesDir = path.join(__dirname, 'public', 'images', 'beverages');

    // Get all image files from both directories
    const mainImages = fs.readdirSync(imagesDir).filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    const beverageImages = fs.readdirSync(beveragesDir).filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    console.log(`Found ${mainImages.length} images in /images/`);
    console.log(`Found ${beverageImages.length} images in /images/beverages/`);

    // Move spirit images from /images/ to /images/beverages/ if they don't exist there
    let movedCount = 0;
    for (const imageFile of mainImages) {
      const sourcePath = path.join(imagesDir, imageFile);
      const destPath = path.join(beveragesDir, imageFile);
      
      // Check if this is a spirit image and doesn't exist in beverages directory
      if (!fs.existsSync(destPath)) {
        try {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`📁 Copied ${imageFile} to beverages directory`);
          movedCount++;
        } catch (error) {
          console.error(`❌ Failed to copy ${imageFile}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Copied ${movedCount} images to beverages directory`);

    // Now get all spirits and ensure they have correct image paths
    const spirits = await Spirit.find({ isAvailable: true });
    console.log(`\n=== UPDATING ${spirits.length} SPIRIT IMAGE PATHS ===`);

    let updatedCount = 0;
    for (const spirit of spirits) {
      const spiritName = `${spirit.brand} ${spirit.name}`;
      
      // Generate expected image filename
      const brandSlug = spirit.brand.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const nameSlug = spirit.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const expectedFilename = `${brandSlug}-${nameSlug}-spirit.jpg`;
      const expectedPath = `/images/beverages/${expectedFilename}`;
      
      // Check if the expected image file exists
      const fullImagePath = path.join(beveragesDir, expectedFilename);
      
      if (fs.existsSync(fullImagePath)) {
        // Update the spirit's image path if it's different
        if (spirit.image !== expectedPath) {
          await Spirit.updateOne(
            { _id: spirit._id },
            { $set: { image: expectedPath } }
          );
          console.log(`✅ Updated ${spiritName} -> ${expectedPath}`);
          updatedCount++;
        } else {
          console.log(`✓ ${spiritName} already has correct path`);
        }
      } else {
        // Try to find a matching image with different naming
        const possibleMatches = beverageImages.filter(img => {
          const imgLower = img.toLowerCase();
          return imgLower.includes(brandSlug) || 
                 imgLower.includes(nameSlug) ||
                 imgLower.includes(spirit.type.toLowerCase());
        });

        if (possibleMatches.length > 0) {
          const matchedImage = possibleMatches[0];
          const matchedPath = `/images/beverages/${matchedImage}`;
          
          await Spirit.updateOne(
            { _id: spirit._id },
            { $set: { image: matchedPath } }
          );
          console.log(`🔍 Matched ${spiritName} -> ${matchedPath}`);
          updatedCount++;
        } else {
          console.log(`⚠️  No image found for ${spiritName}`);
        }
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} spirit image paths`);

    // Final verification
    const updatedSpirits = await Spirit.find({ isAvailable: true });
    const spiritsWithImages = updatedSpirits.filter(s => s.image && s.image !== null);
    const spiritsWithoutImages = updatedSpirits.filter(s => !s.image || s.image === null);

    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Total Spirits: ${updatedSpirits.length}`);
    console.log(`With Images: ${spiritsWithImages.length}`);
    console.log(`Without Images: ${spiritsWithoutImages.length}`);
    console.log(`Success Rate: ${Math.round((spiritsWithImages.length / updatedSpirits.length) * 100)}%`);

    if (spiritsWithoutImages.length > 0) {
      console.log('\nSpirits still needing images:');
      spiritsWithoutImages.forEach(s => {
        console.log(`  - ${s.brand} ${s.name} (${s.type}${s.subType ? ` - ${s.subType}` : ''})`);
      });
    }

    // Show some examples of correctly mapped spirits
    console.log('\n=== CORRECTLY MAPPED SPIRITS (Sample) ===');
    spiritsWithImages.slice(0, 10).forEach(s => {
      console.log(`✅ ${s.brand} ${s.name} -> ${s.image}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

organizeSpiritImages();
