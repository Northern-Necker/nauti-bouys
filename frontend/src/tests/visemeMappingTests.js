/**
 * Viseme Mapping Unit Tests
 * Jest test suite for validating viseme mapping accuracy
 */

import { 
  PHONEME_TO_VISEME, 
  textToPhonemes, 
  phonemesToVisemes,
  textToVisemes,
  createVisemeAnimation
} from '../utils/speechProcessing';
import { 
  VisemeMap, 
  Reallusion, 
  VisemeToReallusion 
} from '../utils/convaiReallusion';

describe('Phoneme to Viseme Mapping', () => {
  describe('PHONEME_TO_VISEME mapping', () => {
    test('should map silence phonemes to viseme 0', () => {
      expect(PHONEME_TO_VISEME['sil']).toBe(0);
      expect(PHONEME_TO_VISEME['pau']).toBe(0);
      expect(PHONEME_TO_VISEME['sp']).toBe(0);
    });

    test('should map bilabial plosives to viseme 1', () => {
      expect(PHONEME_TO_VISEME['p']).toBe(1);
      expect(PHONEME_TO_VISEME['b']).toBe(1);
      expect(PHONEME_TO_VISEME['m']).toBe(1);
    });

    test('should map labiodental fricatives to viseme 2', () => {
      expect(PHONEME_TO_VISEME['f']).toBe(2);
      expect(PHONEME_TO_VISEME['v']).toBe(2);
    });

    test('should map dental fricatives to viseme 3', () => {
      expect(PHONEME_TO_VISEME['th']).toBe(3);
      expect(PHONEME_TO_VISEME['dh']).toBe(3);
    });

    test('should map alveolar plosives to viseme 4', () => {
      expect(PHONEME_TO_VISEME['t']).toBe(4);
      expect(PHONEME_TO_VISEME['d']).toBe(4);
      expect(PHONEME_TO_VISEME['n']).toBe(4);
      expect(PHONEME_TO_VISEME['l']).toBe(4);
    });

    test('should map velar plosives to viseme 5', () => {
      expect(PHONEME_TO_VISEME['k']).toBe(5);
      expect(PHONEME_TO_VISEME['g']).toBe(5);
    });

    test('should map postalveolar affricates to viseme 6', () => {
      expect(PHONEME_TO_VISEME['ch']).toBe(6);
      expect(PHONEME_TO_VISEME['jh']).toBe(6);
      expect(PHONEME_TO_VISEME['sh']).toBe(6);
    });

    test('should map alveolar fricatives to viseme 7', () => {
      expect(PHONEME_TO_VISEME['s']).toBe(7);
      expect(PHONEME_TO_VISEME['z']).toBe(7);
    });

    test('should map nasal consonants correctly', () => {
      expect(PHONEME_TO_VISEME['ng']).toBe(8);
    });

    test('should map liquids to viseme 9', () => {
      expect(PHONEME_TO_VISEME['r']).toBe(9);
      expect(PHONEME_TO_VISEME['er']).toBe(9);
    });

    test('should map open vowels to viseme 10', () => {
      expect(PHONEME_TO_VISEME['aa']).toBe(10);
      expect(PHONEME_TO_VISEME['ae']).toBe(10);
      expect(PHONEME_TO_VISEME['ah']).toBe(10);
    });

    test('should map front vowels to viseme 11', () => {
      expect(PHONEME_TO_VISEME['eh']).toBe(11);
      expect(PHONEME_TO_VISEME['ey']).toBe(11);
    });

    test('should map close front vowels to viseme 12', () => {
      expect(PHONEME_TO_VISEME['ih']).toBe(12);
      expect(PHONEME_TO_VISEME['iy']).toBe(12);
    });

    test('should map back vowels to viseme 13', () => {
      expect(PHONEME_TO_VISEME['oh']).toBe(13);
      expect(PHONEME_TO_VISEME['ow']).toBe(13);
    });

    test('should map close back vowels to viseme 14', () => {
      expect(PHONEME_TO_VISEME['uh']).toBe(14);
      expect(PHONEME_TO_VISEME['uw']).toBe(14);
    });
  });

  describe('textToPhonemes', () => {
    test('should convert simple words to phonemes', () => {
      const phonemes = textToPhonemes('hello');
      expect(phonemes).toContain('h');
      expect(phonemes).toContain('eh');
      expect(phonemes).toContain('l');
      expect(phonemes).toContain('oh');
    });

    test('should add pauses between words', () => {
      const phonemes = textToPhonemes('hello world');
      expect(phonemes).toContain('pau');
    });

    test('should handle empty input', () => {
      expect(textToPhonemes('')).toEqual([]);
      expect(textToPhonemes(null)).toEqual([]);
      expect(textToPhonemes(undefined)).toEqual([]);
    });

    test('should handle special characters', () => {
      const phonemes = textToPhonemes('test! @#$ 123');
      expect(phonemes).not.toContain('!');
      expect(phonemes).not.toContain('@');
      expect(phonemes).not.toContain('#');
    });

    test('should convert consonant clusters', () => {
      const phonemes = textToPhonemes('think');
      expect(phonemes).toContain('th');
      expect(phonemes).toContain('ih');
      expect(phonemes).toContain('ng');
      expect(phonemes).toContain('k');
    });

    test('should convert vowel digraphs', () => {
      const phonemes = textToPhonemes('feet');
      expect(phonemes).toContain('f');
      expect(phonemes).toContain('iy');
      expect(phonemes).toContain('t');
    });
  });

  describe('phonemesToVisemes', () => {
    test('should convert phonemes to viseme objects', () => {
      const phonemes = ['p', 'aa', 'pau', 'f', 'ih'];
      const visemes = phonemesToVisemes(phonemes);
      
      expect(visemes[0]).toEqual({ 1: 1.0 }); // p -> PP
      expect(visemes[1]).toEqual({ 10: 1.0 }); // aa -> AA
      expect(visemes[2]).toEqual({ 0: 1.0 }); // pau -> sil
      expect(visemes[3]).toEqual({ 2: 1.0 }); // f -> FF
      expect(visemes[4]).toEqual({ 12: 1.0 }); // ih -> I
    });

    test('should handle unknown phonemes as silence', () => {
      const phonemes = ['xyz', 'unknown'];
      const visemes = phonemesToVisemes(phonemes);
      
      expect(visemes[0]).toEqual({ 0: 1.0 });
      expect(visemes[1]).toEqual({ 0: 1.0 });
    });

    test('should handle empty input', () => {
      expect(phonemesToVisemes([])).toEqual([]);
      expect(phonemesToVisemes(null)).toEqual([]);
    });
  });

  describe('textToVisemes', () => {
    test('should convert text directly to visemes with timing', () => {
      const visemes = textToVisemes('hi', { duration: 100, intensity: 0.8 });
      
      expect(visemes.length).toBeGreaterThan(0);
      expect(visemes[0]).toHaveProperty('timestamp');
      expect(visemes[0]).toHaveProperty('duration');
      expect(visemes[0]).toHaveProperty('intensity');
      expect(visemes[0].duration).toBe(100);
      expect(visemes[0].intensity).toBe(0.8);
    });

    test('should generate correct timestamps', () => {
      const visemes = textToVisemes('test', { duration: 200 });
      
      for (let i = 0; i < visemes.length; i++) {
        expect(visemes[i].timestamp).toBe(i * 200);
      }
    });
  });

  describe('createVisemeAnimation', () => {
    test('should create animation sequence with word timing', () => {
      const animation = createVisemeAnimation('hello world', {
        wordsPerMinute: 120,
        pauseDuration: 100
      });
      
      expect(animation.length).toBeGreaterThan(0);
      
      // Should have pauses between words
      const pauses = animation.filter(a => a.viseme[0] === 1.0 && a.word === null);
      expect(pauses.length).toBeGreaterThan(0);
      
      // Should have word associations
      const helloFrames = animation.filter(a => a.word === 'hello');
      expect(helloFrames.length).toBeGreaterThan(0);
    });

    test('should calculate correct timing for speech rate', () => {
      const wpm = 150;
      const animation = createVisemeAnimation('test', { wordsPerMinute: wpm });
      
      const millisecondsPerWord = (60 * 1000) / wpm;
      expect(millisecondsPerWord).toBe(400);
      
      // Check that total animation time is reasonable
      const totalTime = animation[animation.length - 1].startTime + 
                       animation[animation.length - 1].duration;
      expect(totalTime).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(1000); // Should be less than 1 second for "test"
    });
  });
});

