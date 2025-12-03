/**
 * Chat.js
 * Chat component with voice recognition and text-to-speech
 * Uses Web Speech API for voice input and output
 * Integrates with backend LLM service for processing messages
 */
import React, { useState, useEffect, useCallback } from "react";
import "../styles/Chat.css";
import API_CONFIG from '../config';

/**
 * Chat component with voice recognition and text-to-speech
 * Uses Web Speech API for voice input and output
 * Integrates with backend LLM service for processing messages
 * @param {*} props
 * @returns {JSX.Element}
 */
function Chat({ onBookingConfirmed }) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  // --- Voice Recognition Setup ---
  const playBeep = useCallback(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
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
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

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
  }, [playBeep]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, []);

  // --- Send message to LLM ---
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message to chat
    const userMessage = { role: "user", text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      // Send to LLM service
      const response = await fetch(`${API_CONFIG.LLM_SERVICE}/api/llm/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
        body: JSON.stringify({ text: inputText })
      });

      const data = await response.json();

      // Add assistant response to chat
      const assistantMessage = {
        role: "assistant",
        text: data.response || data.message || "I received your request.",
        events: data.events || null // Include events if returned
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      speak(assistantMessage.text);

      // If there's a booking proposal, store it
      if (data.booking) {
        setPendingBooking(data.booking);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: "assistant",
        text: "Sorry, I'm having trouble connecting to the service."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputText, speak]);

  // --- Confirm booking ---
  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.LLM_SERVICE}/api/llm/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          eventId: pendingBooking.eventId,
          tickets: pendingBooking.tickets
        })
      });

      const data = await response.json();
      
      const confirmMessage = {
        role: "assistant",
        text: data.response || "Booking confirmed!"
      };
      setMessages(prev => [...prev, confirmMessage]);
      speak(confirmMessage.text);
      
      setPendingBooking(null);

      // Notify parent to refresh events list if provided
      try {
        if (typeof onBookingConfirmed === 'function') onBookingConfirmed();
      } catch (e) {
        console.warn('onBookingConfirmed callback failed', e);
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = {
        role: "assistant",
        text: "Booking failed. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  //keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e) => {
    // Ctrl + M to toggle mic
    if (e.ctrlKey && e.key.toLowerCase() === "m") {
      e.preventDefault();
      startListening();
    }
    // Enter to send message
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [startListening, handleSubmit]);


  return (
    <div className="chat-container">
      {/* Messages Area */}
      <div 
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>🎓 TigerTix Assistant</h2>
            <p>Ask me to show events or book tickets</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.role}`}
            tabIndex={0}
            aria-label={`${msg.role === "user" ? "User" : "Assistant"} message: ${msg.text}`}
          >
            <div className="message-content">
              <p>{msg.text}</p>
              {msg.events && msg.events.length > 0 && (
                <div className="events-list" role="list" aria-label="Available events">
                  {msg.events.map((event, idx) => (
                    <div 
                      key={idx} 
                      className="event-card"
                      role="listitem"
                      aria-label={`Event: ${event.name}, ${event.date} at ${event.location}, ${event.available_tickets} tickets available`}
                    >
                      <div className="event-name">{event.name}</div>
                      <div className="event-details">
                        <span aria-label={`Date: ${event.date}`}>{event.date}</span>
                        <span aria-label={`Location: ${event.location}`}>{event.location}</span>
                        <span aria-label={`${event.available_tickets} tickets available`}>{event.available_tickets} tickets available</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      {/* Booking Confirmation */}
      {pendingBooking && (
        <div className="booking-confirmation" role="alert" aria-live="assertive">
          <p className="booking-title">Confirm Booking</p>
          <p className="booking-details">
            {pendingBooking.tickets} ticket(s) for <strong>{pendingBooking.eventName}</strong>
          </p>
          <div className="booking-actions">
            <button 
              onClick={handleConfirmBooking} 
              className="confirm-btn"
              aria-label={`Confirm booking ${pendingBooking.tickets} tickets for ${pendingBooking.eventName}`}
            >
              ✓ Confirm
            </button>
            <button 
              onClick={() => setPendingBooking(null)} 
              className="cancel-btn"
              aria-label="Cancel booking"
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-wrapper">
            <input
              type="text"
              id="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={listening ? "Listening..." : "Message TigerTix..."}
              className="chat-input"
              aria-label="Chat input"
              disabled={loading}
            />
            
            <button
              type="button"
              onClick={startListening}
              className={`mic-button ${listening ? "listening" : ""}`}
              aria-label="Voice input"
              disabled={loading}
              title="Click to use voice input"
            >
              🎤
            </button>
            
            <button 
              type="submit" 
              className="send-button"
              disabled={loading || !inputText.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat;
