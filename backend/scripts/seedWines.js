const mongoose = require('mongoose');
const { seedWines } = require('../seeds/wines');
require('dotenv').config();

const runWineSeeding = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('📦 Connected to MongoDB');

    // Seed wines
    await seedWines();

    console.log('🍷 Wine seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Wine seeding failed:', error);
    process.exit(1);
  }
};

runWineSeeding();
