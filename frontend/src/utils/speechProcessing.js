/**
 * Speech Processing Utilities
 * Handles text-to-speech, speech recognition, and viseme generation for AI avatars
 */

// Keep a reference to the synthesis instance to prevent garbage collection
const synth = window.speechSynthesis;

// Phoneme to viseme mapping based on Conv-AI's proven system
const PHONEME_TO_VISEME = {
  // Silence
  'sil': 0, 'pau': 0, 'sp': 0,
  
  // Bilabial plosives (p, b, m) - lips pressed together
  'p': 1, 'b': 1, 'm': 1, 'P': 1, 'B': 1, 'M': 1,
  
  // Labiodental fricatives (f, v) - lower lip to upper teeth
  'f': 2, 'v': 2, 'F': 2, 'V': 2,
  
  // Dental fricatives (th) - tongue between teeth
  'th': 3, 'dh': 3, 'TH': 3, 'DH': 3,
  
  // Alveolar plosives (t, d, n, l) - tongue to alveolar ridge
  't': 4, 'd': 4, 'n': 4, 'l': 4, 'T': 4, 'D': 4, 'N': 4, 'L': 4,
  's': 7, 'z': 7, 'S': 7, 'Z': 7, // Moved to SS category
  
  // Velar plosives (k, g) - back of tongue to soft palate
  'k': 5, 'g': 5, 'K': 5, 'G': 5, 'ng': 8, 'NG': 8,
  
  // Postalveolar affricates (ch, j) - tongue blade to post-alveolar
  'ch': 6, 'jh': 6, 'CH': 6, 'JH': 6, 'sh': 6, 'zh': 6,
  
  // Liquids (r) - tongue tip curled or bunched
  'r': 9, 'R': 9, 'er': 9, 'ER': 9,
  
  // Open vowels (a) - jaw open, tongue low
  'aa': 10, 'ae': 10, 'ah': 10, 'ao': 10, 'aw': 10, 'ay': 10,
  'AA': 10, 'AE': 10, 'AH': 10, 'AO': 10, 'AW': 10, 'AY': 10,
  
  // Front vowels (e) - tongue forward and high
  'eh': 11, 'ey': 11, 'EH': 11, 'EY': 11,
  
  // Close front vowels (i) - tongue high and forward
  'ih': 12, 'iy': 12, 'IH': 12, 'IY': 12,
  
  // Back vowels (o) - lips rounded, tongue back
  'oh': 13, 'ow': 13, 'oy': 13, 'OH': 13, 'OW': 13, 'OY': 13,
  
  // Close back vowels (u) - lips rounded and protruded
  'uh': 14, 'uw': 14, 'UH': 14, 'UW': 14,
  
  // Additional common phonemes
  'w': 14, 'y': 12, 'h': 0, 'hh': 0,
  'W': 14, 'Y': 12, 'H': 0, 'HH': 0
};

// Simple text-to-phoneme approximation for basic viseme generation
const TEXT_TO_PHONEME_PATTERNS = [
  // Consonants
  { pattern: /ch/gi, phoneme: 'ch' },
  { pattern: /sh/gi, phoneme: 'sh' },
  { pattern: /th/gi, phoneme: 'th' },
  { pattern: /ng/gi, phoneme: 'ng' },
  { pattern: /ph/gi, phoneme: 'f' },
  
  // Single consonants
  { pattern: /p/gi, phoneme: 'p' },
  { pattern: /b/gi, phoneme: 'b' },
  { pattern: /m/gi, phoneme: 'm' },
  { pattern: /f/gi, phoneme: 'f' },
  { pattern: /v/gi, phoneme: 'v' },
  { pattern: /t/gi, phoneme: 't' },
  { pattern: /d/gi, phoneme: 'd' },
  { pattern: /n/gi, phoneme: 'n' },
  { pattern: /l/gi, phoneme: 'l' },
  { pattern: /s/gi, phoneme: 's' },
  { pattern: /z/gi, phoneme: 'z' },
  { pattern: /k/gi, phoneme: 'k' },
  { pattern: /g/gi, phoneme: 'g' },
  { pattern: /r/gi, phoneme: 'r' },
  { pattern: /w/gi, phoneme: 'w' },
  { pattern: /y/gi, phoneme: 'y' },
  { pattern: /h/gi, phoneme: 'h' },
  
  // Vowels
  { pattern: /ee|ea/gi, phoneme: 'iy' },
  { pattern: /oo/gi, phoneme: 'uw' },
  { pattern: /ou|ow/gi, phoneme: 'ow' },
  { pattern: /ai|ay/gi, phoneme: 'ay' },
  { pattern: /oi|oy/gi, phoneme: 'oy' },
  { pattern: /au|aw/gi, phoneme: 'aw' },
  { pattern: /a/gi, phoneme: 'aa' },
  { pattern: /e/gi, phoneme: 'eh' },
  { pattern: /i/gi, phoneme: 'ih' },
  { pattern: /o/gi, phoneme: 'oh' },
  { pattern: /u/gi, phoneme: 'uh' }
];

