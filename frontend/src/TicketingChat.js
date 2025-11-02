import React, { useState } from "react";

export default function TicketingChat() {
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
      const res = await fetch("http://localhost:6001/api/llm/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      if (data.booking) setPendingBooking(data.booking);
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
      const res = await fetch("http://localhost:6001/api/llm/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: pendingBooking.eventId,
          tickets: pendingBooking.tickets,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.response }]);
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
