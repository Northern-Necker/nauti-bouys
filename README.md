# Nauti-Bouys D-ID Avatar Integration

A React frontend application integrating D-ID avatar technology with the Nauti-Bouys Bar AI Assistant, featuring real-time lip-sync animations and intelligent bartender interactions.

## 🚀 Features

### D-ID Avatar Integration
- **Real-time Lip-Sync**: Advanced lip-sync animation using D-ID's streaming API
- **Multiple Voice Options**: Support for various voice models and languages
- **WebSocket Streaming**: Real-time communication for seamless interactions
- **Performance Monitoring**: Built-in metrics tracking and performance analysis
- **Error Handling**: Robust error handling with fallback mechanisms
- **Cross-browser Compatibility**: Works across modern browsers

### Nauti-Bouys AI Integration
- **AI Bartender Assistant**: Intelligent responses using OpenAI ChatGPT
- **Beverage Recommendations**: Personalized drink suggestions based on preferences
- **Menu Integration**: Real-time access to bar menu and inventory
- **User Authentication**: JWT-based authentication with role management
- **Conversation History**: Persistent chat history across sessions
- **Reservation System**: AI-powered reservation management

### React Components
- **DidAvatar**: Main avatar component with full feature set
- **AvatarControls**: Control panel for avatar management
- **AvatarStatus**: Real-time status monitoring and metrics
- **ChatInterface**: Interactive chat interface with queue management
- **IntelligentAssistantPage**: Complete integration page
- **DemoPage**: Feature demonstration and testing interface

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn package manager
- D-ID API key (from [D-ID Platform](https://www.d-id.com/))
- OpenAI API key (optional, for AI features)
- AWS credentials (for facial recognition features)

## 🛠️ Installation

1. **Clone and Setup**
   ```bash
   cd nauti-bouys-frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your API keys:
   ```env
   # D-ID Configuration
   VITE_DID_API_KEY=your_did_api_key_here
   VITE_DID_BASE_URL=https://api.d-id.com
   
   # Backend API
   VITE_API_BASE_URL=http://localhost:5000/api
   
   # Optional: OpenAI & AWS keys for full features
   VITE_OPENAI_API_KEY=your_openai_key_here
   VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
   VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```
   
   Application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── d-id/                    # D-ID specific components
│   │   ├── DidAvatar.jsx       # Main avatar component
│   │   ├── AvatarControls.jsx  # Control interface
│   │   ├── AvatarStatus.jsx    # Status monitoring
│   │   └── ChatInterface.jsx   # Chat interface
│   ├── IntelligentAssistantPage.jsx  # Main integration page
│   └── DemoPage.jsx            # Demo and testing page
├── services/
│   ├── d-id/                   # D-ID service layer
│   │   ├── DidApiService.js    # API abstraction
│   │   └── DidAvatarService.js # Avatar management
│   └── NautiBouysIntegration.js # Backend integration
├── hooks/
│   └── d-id/                   # React hooks for D-ID
│       ├── useDidAvatar.js     # Avatar state management
│       ├── useDidWebSocket.js  # WebSocket connections
│       └── useDidLipSync.js    # Lip-sync functionality
└── utils/
    └── d-id/                   # Utility functions
```

## 🎯 Usage Examples

### Basic Avatar Integration

```jsx
import DidAvatar from './components/d-id/DidAvatar';

function MyComponent() {
  const avatarConfig = {
    sourceUrl: 'https://your-avatar-image.jpg',
    voiceId: 'en-US-JennyNeural',
    name: 'My Assistant'
  };

  const handleMessageSent = ({ message, result }) => {
    console.log('Message sent:', message, result);
  };

  return (
    <DidAvatar
      config={avatarConfig}
      onMessageSent={handleMessageSent}
      showControls={true}
      showChat={true}
      autoInitialize={true}
      theme="teal"
    />
  );
}
```

### Using React Hooks

```jsx
import { useDidLipSync } from './hooks/d-id/useDidLipSync';

function CustomAvatarComponent() {
  const lipSync = useDidLipSync({
    sourceUrl: 'https://your-avatar-image.jpg',
    voiceId: 'en-US-JennyNeural'
  });

  const handleSpeak = async () => {
    if (lipSync.canSpeak) {
      await lipSync.speakWithLipSync('Hello! Welcome to our bar.');
    }
  };

  return (
    <div>
      <video ref={lipSync.videoElementRef} autoPlay />
      <button onClick={handleSpeak} disabled={!lipSync.canSpeak}>
        Speak
      </button>
      <p>Status: {lipSync.isReady ? 'Ready' : 'Not Ready'}</p>
    </div>
  );
}
```

### Nauti-Bouys Integration

```jsx
import nautiBouysIntegration from './services/NautiBouysIntegration';

// Initialize with authentication
nautiBouysIntegration.initialize(authToken, userData);

// Send message to AI and get response
const aiResponse = await nautiBouysIntegration.sendToAI(
  "What cocktails do you recommend?"
);

// Get beverage recommendations
const recommendations = await nautiBouysIntegration.getRecommendations({
  type: 'cocktail',
  limit: 5
});
```

## 🔧 Configuration Options

### Avatar Configuration
```javascript
const avatarConfig = {
  sourceUrl: 'string',        // Avatar image URL
  voiceId: 'string',          // Voice model ID
  name: 'string',             // Avatar name
  personality: 'string',       // Personality description
  customConfig: {             // D-ID specific settings
    stitch: true,
    fluent: true,
    pad_audio: 0
  }
};
```

### Component Props
```javascript
<DidAvatar
  config={avatarConfig}         // Avatar configuration
  onMessageSent={function}      // Message sent callback
  onError={function}           // Error callback
  onStatusChange={function}    // Status change callback
  className="string"           // CSS classes
  showControls={boolean}       // Show control panel
  showChat={boolean}          // Show chat interface
  autoInitialize={boolean}     // Auto-initialize on mount
  theme="teal|navy|gray"      // Theme selection
/>
```

## 📊 Performance Monitoring

The integration includes comprehensive performance monitoring:

- **Latency Tracking**: Real-time response time measurement
- **Frame Accuracy**: Lip-sync accuracy monitoring
- **Error Rates**: API success/failure tracking
- **Resource Usage**: Memory and processing metrics
- **Connection Health**: WebSocket and API connectivity status

Access metrics through:
```javascript
const metrics = didAvatarService.getMetrics();
console.log('Performance metrics:', metrics);
```

## 🧪 Testing

### Demo Page
Visit `/demo` to test different avatar configurations and features:
- Basic avatar functionality
- Bartender-specific setup
- Minimal integration
- Custom voice testing

### Test Commands
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### Common Issues

1. **Avatar not initializing**
   - Check D-ID API key in `.env`
   - Verify internet connection
   - Check browser console for errors

2. **Lip-sync not working**
   - Ensure WebSocket connections are established
   - Check browser permissions for media playback
   - Verify D-ID streaming session is active

3. **AI responses not working**
   - Check backend API connection
   - Verify authentication token
   - Check OpenAI API key configuration

4. **Performance issues**
   - Monitor network requests in browser dev tools
   - Check avatar metrics for bottlenecks
   - Ensure proper cleanup of resources

### Debug Mode
Enable debug mode for detailed logging:
```env
VITE_DEBUG_MODE=true
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment-specific Builds
```bash
# Development
npm run build:dev

# Staging
npm run build:staging

# Production
npm run build:prod
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📚 API Reference

### D-ID Service Methods
- `initializeAvatar(config)`: Initialize avatar with configuration
- `createStreamingSession(avatarId)`: Create real-time streaming session
- `sendMessage(sessionId, message, options)`: Send message with lip-sync
- `closeSession(sessionId)`: Close streaming session
- `getMetrics()`: Get performance metrics

### Integration Service Methods
- `initialize(token, user)`: Initialize with authentication
- `sendToAI(message, context)`: Send message to AI assistant
- `getRecommendations(criteria)`: Get beverage recommendations
- `searchBeverages(query, filters)`: Search beverage database
- `createReservation(data)`: Create new reservation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [D-ID](https://www.d-id.com/) for avatar technology
- [OpenAI](https://openai.com/) for AI assistant capabilities
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for build tooling

## 📞 Support

For support, please contact:
- Email: support@nauti-bouys.com
- Documentation: [GitHub Wiki](https://github.com/your-repo/wiki)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)