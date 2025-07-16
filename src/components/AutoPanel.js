import React, { useState, useEffect } from 'react';

function getPlayerByName(players, name) {
  return players.find(p => p.name.toLowerCase() === name.toLowerCase());
}

function getTeamMVP(team) {
  return team.reduce((sum, p) => sum + (p?.mvpPoints || 0), 0).toFixed(2);
}

const TEAMS_KEY = 'auto_panel_teams';
const POOL_KEY = 'auto_panel_pool';

export default function AutoPanel({ players, captains, yesVoters, username }) {
  // Exclude captains from yesVoters
  const yesVotersPool = yesVoters.filter(
    name => !captains.includes(name.toLowerCase())
  );
  // Get player objects for yesVoters
  const yesVoterPlayers = yesVotersPool
    .map(name => getPlayerByName(players, name))
    .filter(Boolean)
    .sort((a, b) => (b.mvpPoints || 0) - (a.mvpPoints || 0));

  const numTeams = captains.length;

  // Persistent state for teams and pool
  const [teams, setTeams] = useState(() => {
    const stored = localStorage.getItem(TEAMS_KEY);
    if (stored) {
      // Restore by player name
      const parsed = JSON.parse(stored);
      return parsed.map(teamArr => teamArr.map(name => getPlayerByName(players, name)).filter(Boolean));
    }
    // Auto-balance if not present
    const initialTeams = Array.from({ length: numTeams }, () => []);
    const teamMVPs = Array(numTeams).fill(0);
    yesVoterPlayers.forEach(player => {
      let minIdx = 0;
      for (let i = 1; i < numTeams; i++) {
        if (teamMVPs[i] < teamMVPs[minIdx]) minIdx = i;
      }
      initialTeams[minIdx].push(player);
      teamMVPs[minIdx] += player.mvpPoints || 0;
    });
    return initialTeams;
  });
  const [pool, setPool] = useState(() => {
    const stored = localStorage.getItem(POOL_KEY);
    if (stored) {
      return JSON.parse(stored).map(name => getPlayerByName(players, name)).filter(Boolean);
    }
    return [];
  });

  // Persist teams and pool to localStorage
  useEffect(() => {
    // Store only player names for persistence
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams.map(team => team.map(p => p.name))));
  }, [teams]);
  useEffect(() => {
    localStorage.setItem(POOL_KEY, JSON.stringify(pool.map(p => p.name)));
  }, [pool]);

  // If players, captains, or yesVoters change, re-sync teams and pool to ensure no missing/extra players
  useEffect(() => {
    // Flatten all assigned names
    const assignedNames = new Set(teams.flat().map(p => p.name));
    // Remove any player from teams/pool who is no longer a yesVoter or player
    const validNames = new Set(yesVoterPlayers.map(p => p.name));
    let changed = false;
    const newTeams = teams.map(team => team.filter(p => validNames.has(p.name)));
    if (JSON.stringify(newTeams) !== JSON.stringify(teams)) changed = true;
    let newPool = pool.filter(p => validNames.has(p.name));
    if (JSON.stringify(newPool) !== JSON.stringify(pool)) changed = true;
    // Add any missing yesVoterPlayer to pool
    const poolNames = new Set(newPool.map(p => p.name));
    yesVoterPlayers.forEach(p => {
      if (!assignedNames.has(p.name) && !poolNames.has(p.name)) {
        newPool.push(p);
        changed = true;
      }
    });
    if (changed) {
      setTeams(newTeams);
      setPool(newPool);
    }
  }, [players, captains, yesVoters]);

  // Drop player from team to pool
  const handleDrop = (teamIdx, player) => {
    setTeams(prevTeams => prevTeams.map((team, idx) =>
      idx === teamIdx ? team.filter(p => p !== player) : team
    ));
    setPool(prevPool => [...prevPool, player]);
  };

  // Add player from pool to a team
  const handleAdd = (teamIdx, player) => {
    setTeams(prevTeams => prevTeams.map((team, idx) =>
      idx === teamIdx ? [...team, player] : team
    ));
    setPool(prevPool => prevPool.filter(p => p !== player));
  };

  return (
    <div className="w-full max-w-full md:max-w-5xl mx-auto p-4 md:p-10 bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 rounded-3xl shadow-2xl border-4 border-green-200 flex flex-col gap-4 md:gap-8 items-center animate-fade-in mt-6 md:mt-12 overflow-x-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 mb-2 text-center drop-shadow-lg tracking-tight">AutoPanel</h2>
      <div className="text-base md:text-xl text-green-800 font-semibold text-center mb-2 md:mb-4">
        Auto-generated teams for {captains.map((c, i) => (
          <span key={c} className={i === 0 ? 'text-blue-700 font-bold' : i === 1 ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
            {c}{i < captains.length - 1 ? ', ' : ''}
          </span>
        ))} (MVP balanced)
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full justify-center">
        {teams.map((team, idx) => (
          <div key={idx} className={`flex-1 min-w-0 md:min-w-[300px] max-w-full md:max-w-[520px] mx-auto bg-gradient-to-br from-white via-green-50 to-blue-50 rounded-3xl shadow-2xl border-4 border-green-200 p-3 md:p-6 flex flex-col items-center`}>
            <div className={`text-lg md:text-2xl font-extrabold mb-1 md:mb-2 ${idx === 0 ? 'text-blue-700' : idx === 1 ? 'text-green-700' : 'text-yellow-700'} drop-shadow-lg`}>{captains[idx]} Team</div>
            <ul className="w-full min-h-[40px] md:min-h-[80px] flex flex-col gap-1 md:gap-2 mt-1 md:mt-2">
              {team.map((p, i) => (
                <li key={p?.name || p} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 rounded-xl bg-white/80 shadow border-l-4 border-green-200 hover:bg-green-50 transition text-xs md:text-lg">
                  <span className="font-semibold text-xs md:text-lg text-green-900 flex items-center gap-1 md:gap-2">
                    <span className="inline-block w-4 md:w-6 text-right font-bold text-gray-500">{i + 1}.</span>
                    <span className="inline-block min-w-[80px] md:min-w-[140px] max-w-[120px] md:max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis">{p?.name || p}</span>
                  </span>
                  <span className="ml-auto px-2 md:px-3 py-1 rounded-full bg-gradient-to-r from-yellow-200 via-green-200 to-blue-200 text-green-900 font-bold text-xs md:text-sm shadow-inner border border-green-200 inline-block min-w-[50px] md:min-w-[80px] max-w-[80px] md:max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{p?.mvpPoints || 0} MVP</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Common Pool */}
      {pool.length > 0 && (
        <div className="w-full mt-10 p-6 bg-gradient-to-r from-blue-50 via-green-50 to-yellow-50 rounded-2xl shadow-inner border-2 border-green-200 flex flex-col items-center">
          <h3 className="text-2xl font-bold text-green-700 mb-4">Dropped Players Pool</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {pool.map((p, i) => (
              <div key={p?.name || p} className="px-4 py-2 rounded-xl bg-white/80 shadow border-2 border-green-200 flex flex-col items-center min-w-[120px]">
                <span className="font-semibold text-lg text-green-900">{p?.name || p}</span>
                <span className="px-2 py-1 rounded-full bg-gradient-to-r from-yellow-100 via-green-100 to-blue-100 text-green-800 font-semibold text-sm border border-green-200 shadow-inner mt-1 min-w-[80px] max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{p?.mvpPoints || 0} MVP</span>
                <div className="flex gap-2 mt-2">
                  {captains.map((cap, idx) => (
                    <button
                      key={cap}
                      className={`px-3 py-1 rounded font-bold border transition text-sm 
                        ${username === cap 
                          ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400' 
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 focus:outline-none'}`}
                      onClick={() => username === cap && handleAdd(idx, p)}
                      disabled={username !== cap}
                      style={{
                        minWidth: '48px',
                        maxWidth: '80px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        outline: 'none',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        borderRadius: '8px'
                      }}
                    >Add to {cap.split(' ')[0]}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}