describe('Conv-AI Viseme to Reallusion Mapping', () => {
  describe('VisemeMap', () => {
    test('should have correct viseme name mappings', () => {
      expect(VisemeMap[0]).toBe('sil');
      expect(VisemeMap[1]).toBe('PP');
      expect(VisemeMap[2]).toBe('FF');
      expect(VisemeMap[3]).toBe('TH');
      expect(VisemeMap[4]).toBe('DD');
      expect(VisemeMap[5]).toBe('KK');
      expect(VisemeMap[6]).toBe('CH');
      expect(VisemeMap[7]).toBe('SS');
      expect(VisemeMap[8]).toBe('NN');
      expect(VisemeMap[9]).toBe('RR');
      expect(VisemeMap[10]).toBe('AA');
      expect(VisemeMap[11]).toBe('E');
      expect(VisemeMap[12]).toBe('I');
      expect(VisemeMap[13]).toBe('O');
      expect(VisemeMap[14]).toBe('U');
    });
  });

  describe('Reallusion morph targets', () => {
    test('should have silence configuration with all zeros', () => {
      const sil = Reallusion.sil;
      expect(sil.Mouth_Drop_Lower).toBe(0);
      expect(sil.Open_Jaw).toBe(0);
      expect(sil.V_Explosive).toBe(0);
      
      // Check all values are 0
      Object.values(sil).forEach(value => {
        expect(value).toBe(0);
      });
    });

    test('should have correct PP (bilabial) configuration', () => {
      const pp = Reallusion.PP;
      expect(pp.V_Explosive).toBe(1.0);
      expect(pp.Mouth_Roll_In_Upper_L).toBe(0.3);
      expect(pp.Mouth_Roll_In_Upper_R).toBe(0.3);
      expect(pp.Open_Jaw).toBe(0.1);
    });

    test('should have correct FF (labiodental) configuration', () => {
      const ff = Reallusion.FF;
      expect(ff.V_Dental_Lip).toBe(1.0);
      expect(ff.Mouth_Funnel_Down_L).toBe(0.2);
      expect(ff.Mouth_Funnel_Down_R).toBe(0.2);
    });

    test('should have correct AA (open vowel) configuration', () => {
      const aa = Reallusion.AA;
      expect(aa.Open_Jaw).toBe(0.2);
      expect(aa.Mouth_Drop_Lower).toBe(0.2);
      expect(aa.Mouth_Frown_L).toBe(0.2);
      expect(aa.Mouth_Frown_R).toBe(0.2);
    });
  });

  describe('VisemeToReallusion function', () => {
    test('should convert single viseme to morph targets', () => {
      const blendShapeRef = { current: [] };
      const viseme = { 1: 1.0 }; // PP viseme
      
      VisemeToReallusion(viseme, blendShapeRef);
      
      expect(blendShapeRef.current.length).toBe(1);
      const morphTargets = blendShapeRef.current[0];
      
      expect(morphTargets.V_Explosive).toBe(1.0);
      expect(morphTargets.Mouth_Roll_In_Upper_L).toBe(0.3);
      expect(morphTargets.Mouth_Roll_In_Upper_R).toBe(0.3);
    });

    test('should handle multiple visemes with blending', () => {
      const blendShapeRef = { current: [] };
      const viseme = { 
        1: 0.5,  // PP at 50%
        10: 0.5  // AA at 50%
      };
      
      VisemeToReallusion(viseme, blendShapeRef);
      
      const morphTargets = blendShapeRef.current[0];
      
      // PP contributions at 50%
      expect(morphTargets.V_Explosive).toBe(0.5);
      expect(morphTargets.Mouth_Roll_In_Upper_L).toBe(0.15); // 0.3 * 0.5
      
      // AA contributions at 50%
      expect(morphTargets.Mouth_Drop_Lower).toBeCloseTo(0.1); // 0.2 * 0.5
      expect(morphTargets.Open_Jaw).toBeCloseTo(0.15); // 0.1 * 0.5 + 0.2 * 0.5
    });

    test('should handle special PP viseme boost for low values', () => {
      const blendShapeRef = { current: [] };
      const viseme = { 1: 0.1 }; // PP viseme with low value
      
      VisemeToReallusion(viseme, blendShapeRef);
      
      const morphTargets = blendShapeRef.current[0];
      
      // Should be boosted by 1.5x
      expect(morphTargets.V_Explosive).toBe(0.15); // 0.1 * 1.5
    });

    test('should initialize all morph targets to zero', () => {
      const blendShapeRef = { current: [] };
      const viseme = { 0: 1.0 }; // Silence
      
      VisemeToReallusion(viseme, blendShapeRef);
      
      const morphTargets = blendShapeRef.current[0];
      
      // All values should be 0
      Object.values(morphTargets).forEach(value => {
        expect(value).toBe(0);
      });
    });
  });
});

