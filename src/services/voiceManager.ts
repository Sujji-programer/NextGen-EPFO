/**
 * VoiceManager for PF Sahayak
 * Handles browser-native SpeechRecognition and SpeechSynthesis safely.
 */

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class VoiceManager {
  private static recognitionInstance: any = null;

  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && typeof window.speechSynthesis.speak === 'function';
  }

  public static startListening(
    language: 'en' | 'hi' = 'en',
    handlers: SpeechRecognitionHandlers
  ): { stop: () => void } | null {
    if (!this.isSpeechRecognitionSupported()) {
      handlers.onError?.('Voice input is not available in this browser. Please type your question.');
      return null;
    }

    try {
      this.stopListening();

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        handlers.onStart?.();
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          handlers.onResult?.(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        let message = 'Voice input could not detect audio. Please type your question.';
        if (event.error === 'not-allowed') {
          message = 'Microphone access was denied. Please allow microphone permissions.';
        } else if (event.error === 'network') {
          message = 'Network error during voice recognition.';
        }
        handlers.onError?.(message);
      };

      recognition.onend = () => {
        handlers.onEnd?.();
      };

      recognition.start();
      this.recognitionInstance = recognition;

      return {
        stop: () => this.stopListening(),
      };
    } catch {
      handlers.onError?.('Voice input could not be started. Please type your question.');
      return null;
    }
  }

  public static stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {
        // ignore already stopped error
      }
      this.recognitionInstance = null;
    }
  }

  public static speak(text: string, language: 'en' | 'hi' = 'en', onEnd?: () => void): void {
    if (!this.isSpeechSynthesisSupported()) return;

    try {
      window.speechSynthesis.cancel(); // cancel prior speech

      // Clean text for speech (strip markdown asterisks, hashes, etc.)
      const cleaned = text.replace(/[*_#`~]/g, '').trim();
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Fallback silently if speech synthesis fails
    }
  }

  public static stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}
