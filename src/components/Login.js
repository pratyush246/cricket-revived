import React, { useState } from 'react';
import { MdSportsCricket } from 'react-icons/md';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const players = JSON.parse(localStorage.getItem('players') || '[]');
      const found = players.find(
        p => p.name && p.name.toLowerCase() === username.trim().toLowerCase()
      );
      if (found) {
        setLoading(false);
        localStorage.setItem('username', username.trim().toLocaleLowerCase());
        onLogin(username.trim());
      } else {
        setLoading(false);
        setError('Not in database');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-200 via-green-100 to-yellow-100 animate-bg-fade">
      <div className="w-full max-w-md mx-auto p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-green-200 flex flex-col gap-6 items-center animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <MdSportsCricket className="text-4xl text-green-600 drop-shadow-lg" />
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-700 via-blue-600 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight">Cricket Login</h2>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username..."
            className="w-full px-5 py-3 rounded-full border-2 border-green-200 shadow focus:outline-none focus:ring-2 focus:ring-green-400 text-lg"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className={`mt-2 px-6 py-3 rounded-full text-xl font-bold shadow-lg transition-all duration-200 border-2 flex items-center justify-center gap-2
              ${loading || !username.trim()
                ? 'bg-gray-300 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 via-blue-500 to-yellow-400 text-white border-green-400 hover:scale-105 hover:shadow-2xl'}
            `}
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
          {error && <div className="text-red-600 text-center font-bold mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
} 