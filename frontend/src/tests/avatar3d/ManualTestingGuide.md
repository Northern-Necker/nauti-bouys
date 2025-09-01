# GLB Avatar Manual Testing Guide

## Overview
This guide provides comprehensive manual testing procedures for validating GLB avatar functionality, focusing on the specific issues identified in the swarm analysis.

## Critical Issues to Test

### 1. ReferenceError Bug (Line 55 in InteractiveAvatar.jsx)
**Issue**: `box` variable is referenced before declaration
**Location**: InteractiveAvatar.jsx, line 55
**Fix**: Move `box` declaration to line 54 (before usage)

#### Manual Test Steps:
1. Open browser dev tools console
2. Navigate to any page with InteractiveAvatar component
3. **Expected**: Console shows ReferenceError
4. **After Fix**: No ReferenceError, avatar renders properly

### 2. GLB Model Loading and Visibility

#### Test Case: Basic GLB Loading
```
Test ID: GLB-001
Objective: Verify GLB model loads without errors
Steps:
  1. Navigate to /avatar3d-test or /glb-test-page
  2. Open browser dev tools Network tab
  3. Refresh page
  4. Observe GLB file request (SavannahAvatar.glb - 13.8MB)
  5. Check console for loading messages

Expected Results:
  ✓ GLB file loads successfully (HTTP 200)
  ✓ Console shows "GLB model loaded successfully"
  ✓ No error messages in console
  ✓ Avatar is visible on screen

Failure Indicators:
  ✗ Console shows ReferenceError
  ✗ GLB file fails to load (HTTP 404/500)
  ✗ Avatar not visible
  ✗ Infinite loading spinner
```

#### Test Case: GLB Visibility and Scaling
```
Test ID: GLB-002
Objective: Confirm avatar is properly scaled and visible
Steps:
  1. Load GLB test page
  2. Wait for avatar to appear
  3. Check avatar size relative to viewport
  4. Verify all avatar parts are visible
  5. Check for proper centering

Expected Results:
  ✓ Avatar fits within viewport
  ✓ Avatar is properly centered
  ✓ All mesh parts visible
  ✓ No clipping or culling issues
  ✓ Scale factor applied correctly (target height 1.8)

Visual Validation Checklist:
  □ Head/face visible
  □ Body/torso visible  
  □ Arms/hands visible
  □ Proper proportions
  □ No missing textures
```

### 3. Performance Testing (13.8MB File)

#### Test Case: Loading Performance
```
Test ID: PERF-001
Objective: Validate performance with large GLB file
Tools: Browser dev tools Performance tab
Steps:
  1. Clear browser cache
  2. Open Performance tab in dev tools
  3. Start recording
  4. Navigate to avatar page
  5. Wait for complete loading
  6. Stop recording after 30 seconds

Performance Thresholds:
  ✓ Initial load: < 5 seconds
  ✓ Time to first render: < 2 seconds
  ✓ Memory usage: < 100MB increase
  ✓ Frame rate: > 30fps steady state
  ✓ No memory leaks over time

Red Flags:
  ✗ Loading timeout (> 10 seconds)
  ✗ Memory usage > 200MB
  ✗ Frame rate drops < 15fps
  ✗ Browser becomes unresponsive
```

#### Test Case: Runtime Performance
```
Test ID: PERF-002
Objective: Test performance during interaction
Steps:
  1. Load avatar successfully
  2. Enable Performance tab recording
  3. Interact with avatar for 2 minutes:
     - Mouse movement (head tracking)
     - Orbit controls (rotate/pan/zoom)
     - State changes (idle/speaking/listening)
  4. Monitor frame timing and memory

Monitoring Points:
  □ Frame rate remains > 30fps
  □ No significant memory growth
  □ Smooth mouse interactions
  □ No dropped frames during animation
  □ CPU usage reasonable (< 50% on modern hardware)
```

### 4. Mouse Interaction and Head Tracking

#### Test Case: Mouse Tracking
```
Test ID: MOUSE-001
Objective: Validate mouse-based head tracking
Steps:
  1. Load avatar with mouse tracking enabled
  2. Move cursor across avatar viewport
  3. Observe head bone rotation
  4. Test edge cases (corners, fast movement)
  5. Check tracking smoothness

Expected Behavior:
  ✓ Head follows mouse movement
  ✓ Rotation is proportional to mouse position
  ✓ Smooth interpolation (no jerkiness)
  ✓ Proper bounds checking
  ✓ Returns to center when mouse leaves area

Test Patterns:
  □ Slow circular motion
  □ Fast diagonal movement
  □ Edge-to-edge sweeps
  □ Hover at corners
  □ Mouse leave/enter events
```

#### Test Case: Orbit Controls
```
Test ID: CONTROLS-001
Objective: Test 3D navigation controls
Device Coverage: Mouse, trackpad, touch (Surface Pro)

Mouse Controls:
  □ Left click + drag = Rotate ✓
  □ Right click + drag = Pan ✓
  □ Scroll wheel = Zoom ✓
  □ Middle click + drag = Dolly ✓

Trackpad Controls (Surface Pro):
  □ One finger drag = Rotate ✓
  □ Two finger drag = Pan ✓
  □ Two finger pinch = Zoom ✓
  □ Smooth damping enabled ✓

Touch Controls:
  □ One finger = Rotate ✓
  □ Two finger = Dolly/Pan ✓
  □ Responsive on touch devices ✓
```

### 5. Fallback Mechanism Testing

