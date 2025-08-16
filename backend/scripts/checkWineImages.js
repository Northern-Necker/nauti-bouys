const mongoose = require('mongoose');
const Wine = require('../models/Wine');
require('dotenv').config();

async function checkWineImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');
    
    const wines = await Wine.find({}, 'name image').limit(10);
    console.log('\nWine image paths:');
    wines.forEach(wine => {
      console.log(`${wine.name}: ${wine.image || 'NO IMAGE'}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWineImages();
