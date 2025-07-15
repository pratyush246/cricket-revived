// App.jsx
import React,{ useState, useEffect } from 'react';
import PDFUploader from './PDFUploader';
import StatsChart from './StatsChart';
import Leaderboard from './Leaderboard';
import SetsOfPlayers from './SetsOfPlayers';
import DraftPanel from './DraftPanel';
import Login from './Login';
import CreatePoll from './CreatePoll';
import { ADMINS } from './constant';
import { FaTrophy, FaUserEdit, FaFileUpload, FaGithub } from 'react-icons/fa';
import { GiCricketBat } from 'react-icons/gi';
import { MdSportsCricket, MdLeaderboard, MdGroups, MdHowToVote } from 'react-icons/md';
import './index.css';

export default function App() {
  const [players, setPlayers] = useState([]);
  const [draftedTeam, setDraftedTeam] = useState([]);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [username, setUsername] = useState(null);

  // If not logged in, show Login page
 

  // Load players from localStorage on mount
  useEffect(() => {
    const storedPlayers = localStorage.getItem('players');
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }
  }, []);

  const calculateMVP = (players) => {
    return players.map(player => {
      // Destructure with defaults to handle missing/null values
      const {
        batting = {},
        bowling = {},
        fielding = {},
        matches = 0
      } = player;
      const {
        runs = 0,
        average = 0,
        strikeRate = 0,
        fours = 0,
        sixes = 0,
        fifties = 0,
        hundreds = 0,
      } = batting;
      const {
        wickets = 0,
        economy = 0,
        maidens = 0,
        overs = 0,
        runs: bowlRuns = 0,
        average: bowlAvg = 0,
        strikeRate: bowlSR = 0
      } = bowling;
      const {
        catches = 0,
        runOuts = 0,
        stumpings = 0,
        droppedCatches = 0,
        brilliantCatches = 0,
        caughtAndBowl = 0,
        caughtBehind = 0,
        assistRunOuts = 0
      } = fielding;

      // Convert string fields to numbers if needed
      const droppedCatchesNum = parseInt(droppedCatches) || 0;
      const brilliantCatchesNum = parseInt(brilliantCatches) || 0;

      // Batting points (no innings normalization)
      const battingPoints = (
        runs * 0.2 +
        average * 0.5 +
        strikeRate * 0.3 +
        fours * 0.2 +
        sixes * 0.3 +
        fifties * 1.5 +
        hundreds * 3
      );

      // Bowling points (no innings normalization)
      const bowlingPoints = (
        wickets * 2 +
        maidens * 0.5 +
        (parseFloat(overs) || 0) * 0.2 +
        (bowlRuns ? -bowlRuns * 0.05 : 0) +
        (bowlAvg ? -bowlAvg * 0.1 : 0) +
        (bowlSR ? -bowlSR * 0.05 : 0) +
        (economy ? -economy * 0.4 : 0)
      );

      // Fielding points (not normalized)
      const fieldingPoints =
        catches * 1 +
        runOuts * 1.5 +
        stumpings * 2 +
        droppedCatchesNum * -0.5 +
        brilliantCatchesNum * 1.5 +
        caughtAndBowl * 1 +
        caughtBehind * 1 +
        assistRunOuts * 1;

      // Matches points (not normalized)
      const matchesPoints = matches * 0.1;

      const mvpPoints = battingPoints + bowlingPoints + fieldingPoints + matchesPoints;

      return { ...player, mvpPoints: Math.round(mvpPoints * 100) / 100 };
    });
  };

  const handleExtract = (batting, bowling, fielding) => {
    const playerMap = {};

    const ensurePlayer = (name) => {
      if (!playerMap[name]) {
        playerMap[name] = {
          name,
          matches: 0,
          // Batting fields
          batting: {
            runs: 0,
            average: 0,
            strikeRate: 0,
            team: '',
            hand: '',
            inns: 0,
            balls: 0,
            highest: '',
            notOut: 0,
            fours: 0,
            sixes: 0,
            fifties: 0,
            hundreds: 0
          },
          // Bowling fields
          bowling: {
            wickets: 0,
            economy: 0,
            team: '',
            style: '',
            matches: 0,
            inns: 0,
            overs: '',
            runs: 0,
            highest: '',
            maidens: 0,
            average: 0,
            strikeRate: 0
          },
          // Fielding fields
          fielding: {
            team: '',
            matches: 0,
            dismissal: 0,
            catches: 0,
            caughtAndBowl: 0,
            caughtBehind: 0,
            runOuts: 0,
            assistRunOuts: 0,
            stumpings: 0,
            droppedCatches: '',
            brilliantCatches: '',
            extra1: '',
            extra2: ''
          }
        };
      }
      return playerMap[name];
    };

    batting.forEach(b => {
      const player = ensurePlayer(b.name);
      player.matches = Math.max(player.matches, b.matches);
      player.batting = {
        runs: b.runs,
        average: b.average,
        strikeRate: b.strikeRate,
        team: b.team,
        hand: b.hand,
        inns: b.inns,
        balls: b.balls,
        highest: b.highest,
        notOut: b.notOut,
        fours: b.fours,
        sixes: b.sixes,
        fifties: b.fifties,
        hundreds: b.hundreds
      };
    });

    bowling.forEach(b => {
      const player = ensurePlayer(b.name);
      player.matches = Math.max(player.matches, b.matches);
      player.bowling = {
        wickets: b.wickets,
        economy: b.economy,
        team: b.team,
        style: b.style,
        matches: b.matches,
        inns: b.inns,
        overs: b.overs,
        runs: b.runs,
        highest: b.highest,
        maidens: b.maidens,
        average: b.average,
        strikeRate: b.strikeRate
      };
    });

    fielding.forEach(f => {
      const player = ensurePlayer(f.name);
      player.matches = Math.max(player.matches, f.matches);
      player.fielding = {
        team: f.team,
        matches: f.matches,
        dismissal: f.dismissal,
        catches: f.catches,
        caughtAndBowl: f.caughtAndBowl,
        caughtBehind: f.caughtBehind,
        runOuts: f.runOuts,
        assistRunOuts: f.assistRunOuts,
        stumpings: f.stumpings,
        droppedCatches: f.droppedCatches,
        brilliantCatches: f.brilliantCatches,
        extra1: f.extra1,
        extra2: f.extra2
      };
    });

    const mergedPlayers = Object.values(playerMap);
    const enrichedPlayers = calculateMVP(mergedPlayers).filter( player => !!player.name);

   
    setPlayers(enrichedPlayers);
    // Save to localStorage
    localStorage.setItem('players', JSON.stringify(enrichedPlayers));
  };

   // Add your admin usernames here (lowercase)
  const isAdmin = username && ADMINS.includes(username.toLowerCase());
  // Check if user is a captain
  const [isCaptain, setIsCaptain] = React.useState(false);
  // Track yesVoters for DraftPanel
  const [yesVoters, setYesVoters] = React.useState([]);

  React.useEffect(() => {
    function updateCaptainAndYesVoters() {
      const captains = JSON.parse(localStorage.getItem('captains') || '[]');
      const yv = JSON.parse(localStorage.getItem('yes_voters') || '[]');
      setYesVoters(yv);
      setIsCaptain(captains.includes(username) && yv.includes(username));
    }
    updateCaptainAndYesVoters();
    // Listen for changes to captains and yes_voters in localStorage (cross-tab)
    const handleStorage = () => {
      updateCaptainAndYesVoters();
    };
    window.addEventListener('storage', handleStorage);
    // Poll for changes in the same tab
    const interval = setInterval(updateCaptainAndYesVoters, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [username]);

  if (!username) {
    return <Login onLogin={setUsername} />;
  }  

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-200 via-green-100 to-yellow-100 animate-bg-fade flex flex-col relative">
      {/* Soft overlay for extra depth */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-white/40 via-green-100/20 to-yellow-100/30" />
      {/* Floating cricket ball animation (icon only) */}
      <div className="fixed bottom-32 right-12 z-10 animate-bounce-slow pointer-events-none opacity-80">
        <MdSportsCricket className="text-[60px] text-green-700 drop-shadow-lg" />
      </div>
      {/* Sparkles animation */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {[...Array(18)].map((_, i) => (
          <div key={i} className={`absolute animate-sparkle`} style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            width: `${8 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 8}px`,
            background: 'radial-gradient(circle, #fff 0%, #fff0 80%)',
            borderRadius: '50%',
            opacity: 0.5 + Math.random() * 0.3
          }} />
        ))}
      </div>
      {/* Main Content or Full-page StatsChart */}
      {selectedPlayer ? (
        <div className="fixed inset-0 z-50 flex flex-col items-start justify-start bg-gradient-to-br from-green-200 via-green-100 to-yellow-100 animate-bg-fade overflow-auto">
          <button
            className="fixed top-6 left-6 text-4xl text-green-700 hover:text-yellow-500 font-extrabold focus:outline-none bg-white/80 rounded-full shadow-lg w-14 h-14 flex items-center justify-center z-50 border-2 border-green-200"
            onClick={() => setSelectedPlayer(null)}
            aria-label="Back"
            style={{lineHeight: 1}}
          >
            &#8592;
          </button>
          <div className="w-full flex flex-col items-center justify-start overflow-auto pb-8">
            <h3 className="text-4xl md:text-5xl font-extrabold text-center mt-8 mb-8 text-green-700 drop-shadow-lg tracking-tight bg-gradient-to-r from-green-800 via-yellow-600 to-green-500 bg-clip-text text-transparent">
              {selectedPlayer.name} <span className="font-light">- Full Stats</span>
            </h3>
            <div className="w-full max-w-6xl mx-auto px-2 md:px-8">
              <StatsChart player={selectedPlayer} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header with cricket bat and ball */}
          <div className="flex items-center justify-center gap-4 mb-2 mt-2 animate-fade-in">
            <GiCricketBat className="text-5xl text-green-700 drop-shadow-lg -rotate-12" />
            <h1 className="text-5xl md:text-6xl font-extrabold text-center bg-gradient-to-r from-green-800 via-yellow-600 to-green-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight animate-fade-in">Cricket Revived</h1>
            <MdSportsCricket className="text-5xl text-green-700 drop-shadow-lg rotate-12" />
          </div>
          {/* Dashed crease divider */}
          <div className="w-full flex justify-center mb-6 animate-fade-in">
            <div className="border-t-4 border-dashed border-green-600 w-2/3" style={{borderRadius: 2}}></div>
          </div>
          {/* Tab Buttons */}
          <div className="flex space-x-4 mb-8 justify-center">
            <button
              className={`flex items-center gap-2 px-6 py-3 cursor-pointer rounded-full text-lg font-bold shadow transition-all duration-200 border-2 ${activeTab === 'leaderboard' ? 'bg-green-600 text-white border-green-700 scale-105' : 'bg-gray-100 text-green-700 border-green-200 hover:bg-green-100 hover:scale-105'}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <MdLeaderboard className="text-xl" /> Leaderboard
            </button>
            {(isAdmin || isCaptain) && (
              <button
                className={`flex items-center gap-2 px-6 py-3 cursor-pointer rounded-full text-lg font-bold shadow transition-all duration-200 border-2 ${activeTab === 'draft' ? 'bg-green-600 text-white border-green-700 scale-105' : 'bg-gray-100 text-green-700 border-green-200 hover:bg-green-100 hover:scale-105'}`}
                onClick={() => setActiveTab('draft')}
              >
                <GiCricketBat className="text-xl" /> Draft Panel
              </button>
            )}
            {isAdmin && (
              <button
                className={`flex items-center gap-2 px-6 py-3 cursor-pointer rounded-full text-lg font-bold shadow transition-all duration-200 border-2 ${activeTab === 'uploader' ? 'bg-green-600 text-white border-green-700 scale-105' : 'bg-gray-100 text-green-700 border-green-200 hover:bg-green-100 hover:scale-105'}`}
                onClick={() => setActiveTab('uploader')}
              >
                <MdSportsCricket className="text-xl" /> PDF Uploader
              </button>
            )}
            {(isAdmin || isCaptain) && (
              <button
                className={`flex items-center gap-2 px-6 py-3 cursor-pointer rounded-full text-lg font-bold shadow transition-all duration-200 border-2 ${activeTab === 'sets' ? 'bg-green-600 text-white border-green-700 scale-105' : 'bg-gray-100 text-green-700 border-green-200 hover:bg-green-100 hover:scale-105'}`}
                onClick={() => setActiveTab('sets')}
              >
                <MdGroups className="text-xl" /> Sets of Players
              </button>
            )}
            <button
              className={`flex items-center gap-2 px-6 py-3 cursor-pointer rounded-full text-lg font-bold shadow transition-all duration-200 border-2 ${activeTab === 'poll' ? 'bg-green-600 text-white border-green-700 scale-105' : 'bg-gray-100 text-green-700 border-green-200 hover:bg-green-100 hover:scale-105'}`}
              onClick={() => setActiveTab('poll')}
            >
              <MdHowToVote className="text-xl" /> {isAdmin ? 'Create Poll' : 'Vote'}
            </button>
          </div>
          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'leaderboard' && players.length > 0 && (
              <Leaderboard players={players} onPlayerSelect={setSelectedPlayer} />
            )}
            {(isAdmin || isCaptain) && activeTab === 'draft' && players.length > 0 && (
              <DraftPanel players={players} draftedTeam={draftedTeam} setDraftedTeam={setDraftedTeam} yesVoters={yesVoters} />
            )}
            {isAdmin && activeTab === 'uploader' && (
              <PDFUploader onExtract={handleExtract} />
            )}
            {(isAdmin || isCaptain) && activeTab === 'sets' && (
              <div className="w-full flex flex-col items-center justify-center min-h-[300px] text-2xl text-green-800 font-bold p-8 bg-green-50 rounded-2xl shadow-inner animate-fade-in">
                <MdGroups className="text-4xl mb-4 text-green-700" />
                <SetsOfPlayers players={yesVoters.length > 0 ? players.filter(p => yesVoters.map(n => n.toLowerCase()).includes(p.name.toLowerCase())) : players} />
              </div>
            )}
            {activeTab === 'poll' && (
              <div className="w-full flex flex-col items-center justify-center min-h-[300px] text-2xl text-green-800 font-bold p-8 bg-green-50 rounded-2xl shadow-inner animate-fade-in">
                <MdHowToVote className="text-4xl mb-4 text-green-700" />
                <CreatePoll />
              </div>
            )}
          </div>
        </>
      )}
      <style>{`
        @keyframes bg-fade {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-bg-fade {
          background-size: 200% 200%;
          animation: bg-fade 12s ease-in-out infinite alternate;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-24px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3.5s infinite cubic-bezier(.4,0,.2,1);
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.7); }
          10% { opacity: 1; transform: scale(1.1); }
          50% { opacity: 0.7; }
        }
        .animate-sparkle {
          animation: sparkle 6s infinite linear;
        }
      `}</style>
    </div>
  );
}
