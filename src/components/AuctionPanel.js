import React, { useState, useEffect, useRef } from 'react';

const AUCTION_STATE_KEY = 'auction_panel_state';
const BUDGET = 200;
const BASE_PRICES = [6, 4, 2]; // top, mid, low
const TIMER_SECONDS = 60;

function getBracketIdx(playerIdx, totalPlayers) {
  const setSize = Math.ceil(totalPlayers / 3);
  if (playerIdx < setSize) return 0; // top
  if (playerIdx < setSize * 2) return 1; // mid
  return 2; // low
}

function getBasePrice(playerIdx, totalPlayers) {
  return BASE_PRICES[getBracketIdx(playerIdx, totalPlayers)];
}

function getPlayerPoints(player) {
  return player.mvpPoints ?? player.cumulativePoints ?? 0;
}

function getBracketPlayers(sortedPlayers, soldPlayers, bracketIdx, captains) {
  const n = sortedPlayers.length;
  const setSize = Math.ceil(n / 3);
  let start = bracketIdx * setSize;
  let end = Math.min(start + setSize, n);
  const captainSet = new Set((captains || []).map(c => c.toLowerCase()));
  return sortedPlayers.slice(start, end).filter(p => !soldPlayers.includes(p.name) && !captainSet.has((p.name || '').toLowerCase()));
}

function getInitialState(players, captains) {
  const sorted = [...players].sort((a, b) => getPlayerPoints(b) - getPlayerPoints(a));
  return {
    sortedPlayers: sorted,
    soldPlayers: [],
    currentIdx: 0, // not used for picking, but for count
    timer: TIMER_SECONDS,
    auctionActive: false,
    bids: {},
    budgets: Object.fromEntries((captains || []).map(c => [c, BUDGET])),
    rosters: Object.fromEntries((captains || []).map(c => [c, []])),
    lastWinner: null,
    bracketIdx: 0, // 0: top, 1: mid, 2: low
    currentPlayer: null, // will be set on startAuction
    unsoldPlayers: [], // names of unsold players
    auctioningUnsold: false, // are we auctioning unsold players?
  };
}

