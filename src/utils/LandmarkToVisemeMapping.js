/**
 * Landmark to Viseme Mapping System
 * Provides precise mappings from MediaPipe facial landmarks to phonemes
 * Uses geometric analysis and machine learning-inspired classification
 */

export class LandmarkToVisemeMapping {
    constructor(options = {}) {
        this.options = {
            confidenceThreshold: options.confidenceThreshold || 0.6,
            useMLClassification: options.useMLClassification !== false,
            enableFuzzyMatching: options.enableFuzzyMatching !== false,
            debugMode: options.debugMode || false,
            ...options
        };

        this.initializeClassificationRules();
        this.initializeFeatureWeights();
        this.initializePhonemeDatabase();
    }

    initializeClassificationRules() {
        /**
         * Rule-based classification system for phoneme detection
         * Each rule defines geometric constraints for specific phonemes
         */
        this.classificationRules = {
            // Vowels
            'AA': { // 'hot', 'father'
                mouthHeight: { min: 0.6, max: 1.0, weight: 0.8 },
                mouthWidth: { min: 0.4, max: 0.8, weight: 0.6 },
                aspectRatio: { min: 0.3, max: 0.7, weight: 0.7 },
                jawOpening: { min: 0.5, max: 1.0, weight: 0.9 },
                roundness: { min: 0.4, max: 0.8, weight: 0.5 },
                lipSeparation: { min: 0.6, max: 1.0, weight: 0.8 }
            },
            'AE': { // 'cat', 'bat'
                mouthHeight: { min: 0.3, max: 0.6, weight: 0.7 },
                mouthWidth: { min: 0.6, max: 1.0, weight: 0.8 },
                aspectRatio: { min: 1.2, max: 2.0, weight: 0.8 },
                jawOpening: { min: 0.2, max: 0.5, weight: 0.6 },
                roundness: { min: 0.0, max: 0.4, weight: 0.7 }
            },
            'AH': { // 'but', 'cup'
                mouthHeight: { min: 0.2, max: 0.5, weight: 0.6 },
                mouthWidth: { min: 0.2, max: 0.6, weight: 0.5 },
                aspectRatio: { min: 0.8, max: 1.5, weight: 0.6 },
                jawOpening: { min: 0.2, max: 0.4, weight: 0.5 },
                roundness: { min: 0.3, max: 0.7, weight: 0.4 }
            },
            'AO': { // 'bought', 'dog'
                mouthHeight: { min: 0.5, max: 0.8, weight: 0.8 },
                mouthWidth: { min: 0.1, max: 0.4, weight: 0.7 },
                aspectRatio: { min: 0.2, max: 0.6, weight: 0.8 },
                jawOpening: { min: 0.4, max: 0.7, weight: 0.7 },
                roundness: { min: 0.6, max: 1.0, weight: 0.9 }
            },
            'EH': { // 'bet', 'red'
                mouthHeight: { min: 0.2, max: 0.4, weight: 0.6 },
                mouthWidth: { min: 0.4, max: 0.8, weight: 0.7 },
                aspectRatio: { min: 1.0, max: 2.0, weight: 0.7 },
                jawOpening: { min: 0.1, max: 0.3, weight: 0.5 },
                roundness: { min: 0.1, max: 0.5, weight: 0.6 }
            },
            'IH': { // 'bit', 'hit'
                mouthHeight: { min: 0.1, max: 0.3, weight: 0.6 },
                mouthWidth: { min: 0.3, max: 0.7, weight: 0.7 },
                aspectRatio: { min: 1.5, max: 3.0, weight: 0.8 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.5 },
                roundness: { min: 0.0, max: 0.3, weight: 0.7 }
            },
            'IY': { // 'see', 'beat'
                mouthHeight: { min: 0.05, max: 0.2, weight: 0.8 },
                mouthWidth: { min: 0.5, max: 1.0, weight: 0.9 },
                aspectRatio: { min: 2.0, max: 5.0, weight: 0.9 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.7 },
                roundness: { min: 0.0, max: 0.2, weight: 0.8 },
                curvature: { min: -0.1, max: 0.1, weight: 0.3 }
            },
            'OW': { // 'go', 'show'
                mouthHeight: { min: 0.4, max: 0.7, weight: 0.8 },
                mouthWidth: { min: 0.1, max: 0.3, weight: 0.8 },
                aspectRatio: { min: 0.2, max: 0.5, weight: 0.9 },
                jawOpening: { min: 0.3, max: 0.6, weight: 0.7 },
                roundness: { min: 0.7, max: 1.0, weight: 1.0 }
            },
            'UH': { // 'book', 'good'
                mouthHeight: { min: 0.15, max: 0.35, weight: 0.6 },
                mouthWidth: { min: 0.1, max: 0.3, weight: 0.7 },
                aspectRatio: { min: 0.3, max: 0.8, weight: 0.7 },
                jawOpening: { min: 0.1, max: 0.25, weight: 0.5 },
                roundness: { min: 0.5, max: 0.9, weight: 0.8 }
            },
            'UW': { // 'you', 'new'
                mouthHeight: { min: 0.2, max: 0.4, weight: 0.7 },
                mouthWidth: { min: 0.05, max: 0.2, weight: 0.9 },
                aspectRatio: { min: 0.1, max: 0.4, weight: 0.9 },
                jawOpening: { min: 0.15, max: 0.3, weight: 0.6 },
                roundness: { min: 0.8, max: 1.0, weight: 1.0 }
            },

            // Consonants - Plosives
            'B': { // 'big', 'boy'
                mouthHeight: { min: 0.0, max: 0.05, weight: 1.0 },
                mouthWidth: { min: 0.0, max: 0.1, weight: 0.9 },
                aspectRatio: { min: 0.0, max: 0.2, weight: 1.0 },
                jawOpening: { min: 0.0, max: 0.05, weight: 1.0 },
                lipSeparation: { min: 0.0, max: 0.05, weight: 1.0 }
            },
            'P': { // 'put', 'pop'
                mouthHeight: { min: 0.0, max: 0.05, weight: 1.0 },
                mouthWidth: { min: 0.0, max: 0.1, weight: 0.9 },
                aspectRatio: { min: 0.0, max: 0.2, weight: 1.0 },
                jawOpening: { min: 0.0, max: 0.05, weight: 1.0 },
                lipSeparation: { min: 0.0, max: 0.05, weight: 1.0 }
            },
            'M': { // 'man', 'mom'
                mouthHeight: { min: 0.0, max: 0.05, weight: 1.0 },
                mouthWidth: { min: 0.0, max: 0.1, weight: 0.9 },
                aspectRatio: { min: 0.0, max: 0.2, weight: 1.0 },
                jawOpening: { min: 0.0, max: 0.05, weight: 1.0 },
                lipSeparation: { min: 0.0, max: 0.05, weight: 1.0 }
            },
            'D': { // 'dog', 'day'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.7 },
                mouthWidth: { min: 0.1, max: 0.3, weight: 0.6 },
                aspectRatio: { min: 0.5, max: 1.5, weight: 0.6 },
                jawOpening: { min: 0.05, max: 0.15, weight: 0.7 },
                lipSeparation: { min: 0.05, max: 0.2, weight: 0.6 }
            },
            'T': { // 'top', 'time'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.7 },
                mouthWidth: { min: 0.1, max: 0.3, weight: 0.6 },
                aspectRatio: { min: 0.5, max: 1.5, weight: 0.6 },
                jawOpening: { min: 0.05, max: 0.15, weight: 0.7 },
                lipSeparation: { min: 0.05, max: 0.2, weight: 0.6 }
            },
            'K': { // 'cat', 'key'
                mouthHeight: { min: 0.05, max: 0.2, weight: 0.6 },
                mouthWidth: { min: 0.1, max: 0.4, weight: 0.5 },
                aspectRatio: { min: 0.5, max: 2.0, weight: 0.5 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.6 }
            },
            'G': { // 'good', 'go'
                mouthHeight: { min: 0.05, max: 0.2, weight: 0.6 },
                mouthWidth: { min: 0.1, max: 0.4, weight: 0.5 },
                aspectRatio: { min: 0.5, max: 2.0, weight: 0.5 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.6 }
            },

            // Fricatives
            'F': { // 'fish', 'phone'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.6 },
                mouthWidth: { min: 0.0, max: 0.2, weight: 0.7 },
                aspectRatio: { min: 0.1, max: 0.8, weight: 0.6 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.7 }
            },
            'V': { // 'very', 'voice'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.6 },
                mouthWidth: { min: 0.0, max: 0.2, weight: 0.7 },
                aspectRatio: { min: 0.1, max: 0.8, weight: 0.6 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.7 }
            },
            'S': { // 'see', 'sun'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.7 },
                mouthWidth: { min: 0.2, max: 0.5, weight: 0.7 },
                aspectRatio: { min: 1.0, max: 3.0, weight: 0.7 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.8 }
            },
            'Z': { // 'zoo', 'zero'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.7 },
                mouthWidth: { min: 0.2, max: 0.5, weight: 0.7 },
                aspectRatio: { min: 1.0, max: 3.0, weight: 0.7 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.8 }
            },
            'SH': { // 'shoe', 'fish'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.6 },
                mouthWidth: { min: 0.0, max: 0.2, weight: 0.8 },
                aspectRatio: { min: 0.1, max: 0.8, weight: 0.7 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.7 },
                roundness: { min: 0.6, max: 1.0, weight: 0.6 }
            },
            'ZH': { // 'measure', 'vision'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.6 },
                mouthWidth: { min: 0.0, max: 0.2, weight: 0.8 },
                aspectRatio: { min: 0.1, max: 0.8, weight: 0.7 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.7 },
                roundness: { min: 0.6, max: 1.0, weight: 0.6 }
            },
            'TH': { // 'think', 'math'
                mouthHeight: { min: 0.05, max: 0.15, weight: 0.6 },
                mouthWidth: { min: 0.2, max: 0.5, weight: 0.6 },
                aspectRatio: { min: 1.0, max: 2.5, weight: 0.6 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.7 }
            },
            'DH': { // 'that', 'this'
                mouthHeight: { min: 0.1, max: 0.2, weight: 0.6 },
                mouthWidth: { min: 0.2, max: 0.5, weight: 0.6 },
                aspectRatio: { min: 1.0, max: 2.5, weight: 0.6 },
                jawOpening: { min: 0.05, max: 0.15, weight: 0.6 }
            },
            'HH': { // 'house', 'hat'
                mouthHeight: { min: 0.1, max: 0.3, weight: 0.5 },
                mouthWidth: { min: 0.1, max: 0.4, weight: 0.5 },
                aspectRatio: { min: 0.5, max: 2.0, weight: 0.4 },
                jawOpening: { min: 0.05, max: 0.25, weight: 0.5 }
            },

            // Nasals
            'N': { // 'no', 'name'
                mouthHeight: { min: 0.05, max: 0.2, weight: 0.6 },
                mouthWidth: { min: 0.1, max: 0.4, weight: 0.5 },
                aspectRatio: { min: 0.5, max: 2.0, weight: 0.5 },
                jawOpening: { min: 0.0, max: 0.15, weight: 0.6 }
            },
            'NG': { // 'sing', 'ring'
                mouthHeight: { min: 0.05, max: 0.2, weight: 0.5 },
                mouthWidth: { min: 0.1, max: 0.3, weight: 0.5 },
                aspectRatio: { min: 0.5, max: 1.5, weight: 0.5 },
                jawOpening: { min: 0.05, max: 0.15, weight: 0.5 }
            },

            // Liquids
            'L': { // 'look', 'love'
                mouthHeight: { min: 0.1, max: 0.3, weight: 0.6 },
                mouthWidth: { min: 0.1, max: 0.4, weight: 0.5 },
                aspectRatio: { min: 0.5, max: 2.0, weight: 0.5 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.6 }
            },
            'R': { // 'red', 'run'
                mouthHeight: { min: 0.1, max: 0.25, weight: 0.6 },
                mouthWidth: { min: 0.05, max: 0.2, weight: 0.7 },
                aspectRatio: { min: 0.2, max: 0.8, weight: 0.7 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.5 },
                roundness: { min: 0.4, max: 0.8, weight: 0.6 }
            },

            // Glides
            'W': { // 'water', 'way'
                mouthHeight: { min: 0.1, max: 0.3, weight: 0.6 },
                mouthWidth: { min: 0.0, max: 0.2, weight: 0.8 },
                aspectRatio: { min: 0.1, max: 0.6, weight: 0.8 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.5 },
                roundness: { min: 0.6, max: 1.0, weight: 0.9 }
            },
            'Y': { // 'yes', 'you'
                mouthHeight: { min: 0.1, max: 0.3, weight: 0.5 },
                mouthWidth: { min: 0.3, max: 0.6, weight: 0.6 },
                aspectRatio: { min: 1.0, max: 2.5, weight: 0.6 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.5 }
            },

            // Affricates
            'CH': { // 'church', 'chair'
                mouthHeight: { min: 0.1, max: 0.25, weight: 0.6 },
                mouthWidth: { min: 0.0, max: 0.2, weight: 0.7 },
                aspectRatio: { min: 0.1, max: 0.8, weight: 0.7 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.6 },
                roundness: { min: 0.5, max: 0.9, weight: 0.6 }
            },
            'JH': { // 'judge', 'joy'
                mouthHeight: { min: 0.1, max: 0.25, weight: 0.6 },
                mouthWidth: { min: 0.0, max: 0.2, weight: 0.7 },
                aspectRatio: { min: 0.1, max: 0.8, weight: 0.7 },
                jawOpening: { min: 0.05, max: 0.2, weight: 0.6 },
                roundness: { min: 0.5, max: 0.9, weight: 0.6 }
            },

            // Silence
            'sil': { // Silence/rest position
                mouthHeight: { min: 0.0, max: 0.2, weight: 0.4 },
                mouthWidth: { min: 0.0, max: 0.3, weight: 0.4 },
                aspectRatio: { min: 0.5, max: 2.0, weight: 0.3 },
                jawOpening: { min: 0.0, max: 0.1, weight: 0.5 },
                lipSeparation: { min: 0.0, max: 0.1, weight: 0.4 }
            }
        };
    }

