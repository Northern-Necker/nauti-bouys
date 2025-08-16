# Nauti-Bouys 🛥️🥃

A sophisticated maritime-themed bar management system with AI-powered bartending assistance, featuring D-ID avatar integration for interactive customer experiences.

## 🌊 Overview

Nauti-Bouys is a comprehensive bar management platform that combines inventory management, reservation systems, and AI-powered bartending recommendations with immersive D-ID avatar interactions. Perfect for nautical-themed establishments looking to provide cutting-edge customer experiences.

## ✨ Features

### 🤖 AI-Powered Bartending
- **D-ID Avatar Integration**: Interactive AI bartender with realistic avatar animations
- **Smart Recommendations**: Personalized drink suggestions based on preferences
- **Real-time Streaming**: Live avatar responses using D-ID's streaming technology
- **Enhanced IA System**: Advanced conversational AI for customer interactions

### 📊 Inventory Management
- **Comprehensive Beverage Database**: Spirits, wines, beers, cocktails, and mocktails
- **Smart Image Management**: Automated image verification and organization
- **Real-time Stock Tracking**: Monitor inventory levels and usage patterns
- **Supplier Integration**: Streamlined ordering and restocking processes

### 📅 Reservation System
- **Calendar Integration**: Seamless booking management
- **Customer Profiles**: Track preferences and visit history
- **Automated Notifications**: Booking confirmations and reminders
- **Capacity Management**: Optimize seating and service flow

### 🎨 Modern Frontend
- **React + Vite**: Fast, modern development stack
- **Tailwind CSS**: Beautiful, responsive design
- **Mobile-First**: Optimized for all device sizes
- **Real-time Updates**: Live data synchronization

## 🏗️ Architecture

```
nauti-bouys/
├── frontend/          # React frontend application
├── backend/           # Node.js/Express API server
├── docs/             # Documentation and guides
├── tests/            # Comprehensive test suites
└── scripts/          # Utility and deployment scripts
```

### Frontend Stack
- **React 18** with Hooks and Context API
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Vitest** for testing

### Backend Stack
- **Node.js** with Express framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **D-ID API** integration
- **RESTful API** design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance
- D-ID API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nauti-bouys.git
   cd nauti-bouys
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install backend dependencies
   cd ../backend && npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend environment
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

4. **Start Development Servers**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm run dev
   ```

## 🔧 Configuration

### D-ID Integration
Configure your D-ID credentials in `backend/.env`:
```env
DID_API_KEY=your_did_api_key
DID_API_URL=https://api.d-id.com
```

### Database Setup
Configure MongoDB connection:
```env
MONGODB_URI=mongodb://localhost:27017/nauti-bouys
```

## 📱 D-ID Avatar Features

- **Streaming Conversations**: Real-time avatar responses
- **Custom Avatars**: Savannah, the nautical bartender
- **Lip Sync Technology**: Natural speech animation
- **Interactive Chat**: Voice and text interactions
- **Emotion Recognition**: Context-aware responses

## 🧪 Testing

The project includes comprehensive testing suites:

```bash
# Run all tests
npm test

# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# E2E tests
npm run test:e2e
```

## 📚 Documentation

- [D-ID Integration Guide](docs/D-ID-AGENT-SETUP-GUIDE.md)
- [API Documentation](docs/D-ID-AGENT-API-IMPLEMENTATION.md)
- [Enhanced IA Implementation](docs/ENHANCED_IA_IMPLEMENTATION.md)
- [Navigation Test Plan](docs/NAVIGATION_TEST_PLAN.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **D-ID** for avatar technology
- **OpenAI** for AI capabilities
- **MongoDB** for database solutions
- **Vercel** for deployment platform

## 🚢 Set Sail with Nauti-Bouys!

Transform your bar into a cutting-edge maritime experience with AI-powered service and immersive customer interactions.

---

*Built with ❤️ for the maritime hospitality industry*
