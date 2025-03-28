import React, { useState } from 'react';
import Logo from "../assets/Aditravider-Welfare logo.png"; // Import the logo

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle form submit
  const handleLogin = (e) => {
    e.preventDefault();
    
    // Example login logic (You should replace this with real authentication)
    if (email === 'admin@gmail.com' && password === 'admin') {
      // Call onLoginSuccess when login is successful
      onLoginSuccess();
    } else {
      alert('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start">
      {/* Navbar */}
      <nav className="w-full bg-[rgb(8,69,116)] text-white p-4 text-center">
          <h1 className="text-2xl font-bold">Surway Campaign Manager</h1>
      </nav>

      {/* Logo positioned below the navbar (top-left corner) */}
      <div className="w-full max-w-4xl py-4 flex justify-between items-center">
        <div className="absolute top-16 left-4 w-1/4">
          <img src={Logo} alt="Aditravider Welfare Logo" className="w-full h-auto object-contain" />
        </div>
      </div>

      {/* Login Form */}
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full mt-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Login
          </button>
        </form>

        {/* Optional: Forgot Password Link */}
        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-blue-500 hover:underline">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
