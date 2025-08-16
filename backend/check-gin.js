const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
require('dotenv').config();

const checkGin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    const gins = await Spirit.find({ 
      isAvailable: true, 
      type: { $regex: /gin/i } 
    });

    console.log('\n=== GINS FOUND ===');
    console.log('Count:', gins.length);
    gins.forEach(g => {
      console.log(`- ${g.brand} ${g.name} (${g.type}) - $${g.price}`);
    });

    // Also check all spirits to see what types we have
    const allSpirits = await Spirit.find({ isAvailable: true });
    console.log('\n=== ALL SPIRIT TYPES ===');
    const types = [...new Set(allSpirits.map(s => s.type))];
    types.forEach(type => console.log(`- ${type}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkGin();