describe('Viseme Animation Integration', () => {
  test('should create smooth transitions between visemes', () => {
    const text = 'pa fa';
    const animation = createVisemeAnimation(text);
    
    // Should have visemes for p, a, pause, f, a
    expect(animation.length).toBeGreaterThanOrEqual(5);
    
    // Check transitions
    const pViseme = animation.find(a => a.word === 'pa');
    const fViseme = animation.find(a => a.word === 'fa');
    
    expect(pViseme).toBeDefined();
    expect(fViseme).toBeDefined();
  });

  test('should handle complex sentences correctly', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const animation = createVisemeAnimation(text);
    
    // Should have many frames
    expect(animation.length).toBeGreaterThan(20);
    
    // Should have pauses between words
    const pauses = animation.filter(a => a.viseme[0] === 1.0);
    expect(pauses.length).toBeGreaterThanOrEqual(8); // 8 word boundaries
  });

  test('should respect timing parameters', () => {
    const text = 'test';
    const wpm = 60; // 1 word per second
    const animation = createVisemeAnimation(text, { wordsPerMinute: wpm });
    
    const lastFrame = animation[animation.length - 1];
    const totalTime = lastFrame.startTime + lastFrame.duration;
    
    // Should be approximately 1 second (1000ms)
    expect(totalTime).toBeGreaterThan(800);
    expect(totalTime).toBeLessThan(1200);
  });
});