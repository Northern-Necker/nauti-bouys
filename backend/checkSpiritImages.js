const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys')
  .then(async () => {
    const Spirit = require('./models/Spirit');
    const spirits = await Spirit.find({}).limit(5);
    console.log('First 5 spirits with their image fields:');
    spirits.forEach(spirit => {
      console.log(`Name: ${spirit.name}, Image: ${spirit.image}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
