import React, { useState, useEffect } from 'react';
import { MdHowToVote } from 'react-icons/md';
import { ADMINS } from './constant';

const POLL_KEY = 'cricket_poll';

function getUsername() {
  return localStorage.getItem('username') || '';
}

function getPoll() {
  return JSON.parse(localStorage.getItem(POLL_KEY) || 'null');
}

function savePoll(poll) {
  localStorage.setItem(POLL_KEY, JSON.stringify(poll));
}

function saveYesVoters(yesVoters) {
  localStorage.setItem('yes_voters', JSON.stringify(yesVoters));
}

export default function CreatePoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [poll, setPoll] = useState(getPoll());
  const [voted, setVoted] = useState(false);
  const username = getUsername();
  const isAdmin = username && ADMINS.includes(username.toLowerCase());
  const [chosenCaptains, setChosenCaptains] = useState(null);
  const [showCaptainDialog, setShowCaptainDialog] = useState(false);
  const [yesVoters, setYesVoters] = useState([]);
  const [replacedCaptains, setReplacedCaptains] = useState([]);
  const [storedCaptains, setStoredCaptains] = useState(() => {
    const c = localStorage.getItem('captains');
    return c ? JSON.parse(c) : null;
  });
  // Tournament mode: true = tournament (3 captains), false = league (2 captains)
  const [tournamentMode, setTournamentMode] = useState(() => {
    const stored = localStorage.getItem('tournamentMode');
    return stored === null ? false : stored === 'true';
  });
  // Add state for manual captain entry
  const [manualCaptainNames, setManualCaptainNames] = useState(['', '', '']);
  const [manualCaptainError, setManualCaptainError] = useState('');

  // Display string for mode
  const tournamentModeLabel = tournamentMode ? 'Tournament (3 captains)' : 'League (2 captains)';

  // On mount, sync tournamentMode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('tournamentMode');
    if (stored !== null) {
      setTournamentMode(stored === 'true');
    }
  }, []);

  // When tournamentMode changes, update localStorage
  useEffect(() => {
    localStorage.setItem('tournamentMode', tournamentMode ? 'true' : 'false');
  }, [tournamentMode]);

  useEffect(() => {
    setPoll(getPoll());
    if (getPoll() && getPoll().votes && getPoll().votes[username]) {
      setVoted(true);
    }
    // On mount or username change, update yes voters in localStorage
    const poll = getPoll();
    if (poll && poll.votes) {
      const yesVotersList = Object.entries(poll.votes)
        .filter(([user, v]) => v === 0)
        .map(([user]) => user);
      saveYesVoters(yesVotersList);
      setYesVoters(yesVotersList);
    } else {
      saveYesVoters([]);
      setYesVoters([]);
    }
  }, [username]);

  // Listen for localStorage changes (captains, yes_voters)
  useEffect(() => {
    function updateCaptainsAndYesVoters() {
      const c = localStorage.getItem('captains');
      setStoredCaptains(c ? JSON.parse(c) : null);
      const yv = localStorage.getItem('yes_voters');
      setYesVoters(yv ? JSON.parse(yv) : []);
    }
    updateCaptainsAndYesVoters();
    const handleStorage = () => updateCaptainsAndYesVoters();
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(updateCaptainsAndYesVoters, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleOptionChange = (idx, value) => {
    setOptions(opts => opts.map((o, i) => (i === idx ? value : o)));
  };

  const addOption = () => setOptions(opts => [...opts, '']);
  const removeOption = idx => setOptions(opts => opts.length > 2 ? opts.filter((_, i) => i !== idx) : opts);

  const handleCreate = (e) => {
    e.preventDefault();
    setError('');
    if (!question.trim() || options.some(o => !o.trim())) {
      setError('Please enter a question and at least two options.');
      return;
    }
    const newPoll = {
      question: question.trim(),
      options: options.map(o => o.trim()),
      votes: {},
      createdAt: Date.now(),
    };
    savePoll(newPoll);
    setPoll(newPoll);
    setVoted(false);
  };

  const handleVote = (idx) => {
    if (!poll) return;
    const updatedPoll = { ...poll, votes: { ...poll.votes, [username]: idx } };
    savePoll(updatedPoll);
    setPoll(updatedPoll);
    setVoted(true);
    // Update yes voters in localStorage
    const yesVotersList = Object.entries(updatedPoll.votes)
      .filter(([user, v]) => v === 0)
      .map(([user]) => user);
    saveYesVoters(yesVotersList);
    setYesVoters(yesVotersList);
  };

  const handleDeletePoll = () => {
    localStorage.removeItem(POLL_KEY);
    localStorage.removeItem('yes_voters');
    localStorage.removeItem('captains');
    setPoll(null);
    setVoted(false);
    setStoredCaptains(null);
    setChosenCaptains(null);
    setYesVoters([]);
    setReplacedCaptains([]);
    setTournamentMode(false);
    // Remove: showTournamentPrompt, showTournamentContinuePrompt, and related logic
  };

  // Captain selection logic
  const numCaptains = tournamentMode ? 3 : 2;
  const minYesVoters = tournamentMode ? 5 : 4;
  const chooseRandomCaptains = () => {
    if (yesVoters.length < numCaptains) return;
    let shuffled = [...yesVoters].sort(() => 0.5 - Math.random());
    setChosenCaptains(shuffled.slice(0, numCaptains));
    setShowCaptainDialog(true);
  };

  // Helper to pick a new captain, excluding certain users
  function pickNewCaptain(excludeList) {
    const candidates = yesVoters.filter(user => !excludeList.includes(user));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Replace captain if they vote no, and never allow them to be captain again for this poll
  useEffect(() => {
    if (!storedCaptains || storedCaptains.length !== numCaptains) return;
    if (!poll || !poll.votes) return;
    let updated = false;
    let newCaptains = [...storedCaptains];
    let newReplaced = [...replacedCaptains];
    for (let i = 0; i < numCaptains; i++) {
      const cap = storedCaptains[i];
      // If captain is not in yesVoters or voted no, and not already replaced
      if ((poll.votes[cap] !== 0 || !yesVoters.includes(cap)) && !replacedCaptains.includes(cap)) {
        // Add to replacedCaptains so they can't be chosen again
        newReplaced.push(cap);
        // Pick a new captain (not the other captains, not replaced)
        const exclude = newCaptains.filter((_, idx) => idx !== i).concat(newReplaced);
        const newCap = pickNewCaptain(exclude);
        if (newCap) {
          newCaptains[i] = newCap;
          updated = true;
        }
      }
    }
    if (updated) {
      localStorage.setItem('captains', JSON.stringify(newCaptains));
      setStoredCaptains(newCaptains);
      setReplacedCaptains(newReplaced);
    }
  }, [poll, yesVoters, storedCaptains, replacedCaptains, numCaptains]);

  const handleConfirmCaptains = () => {
    if (chosenCaptains && chosenCaptains.length === numCaptains) {
      localStorage.setItem('captains', JSON.stringify(chosenCaptains));
      setShowCaptainDialog(false);
      setStoredCaptains(chosenCaptains);
      setReplacedCaptains([]);
    }
  };

  const handleChooseAgain = () => {
    chooseRandomCaptains();
  };

  // No need for effect for prompts; logic is handled inline in render

  // Count votes for each option
  const voteCounts = poll && poll.options ? poll.options.map((_, i) =>
    Object.values(poll.votes || {}).filter(v => v === i).length
  ) : [];
  const totalVotes = voteCounts.reduce((a, b) => a + b, 0);

  // Get usernames for each option
  const votersByOption = poll && poll.options ? poll.options.map((_, i) =>
    Object.entries(poll.votes || {})
      .filter(([user, v]) => v === i)
      .map(([user]) => user)
  ) : [];

  // Handler for switching to 2 captains
  const handleSwitchToTwoCaptains = () => {
    setTournamentMode(false);
    // Remove captains so admin can choose again
    localStorage.removeItem('captains');
    setStoredCaptains(null);
    setChosenCaptains(null);
    setReplacedCaptains([]);
  };
  // Handler for continuing tournament
  const handleContinueTournament = () => {
    // This function is no longer needed as the continue/switch prompt is removed.
    // Keeping it here for now, but it will be removed in a subsequent edit.
  };

  // Handler for manual captain selection
  const handleManualCaptainChange = (idx, value) => {
    setManualCaptainNames(names => names.map((n, i) => (i === idx ? value : n)));
  };
  const handleManualCaptainSelect = () => {
    // Only allow if all names are filled and unique
    const names = manualCaptainNames.slice(0, numCaptains).map(n => n.trim()).filter(Boolean);
    if (names.length !== numCaptains || new Set(names.map(n => n.toLowerCase())).size !== numCaptains) {
      setManualCaptainError(`Please enter ${numCaptains} unique names.`);
      return;
    }
    // Optionally, check if names are in yesVoters
    // const invalid = names.find(n => !yesVoters.includes(n));
    // if (invalid) {
    //   setManualCaptainError(`Name not in yes voters: ${invalid}`);
    //   return;
    // }
    setManualCaptainError('');
    setChosenCaptains(names);
    setShowCaptainDialog(true);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-green-200 flex flex-col gap-6 items-center animate-fade-in">
      {/* Display current tournament mode */}
      <div className="w-full flex justify-center mb-2">
        <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-bold text-lg border-2 border-blue-300">
          Mode: {tournamentModeLabel}
        </span>
      </div>
      <h2 className="text-2xl font-extrabold text-green-700 mb-2">Host a Poll</h2>
      {!poll && isAdmin && (
        <form onSubmit={handleCreate} className="w-full flex flex-col gap-4">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Enter poll question..."
            className="w-full px-5 py-3 rounded-full border-2 border-green-200 shadow focus:outline-none focus:ring-2 focus:ring-green-400 text-lg"
          />
          <div className="flex flex-col gap-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-4 py-2 rounded-full border-2 border-green-100 shadow text-lg"
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(idx)} className="text-red-500 font-bold text-xl px-2">&times;</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOption} className="mt-2 px-4 py-2 rounded-full bg-green-100 text-green-800 font-bold hover:bg-green-200 transition">+ Add Option</button>
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-3 rounded-full text-xl font-bold shadow-lg transition-all duration-200 border-2 bg-gradient-to-r from-green-500 via-blue-500 to-yellow-400 text-white border-green-400 hover:scale-105 hover:shadow-2xl"
          >
            Host Poll
          </button>
          {error && <div className="text-red-600 text-center font-bold mt-2">{error}</div>}
        </form>
      )}
      {!poll && !isAdmin && (
        <div className="w-full text-center text-lg text-yellow-700 font-bold bg-yellow-50 rounded-xl p-6 shadow-inner">
          Poll is yet to be created.
        </div>
      )}
      {poll && (
        <div className="w-full flex flex-col gap-6 items-center">
           {/* Tournament option always visible to admin if yesVoters >= 5 */}
           {isAdmin && yesVoters.length >= 5 && !tournamentMode && (
             <div className="w-full flex flex-col items-center mt-8">
               <button
                 onClick={() => setTournamentMode(true)}
                 className="px-8 py-4 rounded-full text-xl font-bold shadow-lg border-2 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500 text-white border-yellow-400 hover:scale-105 hover:shadow-2xl"
               >
                 Want to play a tournament?
               </button>
             </div>
           )}
           {/* If 3 captains and yesVoters drops to 4 or less, show choose 2 captains option (always render if conditions match) */}
           {isAdmin && tournamentMode && storedCaptains && storedCaptains.length === 3 && yesVoters.length <= 4 && (
             <div className="w-full flex flex-col items-center mt-8">
               <button
                 onClick={handleSwitchToTwoCaptains}
                 className="px-8 py-4 rounded-full text-xl font-bold shadow-lg border-2 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500 text-white border-yellow-400 hover:scale-105 hover:shadow-2xl"
               >
                 Play League
               </button>
             </div>
           )}
          <h2 className="text-2xl font-extrabold text-green-700 mb-2">{poll.question}</h2>
          <div className="w-full flex flex-col gap-3">
            {poll.options.map((opt, idx) => (
              <div key={idx} className="w-full">
                <button
                  onClick={() => handleVote(idx)}
                  className={`w-full px-5 py-3 rounded-full text-lg font-bold shadow border-2 transition-all duration-200 flex items-center gap-3
                    ${poll.votes[username] === idx
                      ? 'bg-green-500 text-white border-green-700'
                      : 'bg-gradient-to-r from-green-400 via-blue-400 to-yellow-300 text-green-900 border-green-200 hover:scale-105 hover:shadow-2xl'}
                  `}
                >
                  {opt}
                  {voted && (
                    <span className="ml-auto text-base font-bold text-green-900">{voteCounts[idx]} vote{voteCounts[idx] !== 1 ? 's' : ''} ({totalVotes > 0 ? Math.round((voteCounts[idx] / totalVotes) * 100) : 0}%)</span>
                  )}
                </button>
                {/* Show voters for this option after voting */}
                {voted && votersByOption[idx] && votersByOption[idx].length > 0 && (
                  <div className="mt-2 text-xl text-green-800 bg-green-50 rounded-xl px-4 py-2 shadow-inner">
                    <span className="font-bold">Voted:</span> {votersByOption[idx].join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={handleDeletePoll}
              className="mt-6 px-6 py-3 rounded-full text-xl font-bold shadow-lg transition-all duration-200 border-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-400 text-white border-red-400 hover:scale-105 hover:shadow-2xl"
            >
              Delete Poll
            </button>
          )}
          {/* Captains display for all users */}
          <div className="w-full flex flex-col items-center mt-8">
            {storedCaptains && storedCaptains.length >= 2 ? (
              <div className="bg-green-100 border-2 border-green-300 rounded-2xl px-8 py-4 shadow-lg flex flex-col items-center">
                <h3 className="text-xl font-bold text-green-800 mb-2">Captains</h3>
                <div className="flex gap-8">
                  {storedCaptains.map((cap, idx) => (
                    <span key={cap} className={`text-2xl font-extrabold ${idx === 0 ? 'text-blue-700' : idx === 1 ? 'text-yellow-700' : 'text-green-700'}`}>{cap}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl px-8 py-4 shadow flex flex-col items-center">
                <span className="text-lg font-semibold text-yellow-700">Captains are yet to be chosen</span>
              </div>
            )}
          </div>
          {/* Choose Captain Option for Admins */}
          {isAdmin && (
            <div className="w-full flex flex-col items-center mt-8 gap-4">
              <button
                onClick={chooseRandomCaptains}
                disabled={yesVoters.length < minYesVoters || (storedCaptains && storedCaptains.length === numCaptains)}
                className={`px-8 py-4 rounded-full text-xl font-bold shadow-lg border-2 transition-all duration-200 ${yesVoters.length >= minYesVoters && (!storedCaptains || storedCaptains.length !== numCaptains) ? 'bg-gradient-to-r from-green-500 via-blue-500 to-yellow-400 text-white border-green-400 hover:scale-105 hover:shadow-2xl' : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'}`}
              >
                Choose Captain{tournamentMode ? 's (3)' : 's (2)'}
              </button>
              {/* Manual captain entry */}
              <div className="flex flex-col md:flex-row gap-2 items-center w-full justify-center">
                {[...Array(numCaptains)].map((_, idx) => (
                  <>
                    <input
                      key={idx}
                      type="text"
                      list={`yesvoters-list-${idx}`}
                      value={manualCaptainNames[idx]}
                      onChange={e => handleManualCaptainChange(idx, e.target.value)}
                      placeholder={`Captain ${idx + 1} name`}
                      className="px-4 py-2 rounded-full border-2 border-green-200 shadow text-lg w-40"
                      autoComplete="off"
                    />
                    <datalist id={`yesvoters-list-${idx}`}>
                      {yesVoters.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </>
                ))}
                <button
                  onClick={() => {
                    // Only allow if all names are filled, unique, and in yesVoters
                    const names = manualCaptainNames.slice(0, numCaptains).map(n => n.trim()).filter(Boolean);
                    if (names.length !== numCaptains || new Set(names.map(n => n.toLowerCase())).size !== numCaptains) {
                      setManualCaptainError(`Please enter ${numCaptains} unique names.`);
                      return;
                    }
                    const invalid = names.find(n => !yesVoters.map(yv => yv.toLowerCase()).includes(n.toLowerCase()));
                    if (invalid) {
                      setManualCaptainError(`Name not in yes voters: ${invalid}`);
                      return;
                    }
                    setManualCaptainError('');
                    setChosenCaptains(names);
                    setShowCaptainDialog(true);
                  }}
                  className="px-6 py-2 rounded-full bg-blue-500 text-white font-bold text-lg ml-2 border-2 border-blue-700 hover:bg-blue-600 transition"
                >OK</button>
              </div>
              {manualCaptainError && <div className="text-red-600 text-center font-bold mt-2">{manualCaptainError}</div>}
              <div className="mt-2 text-green-700 font-semibold text-lg">{yesVoters.length} player{yesVoters.length !== 1 ? 's' : ''} have voted Yes</div>
            </div>
          )}
          {/* Captain Dialog */}
          {showCaptainDialog && chosenCaptains && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 border-4 border-green-200">
                <h3 className="text-2xl font-extrabold text-green-700 mb-2">Selected Captains</h3>
                <div className="flex gap-8 mb-4">
                  {chosenCaptains.map((cap, idx) => (
                    <div key={cap} className="flex flex-col items-center">
                      <span className={`text-4xl font-bold ${idx === 0 ? 'text-blue-700' : idx === 1 ? 'text-yellow-700' : 'text-green-700'}`}>{cap}</span>
                      <span className="text-lg text-gray-500 mt-1">Captain {idx + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleConfirmCaptains}
                    className="px-6 py-3 rounded-full text-lg font-bold bg-green-500 text-white border-2 border-green-700 hover:bg-green-600 transition"
                  >
                    Okay
                  </button>
                  <button
                    onClick={handleChooseAgain}
                    className="px-6 py-3 rounded-full text-lg font-bold bg-yellow-400 text-white border-2 border-yellow-600 hover:bg-yellow-500 transition"
                  >
                    Choose Again
                  </button>
                  <button
                    onClick={() => setShowCaptainDialog(false)}
                    className="px-6 py-3 rounded-full text-lg font-bold bg-gray-300 text-gray-700 border-2 border-gray-400 hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
