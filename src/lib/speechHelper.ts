import * as Speech from 'expo-speech';

/**
 * Universal Text-to-Speech helper for Tamil (ta-IN) and English (en-US).
 * Works across Web browsers and native Android APKs built via Expo.
 */
export const speakText = async (text: string, isTamil: boolean) => {
  try {
    Speech.stop();

    if (!text || text.trim() === '') return;

    if (isTamil) {
      // Check available voices on device
      const voices = await Speech.getAvailableVoicesAsync();
      const tamilVoice = voices.find(v => 
        v.language.toLowerCase().includes('ta') || 
        v.language.toLowerCase().includes('tamil') ||
        v.identifier.toLowerCase().includes('ta')
      );

      if (tamilVoice) {
        Speech.speak(text, {
          voice: tamilVoice.identifier,
          language: tamilVoice.language,
          pitch: 1.0,
          rate: 0.85
        });
      } else {
        // Fallback to standard ta-IN language code for Android Google TTS
        Speech.speak(text, {
          language: 'ta-IN',
          pitch: 1.0,
          rate: 0.85
        });
      }
    } else {
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9
      });
    }
  } catch (error) {
    console.warn("Speech synthesis notice:", error);
  }
};
