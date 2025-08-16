const mongoose = require('mongoose');
const Cocktail = require('../models/Cocktail');
require('dotenv').config();

async function checkImagePaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    
    const cocktails = await Cocktail.find({
      name: { $in: ['Classic Martini', 'Paper Plane', 'Negroni', 'Mojito'] }
    }).select('name image');
    
    console.log('Cocktail image paths:');
    cocktails.forEach(c => {
      console.log(`${c.name}: ${c.image}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkImagePaths();
