/**
 * useSpeechRecognition.js
 * Custom React hook for speech recognition
 * Uses Web Speech API to handle voice input
 * Provides start/stop listening controls and recognition results
 */
import { useState, useEffect } from "react";

export default function useSpeechRecognition(onResult) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        transcript += e.results[i][0].transcript;
      }
      onResult(transcript);
    };

    recog.onend = () => setListening(false);
    setRecognition(recog);
  }, [onResult]);

  const startListening = () => {
    if (recognition && !listening) {
      recognition.start();
      setListening(true);
      const beep = new Audio("/mic-beep.mp3"); // optional: add beep sound to /public
      beep.play().catch(() => {}); // handle autoplay block
    }
  };

  const stopListening = () => {
    if (recognition && listening) {
      recognition.stop();
      setListening(false);
    }
  };

  return { listening, supported, startListening, stopListening };
}
