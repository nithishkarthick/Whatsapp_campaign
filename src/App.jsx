import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // Track login state

  // This function will be passed to Login component to set the login status
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);  // User is logged in, show Navbar
  };

  return (
    <div>
      {/* Conditionally render Login or Navbar based on login status */}
      {isLoggedIn ? <Navbar /> : <Login onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
}

export default App;