    initializeFeatureWeights() {
        /**
         * Feature importance weights for different classification contexts
         */
        this.featureWeights = {
            global: {
                mouthHeight: 0.25,
                mouthWidth: 0.20,
                aspectRatio: 0.20,
                jawOpening: 0.15,
                lipSeparation: 0.10,
                roundness: 0.08,
                curvature: 0.02
            },
            vowels: {
                mouthHeight: 0.30,
                aspectRatio: 0.25,
                jawOpening: 0.20,
                roundness: 0.15,
                mouthWidth: 0.10
            },
            consonants: {
                lipSeparation: 0.25,
                mouthWidth: 0.20,
                aspectRatio: 0.20,
                jawOpening: 0.15,
                mouthHeight: 0.15,
                roundness: 0.05
            },
            plosives: {
                lipSeparation: 0.35,
                jawOpening: 0.25,
                mouthHeight: 0.20,
                mouthWidth: 0.15,
                aspectRatio: 0.05
            },
            fricatives: {
                aspectRatio: 0.30,
                mouthWidth: 0.25,
                jawOpening: 0.20,
                lipSeparation: 0.15,
                roundness: 0.10
            }
        };
    }

    initializePhonemeDatabase() {
        /**
         * Comprehensive phoneme database with linguistic properties
         */
        this.phonemeDatabase = {
            // Vowels
            'AA': { type: 'vowel', subtype: 'back', height: 'low', rounded: false, tense: false },
            'AE': { type: 'vowel', subtype: 'front', height: 'low', rounded: false, tense: false },
            'AH': { type: 'vowel', subtype: 'central', height: 'mid', rounded: false, tense: false },
            'AO': { type: 'vowel', subtype: 'back', height: 'low', rounded: true, tense: false },
            'AW': { type: 'diphthong', subtype: 'back', height: 'low', rounded: false, tense: false },
            'AY': { type: 'diphthong', subtype: 'front', height: 'low', rounded: false, tense: false },
            'EH': { type: 'vowel', subtype: 'front', height: 'mid', rounded: false, tense: false },
            'ER': { type: 'vowel', subtype: 'central', height: 'mid', rounded: false, tense: true },
            'EY': { type: 'diphthong', subtype: 'front', height: 'mid', rounded: false, tense: true },
            'IH': { type: 'vowel', subtype: 'front', height: 'high', rounded: false, tense: false },
            'IY': { type: 'vowel', subtype: 'front', height: 'high', rounded: false, tense: true },
            'OW': { type: 'diphthong', subtype: 'back', height: 'mid', rounded: true, tense: true },
            'OY': { type: 'diphthong', subtype: 'back', height: 'mid', rounded: true, tense: false },
            'UH': { type: 'vowel', subtype: 'back', height: 'high', rounded: true, tense: false },
            'UW': { type: 'vowel', subtype: 'back', height: 'high', rounded: true, tense: true },

            // Consonants - Plosives
            'B': { type: 'consonant', subtype: 'plosive', place: 'bilabial', voice: true },
            'P': { type: 'consonant', subtype: 'plosive', place: 'bilabial', voice: false },
            'D': { type: 'consonant', subtype: 'plosive', place: 'alveolar', voice: true },
            'T': { type: 'consonant', subtype: 'plosive', place: 'alveolar', voice: false },
            'G': { type: 'consonant', subtype: 'plosive', place: 'velar', voice: true },
            'K': { type: 'consonant', subtype: 'plosive', place: 'velar', voice: false },

            // Consonants - Fricatives
            'F': { type: 'consonant', subtype: 'fricative', place: 'labiodental', voice: false },
            'V': { type: 'consonant', subtype: 'fricative', place: 'labiodental', voice: true },
            'TH': { type: 'consonant', subtype: 'fricative', place: 'dental', voice: false },
            'DH': { type: 'consonant', subtype: 'fricative', place: 'dental', voice: true },
            'S': { type: 'consonant', subtype: 'fricative', place: 'alveolar', voice: false },
            'Z': { type: 'consonant', subtype: 'fricative', place: 'alveolar', voice: true },
            'SH': { type: 'consonant', subtype: 'fricative', place: 'postalveolar', voice: false },
            'ZH': { type: 'consonant', subtype: 'fricative', place: 'postalveolar', voice: true },
            'HH': { type: 'consonant', subtype: 'fricative', place: 'glottal', voice: false },

            // Consonants - Nasals
            'M': { type: 'consonant', subtype: 'nasal', place: 'bilabial', voice: true },
            'N': { type: 'consonant', subtype: 'nasal', place: 'alveolar', voice: true },
            'NG': { type: 'consonant', subtype: 'nasal', place: 'velar', voice: true },

            // Consonants - Liquids
            'L': { type: 'consonant', subtype: 'liquid', place: 'alveolar', voice: true, lateral: true },
            'R': { type: 'consonant', subtype: 'liquid', place: 'postalveolar', voice: true, lateral: false },

            // Consonants - Glides
            'W': { type: 'consonant', subtype: 'glide', place: 'labial-velar', voice: true },
            'Y': { type: 'consonant', subtype: 'glide', place: 'palatal', voice: true },

            // Consonants - Affricates
            'CH': { type: 'consonant', subtype: 'affricate', place: 'postalveolar', voice: false },
            'JH': { type: 'consonant', subtype: 'affricate', place: 'postalveolar', voice: true },

            // Special
            'sil': { type: 'silence', subtype: 'pause', place: null, voice: false }
        };

        // Create phoneme groups for efficient classification
        this.phonemeGroups = {
            vowels: ['AA', 'AE', 'AH', 'AO', 'EH', 'ER', 'IH', 'IY', 'UH', 'UW'],
            diphthongs: ['AW', 'AY', 'EY', 'OW', 'OY'],
            plosives: ['B', 'P', 'D', 'T', 'G', 'K'],
            fricatives: ['F', 'V', 'TH', 'DH', 'S', 'Z', 'SH', 'ZH', 'HH'],
            nasals: ['M', 'N', 'NG'],
            liquids: ['L', 'R'],
            glides: ['W', 'Y'],
            affricates: ['CH', 'JH'],
            bilabial: ['B', 'P', 'M'],
            rounded: ['AO', 'UH', 'UW', 'OW', 'W']
        };
    }

