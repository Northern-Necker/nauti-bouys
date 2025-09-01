# Viseme Test Framework Guide

## Overview
A sophisticated testing framework for validating lip sync functionality and viseme mapping accuracy in the 3D avatar system.

## Features

### 1. **Automated Test Suite** (`visemeTestFramework.js`)
- **VisemeTestCase**: Individual test cases for phoneme/viseme validation
- **VisemeTestSuite**: Comprehensive suite with pre-built tests
- **MorphTargetValidator**: Records and validates morph target sequences
- **TimingAnalyzer**: Measures audio-to-viseme synchronization accuracy
- **PerformanceBenchmark**: Tracks execution time and memory usage

### 2. **Visual Test Interface** (`VisemeLipSyncTestPage.jsx`)
- Interactive 3D avatar with real-time viseme visualization
- Debug overlay showing active morph targets and their values
- Test control panel for running automated tests
- Recording capabilities for morph target analysis
- Timeline visualization of audio/viseme synchronization

### 3. **Unit Test Suite** (`visemeMappingTests.js`)
- Jest tests for phoneme-to-viseme mapping
- Conv-AI Reallusion mapping validation
- Animation timing and transition tests
- Edge case handling verification

## Test Categories

### Phoneme Mapping Tests
- **Bilabial Plosives**: P, B, M → Viseme 1 (PP)
- **Labiodental Fricatives**: F, V → Viseme 2 (FF)
- **Dental Fricatives**: TH → Viseme 3 (TH)
- **Alveolar Plosives**: T, D, N, L → Viseme 4 (DD)
- **Velar Plosives**: K, G → Viseme 5 (KK)
- **Postalveolar Affricates**: CH, J, SH → Viseme 6 (CH)
- **Alveolar Fricatives**: S, Z → Viseme 7 (SS)
- **Vowel Categories**: AA, E, I, O, U → Visemes 10-14

### Validation Metrics
- **Phoneme Accuracy**: Correct phoneme extraction from text
- **Viseme Accuracy**: Proper viseme assignment for each phoneme
- **Timing Accuracy**: Synchronization within 50ms tolerance
- **Morph Target Accuracy**: Correct blend shape values

## Usage

### Running the Visual Test Interface
1. Navigate to `/viseme-test` in your application
2. Click "Run All Tests" to execute the automated test suite
3. Use test phrases to validate specific phoneme groups
4. Enable recording to capture morph target sequences

### Running Unit Tests
```bash
npm test visemeMappingTests
```

### Test Framework API

#### Creating Custom Tests
```javascript
const test = new VisemeTestCase(
  'Test Name',
  'input text',
  ['expected', 'phonemes'],
  [{1: 1.0}, {10: 1.0}], // expected visemes
  'Test description'
);

const result = test.run();
```

#### Recording Morph Targets
```javascript
const validator = new MorphTargetValidator();
validator.startRecording();

// During animation frames:
validator.recordFrame(morphTargets);

const recordings = validator.stopRecording();
const validation = validator.validateSequence(expectedSequence);
```

#### Timing Analysis
```javascript
const analyzer = new TimingAnalyzer();
analyzer.recordAudioEvent('start', 0);
analyzer.recordVisemeChange({1: 1.0}, 50);

const analysis = analyzer.analyze();
// Returns: averageDelay, synchronizationScore
```

## Test Results Interpretation

### Pass/Fail Criteria
- **Excellent**: Audio-viseme delay < 20ms
- **Good**: Delay < 50ms
- **Acceptable**: Delay < 100ms
- **Poor**: Delay > 100ms

### Common Issues
1. **Phoneme Mismatches**: Check text-to-phoneme patterns
2. **Viseme Timing**: Adjust frame skip or interpolation speed
3. **Missing Morph Targets**: Verify avatar model has required blend shapes

## Performance Benchmarking

The framework tracks:
- Execution time per test
- Memory usage (if available)
- Frame rate during animation
- Viseme transition smoothness

## Continuous Integration

For CI/CD integration:
1. Run `npm test` to execute all unit tests
2. Check exit code for pass/fail status
3. Review test report for detailed results

## Debugging Tips

1. **Enable Debug Info**: Shows real-time morph target values
2. **Use Recording**: Capture sequences for offline analysis
3. **Check Timeline**: Visualize audio/viseme synchronization
4. **Test Incrementally**: Start with simple phonemes, then complex words

## Future Enhancements

- [ ] Automated CI test runner
- [ ] Machine learning-based accuracy scoring
- [ ] Multi-language phoneme support
- [ ] A/B testing for different mapping strategies
- [ ] Performance regression detection