import React from 'react';
import { MdEmojiEvents, MdGroups, MdStar, MdSportsCricket } from 'react-icons/md';
import AuctionPanel from './AuctionPanel';
function getCumulativePoints(player) {
    
  const matches = player.matches || 0;
  const runs = player.batting?.runs || 0;
  const batAvg = player.batting?.average || 0;
  const bowlAvg = player.bowling?.average || 0;
  const wickets = player.bowling?.wickets || 0;
  const catches = player.fielding?.catches || 0;
  const runOuts = player.fielding?.runOuts || 0;
  // Weights can be adjusted as needed
  return (
    matches * 1 +
    batAvg * 1 +
    runs * 1.5 +
    bowlAvg * 1.5 +
    wickets * 1.5 +
    catches * 1 +
    runOuts * 1.5
  );
}

const bracketStyles = [
  {
    icon: <MdEmojiEvents className="text-4xl text-yellow-500 drop-shadow-lg" />, // Top
    border: 'border-yellow-400',
    bg: 'bg-gradient-to-br from-yellow-100 via-white to-yellow-50',
    title: 'Top Bracket',
    titleColor: 'text-yellow-700'
  },
  {
    icon: <MdStar className="text-4xl text-green-500 drop-shadow-lg" />, // Middle
    border: 'border-green-400',
    bg: 'bg-gradient-to-br from-green-100 via-white to-green-50',
    title: 'Middle Bracket',
    titleColor: 'text-green-700'
  },
  {
    icon: <MdSportsCricket className="text-4xl text-blue-500 drop-shadow-lg" />, // Lower
    border: 'border-blue-400',
    bg: 'bg-gradient-to-br from-blue-100 via-white to-blue-50',
    title: 'Lower Bracket',
    titleColor: 'text-blue-700'
  }
];

const SetsOfPlayers = ({ players, captains, username, isCaptain, isAdmin }) => {
  // Calculate points and sort
  const scoredPlayers = players.map(p => ({ ...p, cumulativePoints: getCumulativePoints(p) }));
  const sorted = [...scoredPlayers].sort((a, b) => b.cumulativePoints - a.cumulativePoints);
  // Split into 3 sets
  const n = sorted.length;
  const setSize = Math.ceil(n / 3);
  const sets = [
    sorted.slice(0, setSize),
    sorted.slice(setSize, setSize * 2),
    sorted.slice(setSize * 2)
  ];

  return (
    <div className="w-full min-h-[60vh] py-8 px-2 md:px-0 bg-gradient-to-br from-green-50 via-yellow-50 to-blue-50 rounded-3xl shadow-inner flex flex-col gap-12">
      <h1 className="text-4xl font-extrabold text-green-700 mb-4 text-center drop-shadow-lg tracking-tight">Sets of Players</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {sets.map((set, idx) => (
          <div
            key={idx}
            className={`relative ${bracketStyles[idx].bg} ${bracketStyles[idx].border} border-4 rounded-3xl shadow-2xl p-8 flex flex-col items-center transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl`}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">{bracketStyles[idx].icon}</div>
            <h2 className={`text-2xl font-extrabold mb-6 mt-6 text-center ${bracketStyles[idx].titleColor} tracking-wide drop-shadow`}>{bracketStyles[idx].title}</h2>
            <ol className="w-full flex flex-col gap-4">
              {set.map((player, i) => (
                <li key={player.name} className="w-full flex flex-col items-start bg-white/80 rounded-xl shadow p-4 border-l-4 border-green-200 hover:bg-green-50 transition">
                  <span className="font-semibold text-lg text-green-900 flex items-center gap-2">
                    <span className="inline-block w-6 text-right font-bold text-gray-500">{i + 1}.</span>
                    <MdGroups className="text-green-400 text-xl" />
                    {player.name}
                  </span>
                  <span className="text-sm text-gray-500 mt-1">Points: <span className="font-bold text-green-700">{Math.round(player.cumulativePoints * 100) / 100}</span></span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <AuctionPanel players={players} captains={captains} isAdmin={isAdmin} isCaptain={isCaptain} username={username} />
    </div>
  );
};

export default SetsOfPlayers;