    /**
     * Main phoneme classification method
     * @param {Object} features - Geometric features extracted from landmarks
     * @param {Object} options - Classification options
     * @returns {String} Most likely phoneme
     */
    async classifyPhoneme(features, options = {}) {
        try {
            if (!features || Object.keys(features).length === 0) {
                return 'sil';
            }

            // Normalize features
            const normalizedFeatures = this.normalizeFeatures(features);

            // Get phoneme candidates using rule-based classification
            const candidates = this.getRuleBased Candidates(normalizedFeatures);

            // Apply machine learning-inspired scoring if enabled
            if (this.options.useMLClassification) {
                const mlScores = await this.applyMLClassification(normalizedFeatures, candidates);
                candidates.forEach((candidate, index) => {
                    candidate.score = (candidate.score + mlScores[index]) / 2;
                });
            }

            // Apply fuzzy matching for edge cases
            if (this.options.enableFuzzyMatching) {
                this.applyFuzzyMatching(normalizedFeatures, candidates);
            }

            // Sort by confidence and return best match
            candidates.sort((a, b) => b.score - a.score);

            if (this.options.debugMode) {
                console.log('Phoneme classification candidates:', candidates.slice(0, 5));
            }

            return candidates.length > 0 ? candidates[0].phoneme : 'sil';

        } catch (error) {
            console.warn('Error in phoneme classification:', error);
            return 'sil';
        }
    }