/**
 * Convert text to basic phonemes (simplified approximation)
 * @param {string} text - Input text
 * @returns {Array} Array of phonemes
 */
export function textToPhonemes(text) {
  if (!text || typeof text !== 'string') return [];
  
  let processedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const phonemes = [];
  
  // Split into words
  const words = processedText.split(/\s+/).filter(word => word.length > 0);
  
  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) {
      phonemes.push('pau'); // Pause between words
    }
    
    let remainingWord = word;
    
    // Apply phoneme patterns
    for (const { pattern, phoneme } of TEXT_TO_PHONEME_PATTERNS) {
      remainingWord = remainingWord.replace(pattern, `|${phoneme}|`);
    }
    
    // Extract phonemes
    const wordPhonemes = remainingWord
      .split('|')
      .filter(p => p.length > 0 && p !== word);
    
    phonemes.push(...wordPhonemes);
  });
  
  return phonemes;
}

/**
 * Convert phonemes to visemes
 * @param {Array} phonemes - Array of phonemes
 * @returns {Array} Array of viseme data objects
 */
export function phonemesToVisemes(phonemes) {
  if (!Array.isArray(phonemes)) return [];
  
  return phonemes.map(phoneme => {
    const visemeIndex = PHONEME_TO_VISEME[phoneme] || 0;
    return {
      [visemeIndex]: 1.0
    };
  });
}

/**
 * Convert text directly to visemes (simplified)
 * @param {string} text - Input text
 * @param {Object} options - Options for viseme generation
 * @param {number} options.duration - Duration per viseme in milliseconds
 * @param {number} options.intensity - Viseme intensity (0-1)
 * @returns {Array} Array of timed viseme data
 */
export function textToVisemes(text, options = {}) {
  const { duration = 200, intensity = 1.0 } = options;
  
  const phonemes = textToPhonemes(text);
  const visemes = phonemesToVisemes(phonemes);
  
  return visemes.map((viseme, index) => ({
    ...viseme,
    timestamp: index * duration,
    duration: duration,
    intensity: intensity
  }));
}

/**
 * Enhanced text-to-speech with viseme generation
 * @param {string} text - Text to speak
 * @param {Object} options - Speech synthesis options
 * @param {Function} onVisemeUpdate - Callback for viseme updates
 * @returns {Promise} Promise that resolves when speech is complete
 */
export function synthesizeSpeech(text, options = {}, onVisemeUpdate = null) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    const {
      pitch = 1.0,
      rate = 1.0,
      volume = 0.8,
      voiceURI = null,
      lang = 'en-US'
    } = options;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;
    utterance.lang = lang;
    
    // Set specific voice if provided
    if (voiceURI) {
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.voiceURI === voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    // Generate visemes for the text
    if (onVisemeUpdate) {
      const visemes = textToVisemes(text, {
        duration: 60000 / (rate * 200), // Adjust duration based on speech rate
        intensity: 1.0
      });
      
      let visemeIndex = 0;
      const visemeInterval = setInterval(() => {
        if (visemeIndex < visemes.length) {
          onVisemeUpdate(visemes[visemeIndex]);
          visemeIndex++;
        } else {
          clearInterval(visemeInterval);
          // Return to silence
          onVisemeUpdate({ 0: 1.0 });
        }
      }, visemes[0]?.duration || 200);
      
      utterance.onend = () => {
        clearInterval(visemeInterval);
        onVisemeUpdate({ 0: 1.0 }); // Silence
        resolve();
      };
      
      utterance.onerror = (event) => {
        clearInterval(visemeInterval);
        reject(event.error);
      };
    } else {
      utterance.onend = resolve;
      utterance.onerror = (event) => reject(event.error);
    }
    
    speechSynthesis.speak(utterance);
  });
}

/**
 * Start speech recognition
 * @param {Object} options - Recognition options
 * @param {Function} onResult - Callback for recognition results
 * @param {Function} onError - Callback for errors
 * @returns {Object} Recognition controller
 */
export function startSpeechRecognition(options = {}, onResult = null, onError = null) {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    if (onError) onError(new Error('Speech recognition not supported'));
    return null;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  const {
    continuous = false,
    interimResults = false,
    lang = 'en-US',
    maxAlternatives = 1
  } = options;
  
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;
  recognition.lang = lang;
  recognition.maxAlternatives = maxAlternatives;
  
  recognition.onresult = (event) => {
    const results = [];
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      results.push({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal
      });
    }
    if (onResult) onResult(results);
  };
  
  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };
  
  recognition.start();
  
  return {
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
    recognition
  };
}

/**
 * Stop speech recognition
 * @param {Object} recognitionController - Controller returned by startSpeechRecognition
 */
export function stopSpeechRecognition(recognitionController) {
  if (recognitionController && recognitionController.stop) {
    recognitionController.stop();
  }
}

/**
 * Get available speech synthesis voices
 * @returns {Array} Array of available voices
 */
