import React, { forwardRef, useImperativeHandle, useCallback, useRef } from 'react';

const Avatar3DSpeech = forwardRef(({ onSpeakStart, onSpeakEnd }, ref) => {
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  
  const speak = useCallback((text) => {
    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        if (synthRef.current.speaking) {
          synthRef.current.cancel();
        }
        
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;
        
        // Configure voice settings
        utterance.lang = 'en-US';
        utterance.pitch = 1.1;
        utterance.rate = 0.95;
        utterance.volume = 1.0;
        
        // Try to use a female voice if available
        const voices = synthRef.current.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria') ||
          voice.name.toLowerCase().includes('karen')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        // Event handlers
        utterance.onstart = () => {
          console.log('Speech started:', text.substring(0, 50) + '...');
          if (onSpeakStart) onSpeakStart();
        };
        
        utterance.onend = () => {
          console.log('Speech ended');
          if (onSpeakEnd) onSpeakEnd();
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech error:', event);
          if (onSpeakEnd) onSpeakEnd();
          reject(event);
        };
        
        // Speak the text
        synthRef.current.speak(utterance);
        
      } catch (error) {
        console.error('Failed to speak:', error);
        reject(error);
      }
    });
  }, [onSpeakStart, onSpeakEnd]);
  
  const stop = useCallback(() => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      if (onSpeakEnd) onSpeakEnd();
    }
  }, [onSpeakEnd]);
  
  const pause = useCallback(() => {
    if (synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
    }
  }, []);
  
  const resume = useCallback(() => {
    if (synthRef.current.paused) {
      synthRef.current.resume();
    }
  }, []);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    speak,
    stop,
    pause,
    resume
  }));
  
  // No visual component needed
  return null;
});

Avatar3DSpeech.displayName = 'Avatar3DSpeech';

export default Avatar3DSpeech;