    /**
     * Get alternative phoneme predictions
     * @param {Object} features - Geometric features
     * @param {Number} count - Number of alternatives to return
     * @returns {Array} Alternative phonemes with confidence scores
     */
    async getAlternativePhonemes(features, count = 3) {
        const normalizedFeatures = this.normalizeFeatures(features);
        const candidates = this.getRuleBasedCandidates(normalizedFeatures);
        
        return candidates
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(candidate => ({
                phoneme: candidate.phoneme,
                confidence: candidate.score
            }));
    }

    /**
     * Normalize feature values to [0, 1] range
     */
    normalizeFeatures(features) {
        const normalized = {};
        
        // Define expected ranges for normalization
        const ranges = {
            mouthWidth: { min: 0, max: 0.15 },
            mouthHeight: { min: 0, max: 0.12 },
            mouthArea: { min: 0, max: 0.01 },
            aspectRatio: { min: 0, max: 5 },
            lipSeparation: { min: 0, max: 0.1 },
            curvature: { min: -0.05, max: 0.05 },
            roundness: { min: 0, max: 1 },
            jawOpening: { min: 0, max: 0.15 }
        };

        for (const [feature, value] of Object.entries(features)) {
            if (ranges[feature] && typeof value === 'number') {
                const range = ranges[feature];
                normalized[feature] = Math.max(0, Math.min(1, 
                    (value - range.min) / (range.max - range.min)
                ));
            } else {
                normalized[feature] = value;
            }
        }

        return normalized;
    }

