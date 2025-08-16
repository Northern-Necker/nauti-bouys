const mongoose = require('mongoose');
const Cocktail = require('../models/Cocktail');
require('dotenv').config();

async function checkCocktailCount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    
    const count = await Cocktail.countDocuments();
    console.log('Total cocktails in database:', count);
    
    const cocktails = await Cocktail.find({}).select('name');
    console.log('\nCocktail names:');
    cocktails.forEach((c, i) => {
      console.log(`${i+1}. ${c.name}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCocktailCount();
