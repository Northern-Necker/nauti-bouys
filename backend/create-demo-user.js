const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const createDemoUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys');
    console.log('Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@nautibouys.com' });
    if (existingUser) {
      console.log('Demo user already exists!');
      console.log('Email: demo@nautibouys.com');
      console.log('Password: demo123');
      process.exit(0);
    }

    // Create demo user
    const demoUser = new User({
      fullName: 'Demo User',
      email: 'demo@nautibouys.com',
      password: 'demo123',
      mobileNumber: '+1-555-123-4567',
      role: 'Patron',
      isActive: true
    });

    await demoUser.save();
    console.log('✅ Demo user created successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('Email: demo@nautibouys.com');
    console.log('Password: demo123');
    console.log('');
    console.log('🚀 You can now test the D-ID Agent API at: http://localhost:5173/login');

  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createDemoUser();