#### Test Case: GLB Fallback Chain
```
Test ID: FALLBACK-001
Objective: Test fallback mechanisms when GLB fails
Steps:
  1. Block GLB file in browser (dev tools Network tab)
  2. Refresh page
  3. Observe fallback behavior
  4. Test image fallback loading
  5. Test final fallback (colored plane)

Fallback Chain:
  1. GLB Model (primary)
     ↓ (on error/timeout)
  2. JPG Image (/assets/SavannahAvatar.jpg)
     ↓ (on error)
  3. PNG Image (/assets/SavannahAvatar.png)
     ↓ (on error)
  4. Colored Plane (final fallback)

Validation:
  ✓ Each fallback triggers correctly
  ✓ No infinite loading states
  ✓ Error messages logged appropriately
  ✓ User sees visual feedback at each step
```

#### Test Case: Network Conditions
```
Test ID: NETWORK-001
Objective: Test under various network conditions
Network Simulation (Chrome dev tools):
  □ Slow 3G (GLB loading timeout test)
  □ Fast 3G (acceptable performance)
  □ Offline (fallback to cached assets)
  □ Intermittent connection (retry logic)

Expected Results:
  ✓ Graceful degradation
  ✓ Progressive loading indicators
  ✓ Timeout handling (10 second limit)
  ✓ Retry mechanisms functional
```

### 6. Error Boundary and Recovery Testing

#### Test Case: Component Error Recovery
```
Test ID: ERROR-001
Objective: Test error boundaries and recovery
Steps:
  1. Simulate component errors (invalid props)
  2. Test memory exhaustion scenarios
  3. Verify error UI display
  4. Test retry functionality
  5. Check console error reporting

Error Scenarios:
  □ Invalid GLB file format
  □ Corrupted model data
  □ Out of memory conditions
  □ WebGL context loss
  □ Network interruption during loading

Recovery Mechanisms:
  ✓ Error overlay displayed
  ✓ Retry button functional
  ✓ Graceful fallback to image
  ✓ No application crash
  ✓ Error reporting to console
```

### 7. Device and Browser Compatibility

#### Test Matrix
```
Browsers:
  □ Chrome (latest)
  □ Firefox (latest)
  □ Safari (latest)
  □ Edge (latest)

Devices:
  □ Desktop (Windows/Mac/Linux)
  □ Surface Pro (touch + trackpad)
  □ Mobile (iOS/Android)
  □ Tablet (iPad/Android)

WebGL Support:
  □ WebGL 1.0 minimum
  □ WebGL 2.0 preferred
  □ Hardware acceleration enabled
  □ Context loss recovery
```

#### Surface Pro Specific Testing
```
Test ID: SURFACE-001
Objective: Validate Surface Pro controls and performance
Specific Tests:
  □ Trackpad gestures work correctly
  □ Touch interactions responsive
  □ Pen input (if applicable)
  □ Screen rotation handling
  □ Performance with integrated graphics

Surface Pro Settings:
  - panSpeed: 2.5 (increased for trackpad)
  - rotateSpeed: 1.2
  - zoomSpeed: 1.5
  - screenSpacePanning: true
  - TWO finger gesture: DOLLY_PAN
```

## Automated Test Execution

### Running the Test Suite
```bash
# Install dependencies
npm install

# Run all GLB avatar tests
npm run test src/tests/avatar3d/GLBAvatarTest.suite.js

# Run with coverage
npm run test:coverage src/tests/avatar3d/

# Run performance tests
npm run test:perf src/tests/avatar3d/
```

### Test Configuration
```javascript
// vitest.config.js additions for 3D testing
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
    deps: {
      optimizer: {
        web: {
          include: ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  }
});
```

## Reporting and Documentation

### Test Results Template
```
GLB Avatar Test Report
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [Browser/OS/Device]

CRITICAL ISSUES:
  □ ReferenceError bug fixed
  □ GLB loading successful
  □ Avatar visibility confirmed
  □ Performance acceptable
  □ Fallbacks working
  □ No console errors

PERFORMANCE METRICS:
  - Load time: [X] seconds
  - Memory usage: [X] MB
  - Frame rate: [X] fps
  - File size: 13.8MB GLB

FAILED TESTS:
  [List any failed tests with details]

BROWSER COMPATIBILITY:
  [Results for each tested browser]

RECOMMENDATIONS:
  [Any suggested improvements]
```

### Issue Tracking Template
```
Bug Report: GLB Avatar Issue
Severity: [Critical/High/Medium/Low]
Component: [InteractiveAvatar/Avatar3DScene/etc.]

DESCRIPTION:
[Clear description of the issue]

REPRODUCTION STEPS:
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED RESULT:
[What should happen]

ACTUAL RESULT:
[What actually happens]

ENVIRONMENT:
- Browser: [Browser/Version]
- OS: [Operating System]
- Device: [Desktop/Mobile/Surface Pro]

CONSOLE ERRORS:
[Any JavaScript errors]

SCREENSHOTS/VIDEO:
[Attach if applicable]
```

## Best Practices for Manual Testing

1. **Always test with browser dev tools open** - Critical for catching console errors and monitoring performance

2. **Test on multiple devices** - Desktop, mobile, and Surface Pro have different interaction patterns

3. **Simulate network conditions** - Use Chrome dev tools to test slow connections

4. **Monitor memory usage** - Large GLB files can cause memory issues

5. **Document everything** - Screenshots, console logs, and detailed step descriptions

6. **Test edge cases** - Fast mouse movement, rapid interaction, browser tab switching

7. **Validate fixes** - After fixing the ReferenceError, confirm the fix doesn't break other functionality

This comprehensive manual testing guide should be used alongside the automated test suite to ensure thorough validation of GLB avatar functionality.