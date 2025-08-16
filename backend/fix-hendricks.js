const mongoose = require('mongoose');
const Spirit = require('./models/Spirit');
require('dotenv').config();

const fixHendricks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    const result = await Spirit.updateOne(
      { brand: 'Hendrick\'s' },
      { $set: { image: '/images/beverages/hendrick-s-gin-spirit.jpg' } }
    );

    console.log('Updated Hendrick\'s Gin:', result.modifiedCount > 0 ? 'Success ✅' : 'Not found ❌');

    // Verify the update
    const hendricks = await Spirit.findOne({ brand: 'Hendrick\'s' });
    if (hendricks) {
      console.log(`Hendrick's Gin image: ${hendricks.image}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixHendricks();
