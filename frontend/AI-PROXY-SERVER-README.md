# AI Proxy Server - Optional Enhancement

## Overview

The AI Proxy Server (`ai-proxy-server.js`) is an **optional** component that enables AI-powered features in the Autonomous Viseme Optimizer. The application works perfectly fine without it for core MediaPipe face tracking and viseme analysis.

## What It Does

When running, the proxy server enables:
- 🤖 AI-powered viseme refinement (Claude/GPT-4)
- 🎯 Intelligent phoneme mapping suggestions
- 📊 Advanced lip sync optimization
- 🔄 Real-time AI feedback on performance

## Core Features (Work Without Proxy)

These features work in standalone mode:
- ✅ MediaPipe Face Landmarker v2 tracking
- ✅ Real-time facial landmark detection
- ✅ Viseme mapping and analysis
- ✅ 3D avatar morph target control
- ✅ Performance monitoring
- ✅ Error recovery and diagnostics

## Starting the Proxy Server (Optional)

If you want to enable AI features:

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Server
```bash
node ai-proxy-server.js
```

You should see:
```
🚀 AI Proxy Server running on http://localhost:3001
📡 Endpoints available:
   - POST /openai-proxy - OpenAI API proxy
   - POST /claude-proxy - Claude API proxy
   - GET /health - Health check
```

### 3. Keep It Running
Leave the terminal open with the server running while using the application.

## API Keys (Only Needed for AI Features)

If using the proxy server, you'll need API keys:
- **OpenAI**: Get from https://platform.openai.com/api-keys
- **Claude**: Get from https://console.anthropic.com/

Enter these in the application's UI when prompted.

## Troubleshooting

### "ERR_CONNECTION_REFUSED" Error
**This is normal!** It means the proxy server isn't running. The app will work in standalone mode.

### Starting the Server
```bash
# Make sure you're in the frontend directory
cd frontend

# Check if dependencies are installed
npm list express

# If not installed, run:
npm install

# Start the server
node ai-proxy-server.js
```

### Port Already in Use
If port 3001 is busy:
1. Find the process: `lsof -i :3001` (Mac/Linux) or `netstat -ano | findstr :3001` (Windows)
2. Kill it, or edit `ai-proxy-server.js` to use a different port

### Server Crashes
Check the error message. Common issues:
- Missing dependencies: Run `npm install`
- Syntax errors: Make sure Node.js is v14+ (`node --version`)

## Status Indicators in the App

- 🟢 **Green**: Proxy server connected, AI features enabled
- 🟡 **Yellow**: Standalone mode, core features active (normal without server)
- 🔴 **Red**: Error state (check console for details)

## Running Without the Proxy Server

The application is **fully functional** without the proxy server. You can:
1. Close this README
2. Open `autonomous-viseme-optimizer.html` in your browser
3. Use all MediaPipe face tracking features immediately

The UI will show "Standalone Mode" which is perfectly fine!

## Security Notes

- The proxy server only accepts local connections (localhost)
- API keys are never stored, only held in memory during use
- All requests are logged for debugging
- CORS is enabled for local development only

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server terminal for logs
3. Try restarting both the server and browser
4. Ensure you're using a modern browser (Chrome/Edge/Firefox)

---

Remember: **The proxy server is optional!** The core MediaPipe viseme tracking works without it.