const AuctionPanel = ({ players, captains, isAdmin, isCaptain, username }) => {
  // Defensive: if captains is missing or empty, show a message and return
  if (!Array.isArray(captains) || captains.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center mt-8 p-6 bg-yellow-50 rounded-xl shadow-inner border-2 border-yellow-200">
        <h2 className="text-2xl font-bold text-yellow-700 mb-2">Auction Panel</h2>
        <div className="text-lg text-yellow-800">Captains are not set. Please set captains before starting the auction.</div>
      </div>
    );
  }
  // Restore state from localStorage or initialize
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(AUCTION_STATE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Defensive: recalc sortedPlayers if player list changed
        if (parsed.sortedPlayers?.length !== players.length) {
          return getInitialState(players, captains);
        }
        return parsed;
      } catch {
        return getInitialState(players, captains);
      }
    }
    return getInitialState(players, captains);
  });
  const timerRef = useRef();

  // Persist state (including unsoldPlayers)
  useEffect(() => {
    localStorage.setItem(AUCTION_STATE_KEY, JSON.stringify(state));
  }, [state]);

  // Timer logic
  useEffect(() => {
    if (!state.auctionActive) return;
    if (state.timer <= 0) {
      handleAuctionEnd();
      return;
    }
    timerRef.current = setTimeout(() => {
      setState(s => ({ ...s, timer: s.timer - 1 }));
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [state.auctionActive, state.timer]);

  // Start auction for next player (random from current bracket or from unsold list)
  const startAuction = () => {
    setState(s => {
      // If auctioning unsold, pick next unsold (skip captains, case-insensitive)
      const captainSet = new Set((captains || []).map(c => c.toLowerCase()));
      if (s.auctioningUnsold) {
        const nextUnsold = s.unsoldPlayers.find(name => !captainSet.has((name || '').toLowerCase()));
        const playerObj = s.sortedPlayers.find(p => p.name === nextUnsold);
        return {
          ...s,
          auctionActive: true,
          timer: TIMER_SECONDS,
          bids: {},
          lastWinner: null,
          currentPlayer: playerObj || null,
          unsoldPlayers: s.unsoldPlayers,
        };
      }
      // Normal bracket logic
      const { sortedPlayers, soldPlayers, bracketIdx } = s;
      let bracketPlayers = getBracketPlayers(sortedPlayers, soldPlayers.concat(s.unsoldPlayers), bracketIdx, captains);
      let nextBracket = bracketIdx;
      // If bracket empty, cycle to next (max 3 tries)
      let tries = 0;
      while (bracketPlayers.length === 0 && tries < 3) {
        nextBracket = (nextBracket + 1) % 3;
        bracketPlayers = getBracketPlayers(sortedPlayers, soldPlayers.concat(s.unsoldPlayers), nextBracket, captains);
        tries++;
      }
      let currentPlayer = null;
      if (bracketPlayers.length > 0) {
        currentPlayer = bracketPlayers[Math.floor(Math.random() * bracketPlayers.length)];
      }
      return {
        ...s,
        auctionActive: true,
        timer: TIMER_SECONDS,
        bids: {},
        lastWinner: null,
        bracketIdx: (nextBracket + 1) % 3, // cycle for next round
        currentPlayer,
      };
    });
  };

  // Place bid
  const [bidInput, setBidInput] = useState('');
  const currentPlayer = state.currentPlayer;
  const totalPlayers = state.sortedPlayers.length;
  const basePrice = currentPlayer ? getBasePrice(state.sortedPlayers.findIndex(p => p.name === currentPlayer.name), totalPlayers) : 0;
  const canBid = isCaptain && state.auctionActive && currentPlayer && !state.soldPlayers.includes(currentPlayer.name);
  const myBudget = state.budgets[username] || 0;
  const highestBid = Object.values(state.bids).length > 0 ? Math.max(...Object.values(state.bids)) : basePrice;
  const highestBidder = Object.entries(state.bids).find(([c, b]) => b === highestBid)?.[0] || null;

  const handleBid = () => {
    const bid = parseInt(bidInput, 10);
    if (!canBid || isNaN(bid) || bid < basePrice || bid > myBudget) return;
    setState(s => ({
      ...s,
      bids: { ...s.bids, [username]: bid },
    }));
    setBidInput('');
  };

  // End auction, assign player
  function handleAuctionEnd() {
    if (!currentPlayer) {
      // If no player found, just advance
      setState(s => ({
        ...s,
        auctionActive: false,
        lastWinner: null,
        currentIdx: s.currentIdx + 1,
        timer: TIMER_SECONDS,
        bids: {},
        currentPlayer: null,
      }));
      return;
    }
    let winner = highestBidder;
    let price = highestBid;
    // If no valid bids, mark as unsold
    if (!winner || price < basePrice) {
      setState(s => {
        const alreadyUnsold = s.unsoldPlayers.includes(currentPlayer.name);
        return {
          ...s,
          auctionActive: false,
          lastWinner: null,
          currentIdx: s.currentIdx + 1,
          timer: TIMER_SECONDS,
          bids: {},
          soldPlayers: [...s.soldPlayers, currentPlayer.name],
          currentPlayer: null,
          unsoldPlayers: alreadyUnsold ? s.unsoldPlayers : [...s.unsoldPlayers, currentPlayer.name],
        };
      });
      return;
    }
    setState(s => {
      const newBudgets = { ...s.budgets, [winner]: s.budgets[winner] - price };
      const newRosters = { ...s.rosters, [winner]: [...(s.rosters[winner] || []), currentPlayer] };
      // Remove from unsold if present
      const newUnsold = s.unsoldPlayers.filter(n => n !== currentPlayer.name);
      return {
        ...s,
        soldPlayers: [...s.soldPlayers, currentPlayer.name],
        auctionActive: false,
        lastWinner: { winner, price, player: currentPlayer.name },
        currentIdx: s.currentIdx + 1,
        timer: TIMER_SECONDS,
        bids: {},
        budgets: newBudgets,
        rosters: newRosters,
        currentPlayer: null,
        unsoldPlayers: newUnsold,
      };
    });
  }

  // Auto-advance to next player or unsold
  useEffect(() => {
    if (!state.auctionActive) {
      const totalPlayers = state.sortedPlayers.length;
      // If all main players auctioned, but unsold remain, start auctioning unsold
      if (!state.auctioningUnsold && state.soldPlayers.length >= totalPlayers && state.unsoldPlayers.length > 0) {
        setState(s => ({ ...s, auctioningUnsold: true, soldPlayers: s.soldPlayers.filter(n => !s.unsoldPlayers.includes(n)), currentIdx: 0 }));
        return;
      }
      // If auctioning unsold and all unsold auctioned, finish
      if (state.auctioningUnsold && state.unsoldPlayers.length === 0) {
        setState(s => ({ ...s, auctioningUnsold: false }));
        return;
      }
      // If auctioning unsold, keep going until unsoldPlayers is empty
      if ((state.auctioningUnsold && state.unsoldPlayers.length > 0) || (!state.auctioningUnsold && state.soldPlayers.length < totalPlayers)) {
        const t = setTimeout(() => startAuction(), 1500);
        return () => clearTimeout(t);
      }
    }
  }, [state.auctionActive, state.soldPlayers.length, state.unsoldPlayers.length, state.auctioningUnsold, state.lastWinner, state.sortedPlayers.length]);

  // Reset auction
  const resetAuction = () => {
    localStorage.removeItem(AUCTION_STATE_KEY);
    setState(getInitialState(players, captains));
  };

  // Auction finished?
  if (!state.auctioningUnsold && state.soldPlayers.length >= totalPlayers && state.unsoldPlayers.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center mt-8 p-6 bg-yellow-50 rounded-xl shadow-inner border-2 border-yellow-200">
        <h2 className="text-3xl font-bold text-yellow-700 mb-2">Auction Complete!</h2>
        <div className="text-lg text-yellow-800 mb-4">All players have been auctioned.</div>
        <div className="w-full flex flex-wrap gap-8 justify-center">
          {captains.map(c => (
            <div key={c} className="bg-white rounded-xl shadow p-4 min-w-[220px]">
              <div className="font-bold text-xl text-green-700 mb-2">{c} (₹{state.budgets[c]} left)</div>
              <ul className="text-green-900">
                {(state.rosters[c] || []).map(p => (
                  <li key={p.name}>{p.name} <span className="text-xs text-gray-500">({getPlayerPoints(p)} pts)</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button className="mt-6 px-6 py-2 bg-yellow-400 text-yellow-900 font-bold rounded shadow hover:bg-yellow-500" onClick={resetAuction}>Reset Auction</button>
      </div>
    );
  }

  // Show unsold list at the bottom
  return (
    <div className="w-full flex flex-col items-center justify-center mt-8 p-6 bg-yellow-50 rounded-xl shadow-inner border-2 border-yellow-200">
      <h2 className="text-3xl font-bold text-yellow-700 mb-2">Auction Panel</h2>
      <div className="mb-4 text-lg text-yellow-800">Budget: ₹200 per captain. Base price: Top ₹6, Mid ₹4, Low ₹2. 1 min per player.</div>
      <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-start mb-6">
        <div className="flex-1 min-w-[260px] bg-white rounded-xl shadow p-4">
          <div className="font-bold text-green-700 text-xl mb-2">Current Player</div>
          {currentPlayer ? (
            <>
              <div className="text-2xl font-extrabold text-green-900 mb-1">{currentPlayer.name}</div>
              <div className="text-sm text-gray-600 mb-2">Points: {getPlayerPoints(currentPlayer)}</div>
              <div className="text-sm text-gray-600 mb-2">Base Price: ₹{basePrice}</div>
              <div className="text-sm text-gray-600 mb-2">Bracket: {['Top','Middle','Lower'][getBracketIdx(state.sortedPlayers.findIndex(p => p.name === currentPlayer.name), totalPlayers)]}</div>
              <div className="text-lg font-bold text-yellow-700 mb-2">Time Left: {state.auctionActive ? state.timer + 's' : 'Waiting...'}</div>
              {state.lastWinner && state.lastWinner.player === currentPlayer.name && (
                <div className="text-green-700 font-bold">Sold to {state.lastWinner.winner} for ₹{state.lastWinner.price}</div>
              )}
            </>
          ) : <div>No player</div>}
        </div>
        <div className="flex-1 min-w-[260px] bg-white rounded-xl shadow p-4">
          <div className="font-bold text-green-700 text-xl mb-2">Budgets</div>
          <ul>
            {captains.map(c => (
              <li key={c} className={"mb-1 " + (c === username ? 'font-bold text-blue-700' : '')}>
                {c}: ₹{state.budgets[c]}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 min-w-[260px] bg-white rounded-xl shadow p-4">
          <div className="font-bold text-green-700 text-xl mb-2">Current Bids</div>
          <ul>
            {captains.map(c => (
              <li key={c} className={"mb-1 " + (c === highestBidder ? 'font-bold text-yellow-700' : '')}>
                {c}: ₹{state.bids[c] || '-'}
              </li>
            ))}
          </ul>
          {canBid && (
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min={basePrice}
                max={myBudget}
                value={bidInput}
                onChange={e => setBidInput(e.target.value)}
                className="border rounded px-2 py-1 w-20"
                placeholder={`Bid (min ₹${basePrice})`}
                disabled={!state.auctionActive}
              />
              <button
                className="px-4 py-1 bg-green-500 text-white rounded font-bold hover:bg-green-600"
                onClick={handleBid}
                disabled={!state.auctionActive || !bidInput || parseInt(bidInput,10)<basePrice || parseInt(bidInput,10)>myBudget}
              >Bid</button>
            </div>
          )}
        </div>
      </div>
      <div className="w-full flex flex-wrap gap-8 justify-center mt-4">
        {captains.map(c => (
          <div key={c} className="bg-white rounded-xl shadow p-4 min-w-[220px]">
            <div className="font-bold text-xl text-green-700 mb-2">{c} Roster</div>
            <ul className="text-green-900">
              {(state.rosters[c] || []).map(p => (
                <li key={p.name}>{p.name} <span className="text-xs text-gray-500">({getPlayerPoints(p)} pts)</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Unsold List */}
      {state.unsoldPlayers.length > 0 && (
        <div className="w-full max-w-2xl mt-8 bg-white rounded-xl shadow p-4 border-2 border-yellow-200">
          <div className="font-bold text-yellow-700 text-xl mb-2">Unsold Players (will be re-auctioned):</div>
          <ul className="flex flex-wrap gap-4">
            {state.unsoldPlayers.map(name => {
              const p = state.sortedPlayers.find(p => p.name === name);
              return (
                <li key={name} className="px-4 py-2 bg-yellow-100 rounded-lg text-yellow-900 font-semibold shadow">
                  {name} <span className="text-xs text-gray-500">({getPlayerPoints(p)} pts)</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button className="mt-6 px-6 py-2 bg-yellow-400 text-yellow-900 font-bold rounded shadow hover:bg-yellow-500" onClick={resetAuction}>Reset Auction</button>
    </div>
  );
};

export default AuctionPanel; 