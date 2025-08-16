const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
require('dotenv').config();

const checkBourbons = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    const bourbons = await Spirit.find({ 
      type: { $regex: /bourbon/i }, 
      isAvailable: true 
    });

    console.log('\n=== AVAILABLE BOURBONS ===');
    if (bourbons.length === 0) {
      console.log('No bourbons found in database!');
    } else {
      bourbons.forEach(b => {
        console.log(`- ${b.brand} ${b.name} ($${b.price})`);
        console.log(`  Type: ${b.type}, Age: ${b.age || 'N/A'}, Origin: ${b.origin || 'N/A'}`);
      });
    }

    // Also check all spirits to see what types we have
    const allSpirits = await Spirit.find({ isAvailable: true }).limit(10);
    console.log('\n=== SAMPLE SPIRITS IN DATABASE ===');
    allSpirits.forEach(s => {
      console.log(`- ${s.brand} ${s.name} (${s.type}) - $${s.price}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkBourbons();
