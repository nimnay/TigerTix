/**
 * App.js
 * Main Application Component
 * Displays events and integrates Chat component
 * Fetches event data from backend API
 */
import React, { useEffect, useState } from 'react';
import Chat from './components/Chat';
import './styles/App.css';
import RegistrationForm from "./components/Registration";
import LoginForm from "./components/LoginForm";
import {jwtDecode} from 'jwt-decode';





function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token") || null);




  
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



  useEffect(() => {
    if (!token) return;
  
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000; // seconds
  
      if (decoded.exp < now) {
        handleLogout(); // token already expired
      } else {
        // Schedule logout for when token actually expires
        const timeout = (decoded.exp - now) * 1000; // milliseconds
        const timer = setTimeout(handleLogout, timeout);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error("Invalid token:", err);
      handleLogout();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setLoggedIn(false);
    setCurrentUser(null);
    setShowLogin(true);
    setMessage("Session expired. Please log in again.");
  };

  const handleLoginSuccess = (username, newToken) => {
    setLoggedIn(true);
    setCurrentUser(username);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    //setShowLogin(true);
  };



const buyTicket = (eventId) => {
  const currentToken = localStorage.getItem("token");

  fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentToken}`,
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error("Purchase failed");
      return res.json();
    })
    .then((data) => {
      setMessage("Ticket purchased successfully!");

      // Refresh events to get canonical availability from backend
      fetchEvents();

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
    {loggedIn && currentUser && (
      <div className="logged-in-banner">
        Logged in as <strong>{currentUser}</strong>
        <button onClick={handleLogout}>Logout</button>
      </div>
    )}

    {!loggedIn ? (
      <div>
        {showLogin ? (
          <div>
      
            <LoginForm 
              onSuccess={handleLoginSuccess}/>
            <p>
              Don't have an account?{' '}
              <button onClick={() => setShowLogin(false)}>Register</button>
            </p>
          </div>
        ) : (
         <div>
            <RegistrationForm 
              onSuccess={handleLoginSuccess}/>
            <p>
            Already have an account?{' '}
            <button onClick={() => setShowLogin(true)}>Login</button>
        </p>
      </div>
    )}
</div>
):(
  <>
      <Chat onBookingConfirmed={fetchEvents} />
   
      <section aria-labelledby="Event-List">
        <h2 id = "Event-List"> Upcoming Events </h2>


        <ul aria-live = "polite">
        {events.map((event) => (
          <li key={event.id}>
            {event.name} - {event.date} - Tickets Available: {event.available_tickets}{' '}
            <button onClick={() => buyTicket(event.id)} disabled={event.available_tickets === 0}>Buy Ticket</button>
          </li>
        ))}
      </ul>
      </section>

    <div role="status" aria-live="assertive" aria-atomic="true">
      {message || ''}
      </div>
      </>
      )}
    </div>
  );
}

export default App;
