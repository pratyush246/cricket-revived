import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function DraftPanel({ players, draftedTeam, setDraftedTeam, PlayerCard, yesVoters }) {
  const [search, setSearch] = useState('');

  const togglePlayer = (player) => {
    const exists = draftedTeam.find(p => p.name === player.name);
    if (exists) {
      setDraftedTeam(draftedTeam.filter(p => p.name !== player.name));
    } else {     setDraftedTeam([...draftedTeam, player]);
    }
  };

  const totalMVP = draftedTeam.reduce((sum, p) => sum + (p.mvpPoints || 0), 0).toFixed(2);

  // Filter players by multiple search terms (comma-separated)
  const searchTerms = search.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  // Only show players who are in yesVoters
  const yesVotersSet = new Set((yesVoters || []).map(name => name.toLowerCase()));
  const filteredPlayers = players.filter(player =>
    yesVotersSet.has(player.name.toLowerCase()) &&
    (searchTerms.length === 0 || searchTerms.some(term => player.name.toLowerCase().includes(term)))
  );

  return (
    <div className="mt-6">
      <h2 className="text-3xl font-extrabold mb-4 tracking-wide text-blue-800 drop-shadow">🧢 Draft Team</h2>
      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FiSearch className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search player by name..."
            className="w-full pl-10 pr-10 py-2 rounded-full border-2 border-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
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
      {filteredPlayers.length === 0 ? (
        <div className="text-center text-xl text-gray-500 font-semibold mt-8">No players to be drafted yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredPlayers.map(player => {
            const isDrafted = draftedTeam.find(p => p.name === player.name);
            return (
              <div
                key={player.name}
                onClick={() => togglePlayer(player)}
                className={`cursor-pointer transition-transform transform hover:scale-105 ${
                  isDrafted ? 'ring-4 ring-green-400 bg-gradient-to-br from-green-100 to-green-300' : 'bg-gradient-to-br from-blue-100 to-white'
                } rounded-3xl shadow-2xl border-2 border-blue-300 p-6 flex flex-col items-center relative`}
                style={{ minHeight: 300 }}
              >
                {/* Player Image Placeholder */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-200 border-4 border-white shadow-xl flex items-center justify-center mb-3 overflow-hidden">
                  <span className="text-4xl font-extrabold text-blue-800 drop-shadow-lg">{player.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="text-2xl font-extrabold text-blue-900 mb-2 text-center tracking-wide drop-shadow">{player.name}</div>
                <div className="flex flex-wrap justify-center gap-3 w-full mb-3">
                  <div className="bg-blue-200 rounded px-3 py-1 text-lg font-bold text-blue-900 shadow">MVP: {player.mvpPoints}</div>
                  <div className="bg-yellow-200 rounded px-3 py-1 text-lg font-bold text-yellow-900 shadow">Matches: {player.matches}</div>
                </div>
                <div className="bg-green-200 rounded px-3 py-1 text-lg font-semibold text-green-900 shadow">Runs: {player.batting.runs}</div>
                <div className="bg-green-200 rounded px-3 py-1 text-lg font-semibold text-green-900 shadow">Avg: {player.batting.average}</div>
                <div className="bg-green-200 rounded px-3 py-1 text-lg font-semibold text-green-900 shadow">SR: {player.batting.strikeRate}</div>
                <div className="flex flex-wrap justify-center gap-3 w-full mb-3">
                  <div className="bg-purple-200 rounded px-3 py-1 text-lg font-semibold text-purple-900 shadow">Wkts: {player.bowling.wickets}</div>
                  <div className="bg-purple-200 rounded px-3 py-1 text-lg font-semibold text-purple-900 shadow">Eco: {player.bowling.economy}</div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 w-full mb-3">
                  <div className="bg-orange-200 rounded px-3 py-1 text-lg font-semibold text-orange-900 shadow">Catches: {player.fielding.catches}</div>
                </div>
                {isDrafted && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-base px-3 py-1 rounded-full shadow-lg font-bold tracking-wide">Drafted</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-10">
        <h3 className="font-semibold text-xl text-blue-800">Drafted Players ({draftedTeam.length}):</h3>
        <div className="flex flex-wrap gap-3 mt-3">
          {draftedTeam.map(p => (
            <span key={p.name} className="bg-green-200 px-4 py-2 rounded-xl font-bold text-green-900 shadow text-lg">
              {p.name} — {p.mvpPoints} pts
            </span>
          ))}
        </div>
        <p className="mt-4 font-extrabold text-2xl text-green-700">Total MVP Points: {totalMVP}</p>
      </div>
    </div>
  );
}