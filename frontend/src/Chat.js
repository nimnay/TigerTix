import React, { useState } from 'react';
import './Chat.css';

function Chat() {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('User input:', inputText);
    // Voice to speech will be added here later
    setInputText('');
  };

  const handleMicClick = () => {
    console.log('Microphone clicked');
    // Voice-to-speech functionality will be added here
  };

  return (
    <div className="chat-container">
      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="chat-input"
            aria-label="Chat input"
          />
          <button 
            type="button" 
            onClick={handleMicClick} 
            className="mic-button"
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
