import React, { useState, useEffect, useCallback } from "react";
import "./Chat.css";

function Chat() {
  const [inputText, setInputText] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  // --- Voice Recognition Setup ---
  const playBeep = useCallback(() => {
    // Create a beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Play beep sound
    playBeep();

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }, []);

  // --- Text-to-Speech Function ---
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, []);

  // --- Handle Form Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User input:", inputText);

    // Example: text-to-speech for simulated LLM response
    const mockLLMResponse = "Got it! Your ticket request has been received.";
    speak(mockLLMResponse);

    setInputText("");
  };

  return (
    <div className="chat-container">
      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or speak your message..."
            className="chat-input"
            aria-label="Chat input"
          />
          <button
            type="button"
            onClick={startListening}
            className={`mic-button ${listening ? "listening" : ""}`}
            aria-label="Voice input"
          >
            <img src="/mic.svg" alt="Microphone" className="mic-icon" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
