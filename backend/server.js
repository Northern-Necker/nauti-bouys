const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const beverageRoutes = require('./routes/beverages');
const inventoryRoutes = require('./routes/inventory');
const reservationRoutes = require('./routes/reservations');
const iaRoutes = require('./routes/ia');
const didAgentRoutes = require('./routes/d-id-agent');
const didStreamingRoutes = require('./routes/did-streaming');

const app = express();

// Security middleware with custom CSP for images
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5173", "http://127.0.0.1:5173"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5173", "http://127.0.0.1:5173"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (increased for development)
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (images) with CORS headers and correct MIME types
app.use('/images', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.FRONTEND_URL || 'http://localhost:5173'],
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: false
}), (req, res, next) => {
  // Set correct MIME type for SVG files with .jpg extension
  if (req.path.endsWith('.jpg')) {
    // Check if the file is actually SVG content
    const filePath = path.join(__dirname, 'public/images', req.path);
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim().startsWith('<svg')) {
          res.setHeader('Content-Type', 'image/svg+xml');
        }
      }
    } catch (err) {
      console.log('Error checking file type:', err.message);
    }
  }
  next();
}, express.static(path.join(__dirname, 'public/images')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nauti-bouys', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/beverages', beverageRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/d-id-agent', didAgentRoutes);
app.use('/api/did-streaming', didStreamingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Nauti Bouys API server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
