/**
 * TicketingChat.js
 * Chat component for ticket booking assistant
 * Integrates with backend LLM service for processing messages and bookings
 * Handles user messages, booking confirmations, and displays chat history
 */
import React, { useState } from "react";
import API_CONFIG from '../config';

/**
 * TicketingChat component
 * @param {Object} props
 * @param {Function} props.onBookingConfirmed - Callback when booking is confirmed
 * @returns {JSX.Element} 
 */
export default function TicketingChat({ onBookingConfirmed }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingBooking, setPendingBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_CONFIG.LLM_SERVICE}/api/llm/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();

      // Display the response message
      const replyText = data.response || data.message || "I couldn't understand that.";
      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
      
      // If there's a booking that needs confirmation, store it
      if (data.needsConfirmation && data.booking) {
        setPendingBooking(data.booking);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Server error. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }; 


// Confirm Booking
const confirmBooking = async () => {
    if (!pendingBooking) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.LLM_SERVICE}/api/llm/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 
        "Authorization": `Bearer ${localStorage.getItem("token")}`},
        body: JSON.stringify({
          eventId: pendingBooking.eventId,
          tickets: pendingBooking.tickets,
        }),
      });

      const data = await res.json();
      
      // Display confirmation message
      const confirmText = data.response || data.message || "Booking confirmed!";
      setMessages((prev) => [...prev, { role: "assistant", text: confirmText }]);
      
      if (data.success && onBookingConfirmed) {
        onBookingConfirmed(data.eventId, data.ticketsPurchased);
      }

      setPendingBooking(null); // Clear pending
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Booking confirmation failed." },
      ]);
    } finally {
      setLoading(false);
    }
  };


  //Enter key handler
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  return (
    <div className="chat-window" aria-label="Ticket booking chat assistant">
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role}`}
            tabIndex={0}
            aria-label={`${msg.role === "user" ? "User" : "Assistant"} message: ${
              msg.text
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {pendingBooking && (
        <div className="confirm-box">
          <p>
            Confirm booking for <b>{pendingBooking.eventName}</b> (
            {pendingBooking.tickets} tickets)?
          </p>
          <button onClick={confirmBooking} disabled={loading}>
            Confirm Booking
          </button>
        </div>
      )}

      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          aria-label="Type your message"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