export function getAvailableVoices() {
  if (!('speechSynthesis' in window)) return [];
  
  return speechSynthesis.getVoices().map(voice => ({
    name: voice.name,
    lang: voice.lang,
    voiceURI: voice.voiceURI,
    localService: voice.localService,
    default: voice.default
  }));
}

/**
 * Get recommended voice for avatar
 * @param {Object} avatarConfig - Avatar configuration
 * @returns {Object|null} Recommended voice or null
 */
export function getRecommendedVoice(avatarConfig) {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;
  
  // Try to find a voice that matches the avatar's characteristics
  const { personality } = avatarConfig;
  
  // Gender-based voice selection (simplified)
  let preferredVoices = voices;
  
  // Formality-based selection
  if (personality?.conversationStyle?.formality === 'formal-professional') {
    preferredVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('professional') ||
      voice.name.toLowerCase().includes('formal')
    );
  }
  
  // If no specific match, prefer local voices
  if (preferredVoices.length === 0) {
    preferredVoices = voices.filter(voice => voice.localService);
  }
  
  // If still no match, use default voice
  if (preferredVoices.length === 0) {
    preferredVoices = voices.filter(voice => voice.default);
  }
  
  // Return first available voice
  return preferredVoices.length > 0 ? preferredVoices[0] : voices[0];
}

/**
 * Create viseme animation sequence from text
 * @param {string} text - Input text
 * @param {Object} options - Animation options
 * @returns {Array} Animation sequence with timing
 */
export function createVisemeAnimation(text, options = {}) {
  const {
    wordsPerMinute = 150,
    pauseDuration = 300,
    visemeIntensity = 1.0
  } = options;
  
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const millisecondsPerWord = (60 * 1000) / wordsPerMinute;
  
  const animation = [];
  let currentTime = 0;
  
  words.forEach((word, index) => {
    if (index > 0) {
      // Add pause between words
      animation.push({
        viseme: { 0: 1.0 }, // Silence
        startTime: currentTime,
        duration: pauseDuration,
        word: null
      });
      currentTime += pauseDuration;
    }
    
    const wordVisemes = textToVisemes(word, {
      duration: millisecondsPerWord / word.length,
      intensity: visemeIntensity
    });
    
    wordVisemes.forEach(viseme => {
      animation.push({
        viseme: viseme,
        startTime: currentTime,
        duration: viseme.duration,
        word: word
      });
      currentTime += viseme.duration;
    });
  });
  
  // Trigger audio playback
  speakText(text, { rate: wordsPerMinute / 150 });
  
  return animation;
}

/**
 * Speak text using browser's SpeechSynthesis API
 * @param {string} text - Text to speak
 * @param {Object} options - Speech synthesis options
 */
export function speakText(text, options = {}) {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    return;
  }
  
  const {
    pitch = 1.0,
    rate = 1.0,
    volume = 0.8,
    voiceURI = null,
    lang = 'en-US'
  } = options;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.volume = volume;
  utterance.lang = lang;
  
  if (voiceURI) {
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }
  
  speechSynthesis.speak(utterance);
}

/**
 * Play viseme animation sequence
 * @param {Array} animationSequence - Animation sequence from createVisemeAnimation
 * @param {Function} onVisemeUpdate - Callback for viseme updates
 * @returns {Object} Animation controller
 */
export function playVisemeAnimation(animationSequence, onVisemeUpdate) {
  if (!Array.isArray(animationSequence) || !onVisemeUpdate) {
    return null;
  }
  
  let currentIndex = 0;
  let startTime = Date.now();
  let animationId = null;
  let isPlaying = true;
  
  function animate() {
    if (!isPlaying) return;
    
    const elapsed = Date.now() - startTime;
    
    // Find current viseme
    while (currentIndex < animationSequence.length) {
      const current = animationSequence[currentIndex];
      
      if (elapsed >= current.startTime && elapsed < current.startTime + current.duration) {
        onVisemeUpdate(current.viseme);
        break;
      } else if (elapsed >= current.startTime + current.duration) {
        currentIndex++;
      } else {
        break;
      }
    }
    
    // Continue animation if not finished
    if (currentIndex < animationSequence.length) {
      animationId = requestAnimationFrame(animate);
    } else {
      // Animation complete - return to silence
      onVisemeUpdate({ 0: 1.0 });
    }
  }
  
  animate();
  
  return {
    stop: () => {
      isPlaying = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      onVisemeUpdate({ 0: 1.0 }); // Return to silence
    },
    pause: () => {
      isPlaying = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    },
    resume: () => {
      if (!isPlaying) {
        isPlaying = true;
        startTime = Date.now() - (animationSequence[currentIndex]?.startTime || 0);
        animate();
      }
    }
  };
}

export { PHONEME_TO_VISEME };

export default {
  PHONEME_TO_VISEME,
  textToPhonemes,
  phonemesToVisemes,
  textToVisemes,
  synthesizeSpeech,
  startSpeechRecognition,
  stopSpeechRecognition,
  getAvailableVoices,
  getRecommendedVoice,
  createVisemeAnimation,
  playVisemeAnimation,
  speakText
};
