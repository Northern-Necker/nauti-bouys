const mongoose = require('mongoose');
const Spirit = require('../models/Spirit');
const spirits = require('../seeds/spirits');
require('dotenv').config();

const seedSpirits = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing spirits
    await Spirit.deleteMany({});
    console.log('🗑️  Cleared existing spirits');

    // Insert new spirits
    const insertedSpirits = await Spirit.insertMany(spirits);
    console.log(`🥃 Successfully seeded ${insertedSpirits.length} spirits`);

    // Display summary
    const spiritTypes = {};
    insertedSpirits.forEach(spirit => {
      spiritTypes[spirit.spiritType] = (spiritTypes[spirit.spiritType] || 0) + 1;
    });

    console.log('\n📊 Spirit Collection Summary:');
    Object.entries(spiritTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} bottles`);
    });

    console.log('\n🏆 Rare & Special Bottles:');
    const rareSpirits = insertedSpirits.filter(s => s.rarity === 'rare' || s.specialty);
    rareSpirits.forEach(spirit => {
      console.log(`   • ${spirit.name} (${spirit.spiritType}) - ${spirit.rarity || 'specialty'}`);
    });

    console.log('\n✨ Spirits seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding spirits:', error);
    process.exit(1);
  }
};

seedSpirits();
