import React, { useState, useEffect, useRef, use } from 'react';

const TEAMS_KEY = 'drafted_teams';
const AVAILABLE_PLAYERS_KEY = 'available_players';
const PICK_NUMBER_KEY = 'draft_pick_number';

const getInitialTeams = (captains) => {
  const teams = {};
  captains?.forEach(cap => { teams[cap] = []; });
  return teams;
};

const getRandomInt = (max) => Math.floor(Math.random() * max);

// Helper: check if all teams are empty
const areAllTeamsEmpty = (teams) => Object.values(teams || {}).every(arr => !arr || arr.length === 0);

const TeamSelection = ({  players, yesVoters, captains, username }) => {
  // --- State Initialization ---
  // Restore from localStorage or initialize
  const [teams, setTeams] = useState(() => {
    const stored = localStorage.getItem(TEAMS_KEY);
    if (stored) return JSON.parse(stored);
    return getInitialTeams(captains);
  });
 

  const [filteredPlayers, setFilteredPlayers] = useState([]);

  const [availablePlayers, setAvailablePlayers] = useState([]);



  useEffect(() => {
    const yesVotersSet = new Set((yesVoters || []).map(name => name.toLowerCase()));
    setFilteredPlayers(players.filter(player =>
        //not captains as well
        
        !captains.includes(player.name.toLowerCase()) &&
        yesVotersSet.has(player.name.toLowerCase())));
    
  }, [yesVoters,players,captains]);

  useEffect(() => {
    () => {
       if(filteredPlayers.length > 0){
        const stored = localStorage.getItem(AVAILABLE_PLAYERS_KEY);
        let initial = stored ? JSON.parse(stored) : filteredPlayers
      
       setAvailablePlayers(initial);
      }
    }
  }, [filteredPlayers]);
  const [pickNumber, setPickNumber] = useState(() => {
    const stored = localStorage.getItem(PICK_NUMBER_KEY);
    if (stored !== null) return parseInt(stored, 10);
    return 0;
  });
  // Remove firstCaptainIdx and always start with captains[0]
  // const [firstCaptainIdx, setFirstCaptainIdx] = useState(() => getRandomInt(captains?.length || 0));
  const [draftOrder, setDraftOrder] = useState([]);

  // --- Draft Order Setup ---
  useEffect(() => {
    // Build draft order: alternate for 2, snake for 3
    let order = [];
    if (captains?.length === 3) {
      const rounds = Math.ceil(filteredPlayers?.length / 3);
      for (let r = 0; r < rounds; r++) {
        if (r % 2 === 0) order.push(0, 1, 2);
        else order.push(2, 1, 0);
      }
    } else {
      for (let i = 0; i < (filteredPlayers?.length || 0); i++) order.push(i % 2);
    }
    // Always start with first captain (index 0)
    setDraftOrder(order);


  }, [captains, filteredPlayers]);


  useEffect(() => {
    if(draftOrder.length > 0){
    if(draftOrder.length < pickNumber){
        //console.log('pickNumber is greater than order.length', draftOrder.length, pickNumber);
        setPickNumber(0);
    }
}
  }, [draftOrder, pickNumber]);

  // --- Persist state to localStorage ---
  useEffect(() => {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  }, [teams]);
  useEffect(() => {
    localStorage.setItem(AVAILABLE_PLAYERS_KEY, JSON.stringify(availablePlayers));
  }, [availablePlayers]);
  useEffect(() => {
    localStorage.setItem(PICK_NUMBER_KEY, pickNumber);
  }, [pickNumber]);

  // --- Sync with parent ---


  // --- Handle filteredPlayers changes ---
  const prevFilteredPlayers = useRef();
  const prevCaptains = useRef();
  const prevPlayers = useRef();
  useEffect(() => {
    // Only run if filteredPlayers, captains, or players actually changed
    const filteredChanged = JSON.stringify(prevFilteredPlayers.current) !== JSON.stringify(filteredPlayers);
    const captainsChanged = JSON.stringify(prevCaptains.current) !== JSON.stringify(captains);
    const playersChanged = JSON.stringify(prevPlayers.current) !== JSON.stringify(players);
    if (!filteredChanged && !captainsChanged && !playersChanged) return;
    prevFilteredPlayers.current = filteredPlayers;
    prevCaptains.current = captains;
    prevPlayers.current = players;
    // Remove any team player not in filteredPlayers
    let updatedTeams = { ...teams };
    let changed = false;
    for (const cap of captains || []) {
      const filtered = (updatedTeams[cap] || []).filter(p => filteredPlayers.some(fp => fp.name === (p.name || p)));
      if (filtered.length !== (updatedTeams[cap] || []).length) {
        updatedTeams[cap] = filtered;
        changed = true;
      }
    }
    // Add new filteredPlayers to availablePlayers if not in any team or available, and not a captain
    let pickedNames = Object.values(updatedTeams).flat().map(p => p.name || p);
    let newAvailable = [...availablePlayers];
    for (const fp of filteredPlayers) {
      if (
        !pickedNames.includes(fp.name || fp) &&
        !availablePlayers.some(ap => (ap.name || ap) === (fp.name || fp))
      ) {
        newAvailable.push(fp);
        changed = true;
      }
    }
    // Remove from availablePlayers if not in filteredPlayers or if it's a captain
    newAvailable = newAvailable.filter(
      ap =>
        filteredPlayers.some(fp => (fp.name || fp) === (ap.name || ap))
    );
    // Only update state if actually changed
    const teamsChanged = JSON.stringify(teams) !== JSON.stringify(updatedTeams);
    const availableChanged = JSON.stringify(availablePlayers) !== JSON.stringify(newAvailable);
    if (teamsChanged) setTeams(updatedTeams);
    if (availableChanged) setAvailablePlayers(newAvailable);
  }, [filteredPlayers, captains, players]);

  // --- Auto-reset draft if captains change (value, not just reference) ---
  // Remove the auto-reset draft if captains change logic

  // --- Picking Logic ---
  // Always use draftOrder[pickNumber] for turn
  const pickingCaptainIdx = draftOrder[pickNumber] ?? 0;
  const pickingCaptain = captains?.[pickingCaptainIdx];
  const isUserPicking = username === pickingCaptain;

  // --- Handle Pick ---
  const handlePick = (player) => {
    if (!isUserPicking) return;
    if (!availablePlayers?.includes(player)) return;
    setTeams(prev => ({
      ...prev,
      [pickingCaptain]: [...(prev?.[pickingCaptain] || []), player],
    }));
    setAvailablePlayers(prev => prev
      .filter(p => p !== player )
    );
    setPickNumber(prev => prev + 1);
  };

  // --- Reset Draft ---
  const resetDraft = () => {
    localStorage.removeItem(TEAMS_KEY);
    localStorage.removeItem(AVAILABLE_PLAYERS_KEY);
    localStorage.removeItem(PICK_NUMBER_KEY);
    setTeams(getInitialTeams(captains));
    setAvailablePlayers(filteredPlayers.filter(p => !captains.includes(p.name || p)));
    // setFirstCaptainIdx(getRandomInt(captains?.length || 0)); // remove randomization
    setPickNumber(0);
  };

  // --- MVP points calculation helper ---
  const getTeamMVP = (team) => team?.reduce((sum, p) => sum + (p?.mvpPoints || 0), 0).toFixed(2) || 0;

  console.log(availablePlayers,'availablePlayers');
  console.log(filteredPlayers,'filteredPlayers');
  // --- Render ---
  return (
    <div className="w-full max-w-full md:max-w-6xl mx-auto p-2 md:p-10 bg-gradient-to-br from-green-50 via-yellow-50 to-blue-50 rounded-3xl shadow-2xl border-4 border-green-200 flex flex-col gap-4 md:gap-8 items-center animate-fade-in overflow-x-auto">
      <h1 className="text-2xl md:text-4xl font-extrabold text-green-700 mb-2 md:mb-4 text-center drop-shadow-lg tracking-tight">Team Selection</h1>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full justify-center mb-4 md:mb-8">
        {captains?.map((cap, idx) => (
          <div
            key={cap}
            className={`flex-1 min-w-0 md:min-w-[260px] max-w-xs mx-auto bg-gradient-to-br from-white via-green-50 to-blue-50 rounded-3xl shadow-2xl border-4 ${idx === pickingCaptainIdx ? 'border-yellow-400 ring-4 ring-yellow-300 animate-glow' : 'border-green-200'} p-3 md:p-6 flex flex-col items-center transition-transform duration-300 ${idx === pickingCaptainIdx ? 'scale-105' : 'hover:scale-105'}`}
            style={{ boxShadow: idx === pickingCaptainIdx ? '0 0 32px 8px #fde68a, 0 2px 16px #4ade80' : '0 2px 16px #4ade80' }}
          >
            <div className={`text-xl md:text-3xl font-extrabold mb-1 md:mb-2 ${idx === pickingCaptainIdx ? 'text-yellow-700' : 'text-green-700'} drop-shadow-lg`}>{cap}{idx === pickingCaptainIdx && <span className="ml-2 text-base md:text-lg font-bold text-yellow-600 animate-pulse">(Picking)</span>}</div>
            <ul className="w-full min-h-[80px] flex flex-col gap-2 mt-2 overflow-y-auto">
              {teams?.[cap]?.map((p, i) => (
                <li key={p?.name || p} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 shadow border-l-4 border-green-200 hover:bg-green-50 transition">
                  <span className="font-semibold text-lg text-green-900 flex items-center gap-2">
                    <span className="inline-block w-6 text-right font-bold text-gray-500">{i + 1}.</span>
                    {p?.name || p}
                  </span>
                  <span className="ml-auto px-3 py-1 rounded-full bg-gradient-to-r from-yellow-200 via-green-200 to-blue-200 text-green-900 font-bold text-sm shadow-inner border border-green-200">{p?.mvpPoints || 0} MVP</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Reset Draft Button */}
      <div className="flex justify-center mb-8 w-full">
        <button
          onClick={resetDraft}
          className="px-8 py-3 rounded-full text-xl font-bold shadow-lg border-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 text-white border-red-400 hover:scale-105 hover:shadow-2xl transition-all duration-200"
        >
          Reset Draft
        </button>
      </div>
      {/* Player pool for picking */}
      <div className="flex flex-wrap gap-4 justify-center mb-8 w-full overflow-x-auto">
        {availablePlayers?.map((player) => (
          <button
            key={player?.name || player}
            onClick={() => isUserPicking && handlePick(player)}
            disabled={!isUserPicking}
            className={`px-6 py-3 rounded-2xl font-bold text-lg border-2 shadow-md transition-all duration-200 flex items-center gap-2 ${isUserPicking ? 'bg-gradient-to-r from-green-200 via-blue-100 to-yellow-100 text-green-900 border-green-300 hover:scale-105 hover:shadow-xl' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'}`}
            style={{ minWidth: 160 }}
          >
            {player?.name || player}
            <span className="ml-2 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-100 via-green-100 to-blue-100 text-green-800 font-semibold text-sm border border-green-200 shadow-inner">{player?.mvpPoints || 0} MVP</span>
          </button>
        ))}
      </div>
      {/* MVP points summary */}
      <div className="flex flex-col md:flex-row gap-6 justify-center mt-8 w-full overflow-x-auto">
        {captains?.map((cap, idx) => (
          <div
            key={cap}
            className={`flex-1 min-w-[200px] max-w-xs mx-auto bg-gradient-to-br from-green-100 via-yellow-50 to-blue-50 rounded-2xl shadow-lg border-2 border-green-200 p-6 flex flex-col items-center transition-transform duration-300 ${idx === pickingCaptainIdx ? 'ring-4 ring-yellow-300 scale-105' : 'hover:scale-105'}`}
          >
            <div className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
              <span className="inline-block w-6 text-right font-bold text-gray-500">{idx + 1}.</span>
              {cap} Team
            </div>
            <div className="text-3xl font-extrabold text-blue-700 drop-shadow-lg mb-1">{getTeamMVP(teams?.[cap])}</div>
            <div className="text-md text-green-700 font-semibold">Total MVP Points</div>
          </div>
        ))}
        </div>
      <style>{`
        @keyframes glow {
          0% { box-shadow: 0 0 32px 8px #fde68a, 0 2px 16px #4ade80; }
          50% { box-shadow: 0 0 48px 16px #fde68a, 0 2px 24px #4ade80; }
          100% { box-shadow: 0 0 32px 8px #fde68a, 0 2px 16px #4ade80; }
        }
        .animate-glow {
          animation: glow 1.5s infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default TeamSelection;