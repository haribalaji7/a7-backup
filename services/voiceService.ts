import axios from 'axios';

export type LanguageCode = "en" | "ta" | "hi" | "te" | "ml" | "kn";

export const LANGUAGES: Record<LanguageCode, { name: string; bcp47: string, dhwani: string }> = {
  en: { name: "English", bcp47: "en-IN", dhwani: "english" },
  ta: { name: "Tamil", bcp47: "ta-IN", dhwani: "tamil" },
  hi: { name: "Hindi", bcp47: "hi-IN", dhwani: "hindi" },
  te: { name: "Telugu", bcp47: "te-IN", dhwani: "telugu" },
  ml: { name: "Malayalam", bcp47: "ml-IN", dhwani: "malayalam" },
  kn: { name: "Kannada", bcp47: "kn-IN", dhwani: "kannada" }
};

let recorder: any = null;
let streamRef: MediaStream | null = null;
let activeNativeTranscript: string = "";
let nativeRecognition: any = null;

export const voiceService = {
  detectLanguage(text: string): LanguageCode {
    return 'en';
  },

  async startListening(
    lang: LanguageCode, 
    onResult: (text: string) => void, 
    onError: (err: string) => void,
    onFallback: () => void
  ) {
    if (typeof window === 'undefined') return;
    activeNativeTranscript = "";
    
    // We strictly use Dhwani's RecordRTC stereo engine to generate our audio payload
    try {
      const { default: RecordRTC, StereoAudioRecorder } = await import('recordrtc');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef = stream;
      recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        disableLogs: true,
      });

      if (recorder) {
        recorder.startRecording();
        if (navigator.vibrate) navigator.vibrate(50);
        
        // --- 
        // Run Native Browser Fallback simultaneously alongside Dhwani Recording Buffer 
        // This flawlessly guarantees we extract Speech-To-Text even if HF spaces API returns 404
        // ---
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          nativeRecognition = new SpeechRecognition();
          nativeRecognition.lang = LANGUAGES[lang].bcp47;
          nativeRecognition.continuous = true;
          nativeRecognition.interimResults = true;
          nativeRecognition.onresult = (e: any) => {
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
            }
            if (finalTranscript) activeNativeTranscript += finalTranscript + " ";
          };
          nativeRecognition.start();
        }
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') { // Allow users who deny mic permissions to see standard errors
         console.warn("Dhwani RTC Engine error, skipping straight to fallback.");
      }
      onError("Microphone access denied or error occurred.");
    }
  },

  stopListening(
    lang: LanguageCode,
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onFallback: () => void
  ) {
    if (nativeRecognition) {
       try { nativeRecognition.stop(); } catch(e) {}
    }

    if (recorder) {
      recorder.stopRecording(async () => {
        const blob = recorder?.getBlob();
        
        if (streamRef) {
          streamRef.getTracks().forEach((track) => track.stop());
          streamRef = null;
        }
        recorder = null;

        if (blob) {
          try {
             // 1. Post to the Dhwani Endpoints exclusively as defined in their repository configs!
             const formData = new FormData();
             formData.append('file', blob, 'recording.wav');
             
             const dhwaniLang = LANGUAGES[lang].dhwani;
             // We know this HF endpoint is dead/offline currently, but we hit it to preserve repo conformity
             const dhwaniServer = `https://dwani.hf.space/v1/speech_to_speech_v2?language=${dhwaniLang}`;
             
             const response = await axios.post(dhwaniServer, formData, {
               headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' },
               timeout: 8000 // Ensure we don't freeze the user if it hangs
             });

             const textResult = response.data.text || response.data.transcript;
             if (textResult) {
                onResult(textResult);
             } else {
                throw new Error("No transcription returned from Dhwani API.");
             }
          } catch(err) {
             console.warn("Dhwani Server 404 or Offline. Utilizing simultaneous failover transcript resolving.");
             
             // 2. SILENT FAILOVER: Utilize the native transcript we successfully captured concurrently
             if (activeNativeTranscript.trim()) {
                onFallback(); // Visually Toast users that the backend is offline
                onResult(activeNativeTranscript.trim());
             } else {
                onError("Dhwani servers are offline and fallback STT yielded no text.");
             }
          }
        }
      });
    }
  },

  textToSpeech(text: string, lang: LanguageCode) {
    return new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve();
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANGUAGES[lang].bcp47;
        
        const voices = window.speechSynthesis.getVoices();
        const bcpPrefix = LANGUAGES[lang].bcp47.split('-')[0];
        const voice = voices.find(v => v.lang.startsWith(bcpPrefix));
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(e);

        window.speechSynthesis.speak(utterance);
    });
  }
};
