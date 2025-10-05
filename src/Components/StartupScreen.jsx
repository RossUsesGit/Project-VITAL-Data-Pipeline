import React, { useState } from 'react';
import './StartupScreen.css';

const StartupScreen = ({ onEnter }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleEnter = () => {
    setIsFadingOut(true);
    setTimeout(onEnter, 1000); // Match the fade-out animation duration
  };

  return (
    <div className={`startup-screen ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="liquid-glass">
        <img src="/projectvital4.png" alt="Project Vital Logo" className="startup-logo" />
        <button className="enter-button" onClick={handleEnter}>Begin</button>
      </div>
    </div>
  );
};

export default StartupScreen;