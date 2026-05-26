import axios from 'axios';
import type { LanguageCode } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types for Web Speech API (to avoid 'any' types)
// ─────────────────────────────────────────────────────────────────────────────
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export const LANGUAGES: Partial<Record<LanguageCode, { 
  name: string; 
  bcp47: string; 
  translationCode: string;
  speechLang: string;
}>> = {
  en: { name: "English", bcp47: "en-IN", translationCode: "en", speechLang: "en-IN" },
  hi: { name: "Hindi", bcp47: "hi-IN", translationCode: "hi", speechLang: "hi-IN" },
  bn: { name: "Bengali", bcp47: "bn-IN", translationCode: "bn", speechLang: "bn-IN" },
  ta: { name: "Tamil", bcp47: "ta-IN", translationCode: "ta", speechLang: "ta-IN" },
  te: { name: "Telugu", bcp47: "te-IN", translationCode: "te", speechLang: "te-IN" },
  mr: { name: "Marathi", bcp47: "mr-IN", translationCode: "mr", speechLang: "mr-IN" },
  gu: { name: "Gujarati", bcp47: "gu-IN", translationCode: "gu", speechLang: "gu-IN" },
  pa: { name: "Punjabi", bcp47: "pa-IN", translationCode: "pa", speechLang: "pa-IN" },
  ml: { name: "Malayalam", bcp47: "ml-IN", translationCode: "ml", speechLang: "ml-IN" },
  kn: { name: "Kannada", bcp47: "kn-IN", translationCode: "kn", speechLang: "kn-IN" },
  or: { name: "Odia", bcp47: "or-IN", translationCode: "or", speechLang: "or-IN" },
  as: { name: "Assamese", bcp47: "as-IN", translationCode: "as", speechLang: "as-IN" },
  ne: { name: "Nepali", bcp47: "ne-IN", translationCode: "ne", speechLang: "ne-IN" },
  ur: { name: "Urdu", bcp47: "ur-IN", translationCode: "ur", speechLang: "ur-IN" },
  sa: { name: "Sanskrit", bcp47: "sa-IN", translationCode: "sa", speechLang: "sa-IN" },
  ks: { name: "Kashmiri", bcp47: "ks-IN", translationCode: "ks", speechLang: "ks-IN" },
  sd: { name: "Sindhi", bcp47: "sd-IN", translationCode: "sd", speechLang: "sd-IN" },
  mai: { name: "Maithili", bcp47: "mai-IN", translationCode: "mai", speechLang: "mai-IN" },
  bo: { name: "Bodo", bcp47: "brx-IN", translationCode: "bo", speechLang: "brx-IN" },
  doi: { name: "Dogri", bcp47: "doi-IN", translationCode: "doi", speechLang: "doi-IN" },
  mni: { name: "Manipuri", bcp47: "mni-IN", translationCode: "mni", speechLang: "mni-IN" },
  kok: { name: "Konkani", bcp47: "kok-IN", translationCode: "kok", speechLang: "kok-IN" },
  sat: { name: "Santali", bcp47: "sat-IN", translationCode: "sat", speechLang: "sat-IN" },
};

function getLangConfig(lang: LanguageCode) {
  return LANGUAGES[lang] || LANGUAGES.en!;
}

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
    // Try to get language from browser or default to English
    if (typeof window !== 'undefined') {
      const lang = navigator.language;
      if (lang.startsWith('ta')) return 'ta';
      if (lang.startsWith('hi')) return 'hi';
      if (lang.startsWith('te')) return 'te';
      if (lang.startsWith('ml')) return 'ml';
      if (lang.startsWith('kn')) return 'kn';
      return 'en'; // Default to English
    }
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
    recognition.lang = getLangConfig(lang).speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let lastInterim = "";

     recognition.onresult = (event: SpeechRecognitionEvent) => {
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

     recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream = mediaStream;
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
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

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.unsupported) {
          this.browserTextToSpeech(text, lang, onEnd, onError);
          return;
        }
        throw new Error(data?.error || "TTS failed");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        onEnd?.();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        this.browserTextToSpeech(text, lang, onEnd, onError);
      };

      await audio.play();
    } catch (error: any) {
      console.warn("Cloud TTS failed, falling back to browser TTS:", error?.message);
      this.browserTextToSpeech(text, lang, onEnd, onError);
    }
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
      const cfg = getLangConfig(lang);
      utterance.lang = cfg.bcp47;
      
      const voices = speechSynthesis.getVoices();
      const bcpPrefix = cfg.bcp47.split('-')[0];
      const voice = voices.find(v => v.lang.startsWith(bcpPrefix));
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = lang === "en" ? 1.4 : 1.5;
      utterance.pitch = 1;
      utterance.volume = 1;
      
    utterance.onend = () => onEnd?.();
    utterance.onerror = (event) => onError?.(`Speech synthesis error: ${event?.error || 'Unknown error'}`);

      speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  },

   textToSpeech(text: string, lang: LanguageCode, onError?: (err: string) => void): Promise<void> {
     return new Promise<void>((resolve) => {
       if (typeof window === 'undefined') {
         resolve();
         return;
       }
 
       try {
         speechSynthesis.cancel();
         const utterance = new SpeechSynthesisUtterance(text);
         const cfg = getLangConfig(lang);
         utterance.lang = cfg.bcp47;
          
          const voices = speechSynthesis.getVoices();
          const bcpPrefix = cfg.bcp47.split('-')[0];
         const voice = voices.find(v => v.lang.startsWith(bcpPrefix));
         if (voice) {
           utterance.voice = voice;
         }
         
         utterance.rate = lang === "en" ? 1.4 : 1.5;
         utterance.onend = () => resolve();
         utterance.onerror = (event) => onError?.(`Speech synthesis error: ${event?.error || 'Unknown error'}`) || resolve();
         speechSynthesis.speak(utterance);
       } catch (error) {
         onError?.(`Text to speech failed: ${error instanceof Error ? error.message : String(error)}`);
         resolve();
       }
     });
   },

  stopSpeech(): void {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      currentAudio = null;
    }
    speechSynthesis.cancel();
    this.abortListening();
  },

  async translateToRegional(text: string, targetLang: LanguageCode): Promise<string> {
    if (targetLang === "en") return text;
    return translateText(text, getLangConfig(targetLang).translationCode);
  },

  isPlaying(): boolean {
    return speechSynthesis.speaking;
  }
};

let stream: MediaStream | null = null;
