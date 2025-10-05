import React, { useState } from "react";
import CityComparison from "./Components/CityComparison.jsx";
import StartupScreen from "./Components/StartupScreen.jsx";

export default function App() {
  const [showStartup, setShowStartup] = useState(true);

  const handleEnterSite = () => {
    setShowStartup(false);
  };

  return (
    <div className="app">
      {showStartup ? (
        <StartupScreen onEnter={handleEnterSite} />
      ) : (
        <CityComparison />
      )}
    </div>
  );
}