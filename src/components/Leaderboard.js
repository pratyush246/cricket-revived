import React, { useState } from 'react';
import { FaMedal, FaTrophy } from 'react-icons/fa';
import { FiSearch, FiX } from 'react-icons/fi';

const medalColors = [
  'bg-yellow-400 text-yellow-900 ring-yellow-400', // 1st
  'bg-gray-300 text-gray-800 ring-gray-400',     // 2nd
  'bg-orange-400 text-orange-900 ring-orange-400'  // 3rd
];

export default function Leaderboard({ players, onPlayerSelect }) {
  const [search, setSearch] = useState('');
  const sorted = [...players].sort((a, b) => b.mvpPoints - a.mvpPoints);

  // Filter players by multiple search terms (comma-separated)
  const searchTerms = search.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const filteredPlayers = sorted.filter(player =>
    searchTerms.length === 0 || searchTerms.some(term => player.name.toLowerCase().includes(term))
  );

  return (
    <div className="mt-4 md:mt-6 w-full max-w-full px-1 md:px-0 overflow-x-auto">
      <h2 className="text-xl md:text-3xl font-extrabold mb-2 text-blue-800 drop-shadow">🏆 MVP Leaderboard</h2>
      <div className="text-lg md:text-2xl text-blue-500 mb-4 md:mb-8 font-medium tracking-wide text-center">Top performers of the tournament</div>
      {/* Search Bar */}
      <div className="flex justify-center mb-4 md:mb-8">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FiSearch className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search player by name..."
            className="w-full pl-10 pr-10 py-2 rounded-full border-2 border-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
        {filteredPlayers.map((player, index) => (
          <div key={player.name} className="flex flex-col w-full">
            <div
              className={`relative animate-fade-in cursor-pointer bg-gradient-to-br from-blue-100/80 via-white to-blue-50 rounded-3xl shadow-2xl border-2 border-blue-200 p-8 flex flex-col items-center min-h-[260px] transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                index < 3 ? 'ring-4 ' + medalColors[index] + ' shadow-[0_0_30px_5px_rgba(251,191,36,0.2)]' : ''
              }`}
              style={{
                background: index < 3
                  ? 'linear-gradient(135deg, #fffbe6 0%, #ffe9c7 100%)'
                  : 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
                boxShadow: index < 3
                  ? '0 8px 32px 0 rgba(251,191,36,0.25), 0 1.5px 6px 0 rgba(59,130,246,0.10)' // gold glow
                  : '0 4px 16px 0 rgba(59,130,246,0.10)'
              }}
              onClick={() => onPlayerSelect(player)}
            >
              {/* Rank with icon */}
              <div className="absolute top-4 left-4 flex items-center z-10">
                {index === 0 ? (
                  <FaTrophy className="text-yellow-400 text-4xl drop-shadow mr-2 animate-bounce" />
                ) : index < 3 ? (
                  <FaMedal className={`text-3xl drop-shadow mr-2 ${medalColors[index]} animate-pulse`} />
                ) : null}
                <span className="text-3xl font-extrabold text-blue-700 drop-shadow">#{index + 1}</span>
              </div>
              {/* Player initials avatar */}
              <div className={`w-24 h-24 rounded-full border-4 shadow-xl flex items-center justify-center mb-4 mt-4 overflow-hidden ${index < 3 ? medalColors[index] : 'bg-gradient-to-br from-blue-300 to-blue-100 border-white'}`}>
                <span className="text-5xl font-extrabold drop-shadow-lg text-white" style={{textShadow: '0 2px 8px #0002'}}>{player.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-2 text-center tracking-wide drop-shadow">{player.name}</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">MVP Points:</div>
              <div className="text-4xl font-extrabold text-blue-700 mb-2 drop-shadow-lg" style={{letterSpacing: '0.05em'}}>{player.mvpPoints}</div>
              <div className="text-md text-blue-600 mt-2">Click for full stats</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </div>
  );
}