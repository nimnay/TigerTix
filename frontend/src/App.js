import React, { useEffect, useState } from 'react';
import Chat from './Chat';
import './App.css';
function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  
  
  //function that shows events
  const fetchEvents = () => {
    fetch('http://localhost:6001/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  }

  useEffect(() => {
    fetchEvents();
  }, []);

const buyTicket = (eventId) => {
  fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
    method: "POST",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Purchase failed");
      return res.json();
    })
    .then((data) => {
      setMessage("Ticket purchased successfully!");

      // Dynamically decrease tickets without re-fetching
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, number_of_tickets: event.number_of_tickets - 1 }
            : event
        )
      );

      // 🕒 Auto-clear message after short delay (accessibility-safe)
      setTimeout(() => setMessage(""), 4000);
    })
    .catch((err) => {
      setMessage("Purchase failed, try again.");
      setTimeout(() => setMessage(""), 4000);
    });
};


return (
  <div className="App">
   <h1 id = "page title"> Clemson Campus Events</h1>
   
   <Chat />
   
    <section aria-labelledby="Event-List">
      <h2 id = "Event-List"> Upcoming Events </h2>


      <ul aria-live = "polite">
      {events.map((event) => (
        <li key={event.id}>
          {event.name} - {event.date}- Tickets Available: {event.number_of_tickets}{' '}
          <button onClick={() => buyTicket(event.id)}disabled={event.number_of_tickets === 0}>Buy Ticket</button>
        </li>
       ))}
     </ul>
    </section>

   <div role="status" aria-live="assertive" aria-atomic="true">
  {message || ''}
  </div>
  </div>
  );
}

export default App;
