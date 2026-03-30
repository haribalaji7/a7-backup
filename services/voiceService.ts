import axios from 'axios';

export type LanguageCode = "en" | "ta" | "hi" | "te" | "ml" | "kn";

export const LANGUAGES: Record<LanguageCode, { 
  name: string; 
  bcp47: string; 
  translationCode: string;
  speechLang: string;
}> = {
  en: { name: "English", bcp47: "en-IN", translationCode: "en", speechLang: "en-IN" },
  ta: { name: "Tamil", bcp47: "ta-IN", translationCode: "ta", speechLang: "ta-IN" },
  hi: { name: "Hindi", bcp47: "hi-IN", translationCode: "hi", speechLang: "hi-IN" },
  te: { name: "Telugu", bcp47: "te-IN", translationCode: "te", speechLang: "te-IN" },
  ml: { name: "Malayalam", bcp47: "ml-IN", translationCode: "ml", speechLang: "ml-IN" },
  kn: { name: "Kannada", bcp47: "kn-IN", translationCode: "kn", speechLang: "kn-IN" }
};

let currentAudio: HTMLAudioElement | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

async function transcribeViaApi(audioBlob: Blob, lang: LanguageCode): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('language', lang);

    const response = await axios.post('/api/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    if (response.data?.text) {
      return response.data.text;
    }
  } catch (error) {
    console.warn("API transcription failed:", error);
  }
  
  throw new Error("API transcription failed");
}

async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === "en") return text;
  
  try {
    const response = await axios.post(
      "https://translate.argosopentech.com/translate",
      { q: text, source: "en", target: targetLang, format: "text" },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return response.data?.translatedText || text;
  } catch {
    return text;
  }
}

export const voiceService = {
  detectLanguage(): LanguageCode {
    return 'en';
  },

  isBrowserSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  },

  async startListening(
    lang: LanguageCode,
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onInterim?: (text: string) => void
  ): Promise<void> {
    if (typeof window === 'undefined') {
      onError("Not supported");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      onError("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES[lang].speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let lastInterim = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          lastInterim = "";
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (interimTranscript && interimTranscript !== lastInterim) {
        lastInterim = interimTranscript;
        onInterim?.(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'no-speech') {
        onError("No speech detected. Please speak clearly and try again.");
      } else if (event.error === 'not-allowed') {
        onError("Microphone access denied. Please allow microphone access.");
      } else {
        onError("Speech recognition error. Please type your question.");
      }
    };

    recognition.onend = () => {
      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim());
      } else {
        onError("No speech detected. Please speak clearly and try again.");
      }
    };

    try {
      recognition.start();
      (window as any).__currentRecognition = recognition;
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (error) {
      console.error("Failed to start recognition:", error);
      onError("Failed to start speech recognition");
    }
  },

  stopListening(
    lang: LanguageCode,
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onFallback?: () => void
  ): void {
    const recognition = (window as any).__currentRecognition;
    if (recognition) {
      try {
        recognition.stop();
      } catch { /* ignore */ }
      (window as any).__currentRecognition = null;
    }
  },

  async startRecording(
    onError: (err: string) => void
  ): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Failed to start recording:", error);
      onError("Failed to access microphone");
    }
  },

  async stopRecording(
    lang: LanguageCode,
    onResult: (text: string) => void,
    onError: (err: string) => void
  ): Promise<void> {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      onError("No recording in progress");
      return;
    }

    return new Promise((resolve) => {
      mediaRecorder!.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        try {
          const text = await transcribeViaApi(audioBlob, lang);
          if (text.trim()) {
            onResult(text.trim());
          } else {
            onError("Could not understand audio. Please try again or type your question.");
          }
        } catch {
          onError("Transcription failed. Please type your question.");
        }
        
        resolve();
      };

      mediaRecorder!.stop();
    });
  },

  abortListening(): void {
    const recognition = (window as any).__currentRecognition;
    if (recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
      (window as any).__currentRecognition = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  },

  async cloudTextToSpeech(
    text: string, 
    lang: LanguageCode,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): Promise<void> {
    if (typeof window === 'undefined') {
      onEnd?.();
      return;
    }

    this.stopSpeech();
    onStart?.();
    this.browserTextToSpeech(text, lang, onEnd, onError);
  },

  browserTextToSpeech(
    text: string, 
    lang: LanguageCode,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): void {
    if (typeof window === 'undefined') {
      onEnd?.();
      return;
    }

    try {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANGUAGES[lang].bcp47;
      
      const voices = speechSynthesis.getVoices();
      const bcpPrefix = LANGUAGES[lang].bcp47.split('-')[0];
      const voice = voices.find(v => v.lang.startsWith(bcpPrefix));
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = lang === "en" ? 1.0 : 1.1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();

      speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  },

  textToSpeech(text: string, lang: LanguageCode): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      try {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANGUAGES[lang].bcp47;
        
        const voices = speechSynthesis.getVoices();
        const bcpPrefix = LANGUAGES[lang].bcp47.split('-')[0];
        const voice = voices.find(v => v.lang.startsWith(bcpPrefix));
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.rate = lang === "en" ? 1.0 : 1.1;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  },

  stopSpeech(): void {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    speechSynthesis.cancel();
    this.abortListening();
  },

  async translateToRegional(text: string, targetLang: LanguageCode): Promise<string> {
    if (targetLang === "en") return text;
    return translateText(text, LANGUAGES[targetLang].translationCode);
  },

  isPlaying(): boolean {
    return speechSynthesis.speaking;
  }
};

let stream: MediaStream | null = null;