    /**
     * Rule-based candidate generation
     */
    getRuleBasedCandidates(features) {
        const candidates = [];

        for (const [phoneme, rules] of Object.entries(this.classificationRules)) {
            let score = 0;
            let ruleCount = 0;

            for (const [feature, rule] of Object.entries(rules)) {
                if (features[feature] !== undefined) {
                    const value = features[feature];
                    const weight = rule.weight || 1.0;
                    
                    // Check if value falls within rule range
                    if (value >= rule.min && value <= rule.max) {
                        // Calculate proximity to optimal range
                        const center = (rule.min + rule.max) / 2;
                        const distance = Math.abs(value - center);
                        const maxDistance = (rule.max - rule.min) / 2;
                        const proximity = 1 - (distance / maxDistance);
                        
                        score += proximity * weight;
                    } else {
                        // Penalty for values outside range
                        const penalty = Math.min(
                            Math.abs(value - rule.min),
                            Math.abs(value - rule.max)
                        );
                        score -= penalty * weight * 0.5;
                    }
                    
                    ruleCount++;
                }
            }

            if (ruleCount > 0) {
                // Normalize score by number of applicable rules
                const normalizedScore = score / ruleCount;
                candidates.push({
                    phoneme: phoneme,
                    score: Math.max(0, Math.min(1, normalizedScore)),
                    ruleCount: ruleCount
                });
            }
        }

        return candidates;
    }

