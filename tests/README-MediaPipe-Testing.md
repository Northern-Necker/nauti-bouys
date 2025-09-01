# MediaPipe Face Landmarker v2 Loading Test Suite

This comprehensive test suite identifies MediaPipe Face Landmarker v2 loading issues across different environments and provides detailed diagnostics to pinpoint exact failure points.

## 🎯 Purpose

MediaPipe Face Landmarker v2 can fail to load due to various reasons:
- Network connectivity issues
- CORS policy violations
- WASM loading failures
- GPU/WebGL incompatibilities
- Browser security restrictions
- Incorrect import methods
- Model file accessibility issues

This test suite systematically checks all these potential failure points and provides actionable recommendations.

## 📁 Files Overview

### 1. `mediapipe-loading-tests.js`
- **Purpose**: Core test suite that can run in both browser and Node.js environments
- **Features**: 
  - Tests multiple CDN sources (JSDelivr, Unpkg)
  - Validates WASM file accessibility
  - Checks model file loading
  - Detects GPU acceleration capabilities
  - Analyzes browser compatibility
- **Usage**: Can be imported as a module or run directly in browser console

### 2. `mediapipe-loading-test-runner.html`
- **Purpose**: Interactive HTML interface for running tests in browsers
- **Features**:
  - Visual progress indicators
  - Expandable test results
  - Real-time status updates
  - Export functionality for reports
  - System information display
- **Usage**: Open in any modern web browser

### 3. `mediapipe-loading-tests-node.js`
- **Purpose**: Command-line version for server environments and CI/CD
- **Features**:
  - Network accessibility testing
  - NPM package validation
  - File system checks
  - JSON and human-readable output
- **Usage**: Run with Node.js from command line

## 🚀 Quick Start

### Browser Testing

1. **Simple Console Test**:
```javascript
// Open browser console on your webpage and run:
const script = document.createElement('script');
script.src = './tests/mediapipe-loading-tests.js';
document.head.appendChild(script);
script.onload = () => {
    const testSuite = new MediaPipeLoadingTestSuite();
    testSuite.runAllTests().then(report => console.log(report));
};
```

2. **Interactive HTML Interface**:
```bash
# Open in browser
open tests/mediapipe-loading-test-runner.html
# or serve via HTTP server
python -m http.server 8000
# Then navigate to http://localhost:8000/tests/mediapipe-loading-test-runner.html
```

### Node.js Testing

```bash
# Make executable
chmod +x tests/mediapipe-loading-tests-node.js

# Run all tests
node tests/mediapipe-loading-tests-node.js

# Quick test (essential checks only)
node tests/mediapipe-loading-tests-node.js --quick

# Verbose output
node tests/mediapipe-loading-tests-node.js --verbose

# JSON output (for CI/CD)
node tests/mediapipe-loading-tests-node.js --output-json

# Combine options
node tests/mediapipe-loading-tests-node.js --verbose --output-json > test-report.json
```

## 🔍 Test Categories

### 1. CDN Import Tests
**What it tests**:
- Script loading from different CDNs
- WASM file accessibility
- Package.json validation
- Network connectivity to CDN providers

**Common Issues Detected**:
- CORS policy violations
- Network firewall blocks
- CDN service outages
- Incorrect version URLs

### 2. Model File Loading Tests
**What it tests**:
- Google Cloud Storage model accessibility
- Alternative model sources
- File integrity and headers
- Download performance

**Common Issues Detected**:
- Google Cloud Storage blocks
- Corporate proxy issues
- Model file corruption
- Network timeouts

### 3. WASM Backend Initialization Tests
**What it tests**:
- WebAssembly support
- SIMD instruction availability
- Threading capabilities
- FilesetResolver functionality

**Common Issues Detected**:
- Browser WASM support missing
- SIMD not available
- Threading blocked by security headers
- Incorrect WASM paths

### 4. GPU Acceleration Tests
**What it tests**:
- WebGL/WebGL2 support
- GPU extensions availability
- WebGPU capabilities (if available)
- Hardware acceleration status

**Common Issues Detected**:
- Hardware acceleration disabled
- Graphics driver issues
- WebGL context failures
- GPU memory limitations

### 5. Browser Compatibility Tests
**What it tests**:
- Modern JavaScript features
- Browser-specific security policies
- Cross-origin isolation
- Secure context requirements

**Common Issues Detected**:
- Outdated browser versions
- Missing ES6+ support
- Strict security policies
- HTTP vs HTTPS context issues

## 📊 Understanding Test Results

### Result Levels
- **INFO**: Normal operation, test passed
- **WARNING**: Non-critical issue that might affect performance
- **ERROR**: Critical failure that will prevent MediaPipe from loading

### Key Metrics
- **Load Time**: Time taken to load resources
- **Success Rate**: Percentage of successful resource loads
- **Error Count**: Number of critical failures
- **Recommendations**: Actionable fixes for detected issues

