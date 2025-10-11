import React, { useEffect, useState } from 'react';

import './App.css';
function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch('http://localhost:6001/api/events')
    .then((res) => res.json())
    .then((data) => setEvents(data))
    .catch((err) => console.error(err));
}, []);
const buyTicket = (eventId) => {
  fetch(`http://localhost:6001/api/purchase/${eventId}`, {
    method: "POST",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Purchase failed");
      return res.json();
    })
    .then((data) => {
      setMessage("Ticket purchased successfully!");

      // Option 1: Re-fetch all events (simple)
      return fetch("http://localhost:6001/api/events")
        .then((res) => res.json())
        .then((updated) => setEvents(updated));
    })
    .catch((err) => setMessage("Purchase failed, try again."));
};

return (
  <div className="App">
   <h1>Clemson Campus Events</h1>
    <ul>
      {events.map((event) => (
        <li key={event.id}>
          {event.name} - {event.date}{' '}
          <button onClick={() => buyTicket(event.name)}>Buy Ticket</button>
        </li>
      ))}
    </ul>
  </div>
  );
}

export default App;