    /**
     * Apply machine learning-inspired classification
     * Uses statistical patterns and feature correlations
     */
    async applyMLClassification(features, candidates) {
        // Simulate ML classification with weighted feature analysis
        const mlScores = candidates.map(candidate => {
            const phonemeInfo = this.phonemeDatabase[candidate.phoneme];
            let score = candidate.score;

            // Apply phoneme type weights
            const weights = this.getTypeWeights(phonemeInfo.type);
            
            for (const [feature, value] of Object.entries(features)) {
                if (weights[feature]) {
                    // Apply feature-specific weighting based on phoneme type
                    score *= (1 + weights[feature] * 0.1);
                }
            }

            // Apply linguistic constraints
            score = this.applyLinguisticConstraints(score, candidate.phoneme, features);

            return Math.max(0, Math.min(1, score));
        });

        return mlScores;
    }

    /**
     * Get feature weights based on phoneme type
     */
    getTypeWeights(phonemeType) {
        switch (phonemeType) {
            case 'vowel':
            case 'diphthong':
                return this.featureWeights.vowels;
            case 'consonant':
                return this.featureWeights.consonants;
            default:
                return this.featureWeights.global;
        }
    }

    /**
     * Apply linguistic constraints to improve accuracy
     */
    applyLinguisticConstraints(score, phoneme, features) {
        const phonemeInfo = this.phonemeDatabase[phoneme];
        
        // Boost score for phonemes that match linguistic expectations
        if (phonemeInfo.type === 'vowel' && features.jawOpening > 0.3) {
            score *= 1.2; // Vowels typically have more jaw opening
        }
        
        if (phonemeInfo.place === 'bilabial' && features.lipSeparation < 0.1) {
            score *= 1.3; // Bilabial consonants have lip contact
        }
        
        if (phonemeInfo.rounded && features.roundness > 0.6) {
            score *= 1.2; // Rounded phonemes have round mouth shape
        }
        
        if (phoneme === 'sil' && features.mouthHeight < 0.1 && features.lipSeparation < 0.05) {
            score *= 1.4; // Silence has minimal mouth movement
        }

        return score;
    }