## 🛠️ Troubleshooting Guide

### Common Error Patterns

#### 1. CORS Errors
```
Error: Failed to fetch from CDN
Cause: Cross-Origin Resource Sharing policy violation
```
**Solutions**:
- Serve your application over HTTPS
- Configure proper CORS headers on your server
- Use a local MediaPipe installation
- Add CDN domains to your CSP policy

#### 2. WASM Loading Failures
```
Error: WebAssembly.instantiate failed
Cause: WASM file not accessible or corrupted
```
**Solutions**:
- Check network connectivity
- Verify WASM file URLs are correct
- Test with different CDN sources
- Enable WASM in browser settings

#### 3. WebGL Context Issues
```
Error: WebGL context lost
Cause: GPU acceleration unavailable
```
**Solutions**:
- Update graphics drivers
- Enable hardware acceleration in browser
- Try software rendering fallback
- Check GPU memory usage

#### 4. Model Loading Timeouts
```
Error: Model download timeout
Cause: Network congestion or firewall
```
**Solutions**:
- Increase timeout values
- Use alternative model sources
- Download models locally
- Configure proxy settings

### Environment-Specific Issues

#### Development Environment
- Use local HTTP server (not file:// protocol)
- Configure development CORS settings
- Enable browser developer flags if needed

#### Production Environment
- Implement proper CDN caching
- Configure CSP headers correctly
- Monitor MediaPipe service availability
- Set up fallback CDN sources

#### CI/CD Environment
- Use headless browser testing
- Mock MediaPipe for unit tests
- Cache MediaPipe dependencies
- Set appropriate timeouts

## 🔧 Configuration Options

### Test Suite Configuration
```javascript
const testSuite = new MediaPipeLoadingTestSuite({
    // Custom CDN sources
    cdnSources: [
        {
            name: 'Custom CDN',
            wasmPath: 'https://your-cdn.com/mediapipe/wasm',
            scriptUrl: 'https://your-cdn.com/mediapipe'
        }
    ],
    
    // Custom model sources
    modelSources: [
        'https://your-server.com/models/face_landmarker.task'
    ],
    
    // Timeout settings
    timeout: 30000, // 30 seconds
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000 // 1 second
});
```

### Browser-Specific Settings
```javascript
// Chrome
// --disable-web-security --user-data-dir=/tmp/chrome-dev --allow-running-insecure-content

// Firefox
// security.tls.insecure_fallback_hosts = localhost

// Safari
// Develop > Disable Cross-Origin Restrictions
```

## 📈 Integration with CI/CD

### GitHub Actions Example
```yaml
name: MediaPipe Loading Tests

on: [push, pull_request]

jobs:
  test-mediapipe-loading:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Run MediaPipe Loading Tests
        run: |
          node tests/mediapipe-loading-tests-node.js --output-json > mediapipe-test-report.json
          
      - name: Upload Test Report
        uses: actions/upload-artifact@v2
        with:
          name: mediapipe-test-report
          path: mediapipe-test-report.json
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('MediaPipe Tests') {
            steps {
                sh 'node tests/mediapipe-loading-tests-node.js --verbose'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'mediapipe-test-report.json', allowEmptyArchive: true
                }
            }
        }
    }
}
```

## 🎯 Best Practices

### Development
1. **Run tests early**: Include in pre-commit hooks
2. **Test multiple browsers**: Use Selenium or Playwright for automation
3. **Monitor CDN availability**: Set up alerts for MediaPipe service status
4. **Cache resources**: Implement proper caching strategies

### Production
1. **Use CDN fallbacks**: Configure multiple CDN sources
2. **Implement retry logic**: Handle transient failures gracefully
3. **Monitor performance**: Track MediaPipe loading metrics
4. **Update regularly**: Keep MediaPipe versions current

### Debugging
1. **Enable verbose logging**: Use detailed error messages
2. **Check browser console**: Look for specific error patterns
3. **Test network connectivity**: Verify DNS resolution and routing
4. **Validate resources**: Ensure files are accessible and uncorrupted

## 🔗 Additional Resources

- [MediaPipe Documentation](https://developers.google.com/mediapipe)
- [MediaPipe NPM Package](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- [WebAssembly Browser Support](https://caniuse.com/wasm)
- [WebGL Compatibility](https://caniuse.com/webgl)

## 📞 Support

If you encounter issues not covered by this test suite:

1. **Check the error logs**: Look for specific error patterns
2. **Review recommendations**: Follow suggested solutions
3. **Test in isolation**: Use minimal test cases
4. **Update dependencies**: Ensure latest MediaPipe versions
5. **Report issues**: Submit detailed bug reports with test results

---

*This test suite is designed to be comprehensive and should catch most MediaPipe loading issues. Regular use will help maintain a stable MediaPipe integration.*