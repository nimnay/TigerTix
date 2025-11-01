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
      const res = await fetch("/api/llm/parse", {
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
}