    /**
     * Apply fuzzy matching for edge cases and transitions
     */
    applyFuzzyMatching(features, candidates) {
        // Implement fuzzy logic for borderline cases
        candidates.forEach(candidate => {
            const phonemeInfo = this.phonemeDatabase[candidate.phoneme];
            
            // Apply fuzzy rules based on phonetic similarity
            if (phonemeInfo.type === 'vowel') {
                // Boost similar vowels
                const similarVowels = this.getSimilarPhonemes(candidate.phoneme);
                similarVowels.forEach(similar => {
                    const similarCandidate = candidates.find(c => c.phoneme === similar);
                    if (similarCandidate && similarCandidate.score > 0.3) {
                        candidate.score += 0.05; // Small boost for phonetic similarity
                    }
                });
            }
            
            // Apply temporal consistency (would need previous frame data)
            // This is a placeholder for temporal fuzzy logic
            if (candidate.score > 0.4 && candidate.score < 0.6) {
                candidate.score += 0.1; // Boost borderline candidates
            }
        });
    }

    /**
     * Get phonetically similar phonemes
     */
    getSimilarPhonemes(phoneme) {
        const similarity = {
            'AA': ['AO', 'AH'],
            'AE': ['EH', 'AH'],
            'IY': ['IH', 'EY'],
            'UW': ['UH', 'OW'],
            'B': ['P', 'M'],
            'D': ['T', 'N'],
            'G': ['K', 'NG'],
            'F': ['V'],
            'S': ['Z'],
            'SH': ['ZH', 'CH'],
            'TH': ['DH']
        };
        
        return similarity[phoneme] || [];
    }

    /**
     * Calculate feature-phoneme consistency score
     */
    calculateConsistency(features, phoneme) {
        const rules = this.classificationRules[phoneme];
        if (!rules) return 0.5;

        let consistency = 0;
        let count = 0;

        for (const [feature, rule] of Object.entries(rules)) {
            if (features[feature] !== undefined) {
                const value = features[feature];
                if (value >= rule.min && value <= rule.max) {
                    consistency += 1;
                }
                count++;
            }
        }

        return count > 0 ? consistency / count : 0.5;
    }

    /**
     * Get phoneme information from database
     */
    getPhonemeInfo(phoneme) {
        return this.phonemeDatabase[phoneme] || null;
    }

    /**
     * Check if phoneme belongs to a specific group
     */
    isPhonemeInGroup(phoneme, group) {
        return this.phonemeGroups[group] && this.phonemeGroups[group].includes(phoneme);
    }

    /**
     * Get all phonemes in a specific group
     */
    getPhonemeGroup(group) {
        return this.phonemeGroups[group] || [];
    }

    /**
     * Update classification rules dynamically
     */
    updateClassificationRule(phoneme, feature, rule) {
        if (this.classificationRules[phoneme]) {
            this.classificationRules[phoneme][feature] = rule;
        }
    }

    /**
     * Get classification statistics
     */
    getClassificationStats() {
        return {
            totalPhonemes: Object.keys(this.classificationRules).length,
            phonemeGroups: Object.keys(this.phonemeGroups).length,
            featuresUsed: Object.keys(this.featureWeights.global).length,
            classificationRules: Object.keys(this.classificationRules).reduce((total, phoneme) => {
                return total + Object.keys(this.classificationRules[phoneme]).length;
            }, 0)
        };
    }
}

export default LandmarkToVisemeMapping;