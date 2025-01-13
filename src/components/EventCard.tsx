import React from 'react';
import { Event, WalletState } from '../types';
import { motion } from 'framer-motion';
import { Dialog } from './ui/Dialog';

interface EventCardProps {
  event: Event;
  wallet: WalletState;
  onPlaceBet: (prediction: string, amount: number) => void;
  selected?: boolean;
  onSelect?: () => void;
}

interface PendingBet {
  team: string;
  amount: number;
  odds: number;
}

export function EventCard({ event, wallet, onPlaceBet, selected, onSelect }: EventCardProps) {
  const [betAmount, setBetAmount] = React.useState(1);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [pendingBet, setPendingBet] = React.useState<PendingBet | null>(null);
  
  const isLive = new Date(event.startTime) <= new Date();

  const formatOdds = (odds: number) => odds.toFixed(2);
  const calculatePotentialWinnings = (odds: number) => (betAmount * odds).toFixed(2);

  const handleBetClick = (team: string, odds: number) => {
    if (!wallet.connected) {
      // Show connect wallet prompt
      return;
    }
    
    setPendingBet({
      team,
      amount: betAmount,
      odds
    });
    setShowConfirmation(true);
  };

  const handleConfirmBet = async () => {
    if (!pendingBet) return;
    
    try {
      await onPlaceBet(pendingBet.team, pendingBet.amount);
      setShowConfirmation(false);
      setPendingBet(null);
    } catch (error) {
      console.error('Failed to place bet:', error);
    }
  };

  const getWinnerStyle = (teamName: string) => {
    return event.prediction.winner === teamName 
      ? 'border-indigo-500/50 bg-indigo-500/10' 
      : 'border-gray-700/50';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 backdrop-blur-lg rounded-lg p-6 space-y-4 border transition-all cursor-pointer
          ${selected ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-gray-700/50 hover:border-gray-600'}
        `}
        onClick={onSelect}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <p className="text-sm text-gray-400">
              {new Date(event.startTime).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          {isLive && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm font-medium animate-pulse">
              Live
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <div className={`text-center p-4 rounded-lg border ${getWinnerStyle(event.homeTeam)}`}>
            <p className="font-semibold mb-2">{event.homeTeam}</p>
            <p className="text-lg font-bold text-indigo-400">x{formatOdds(event.odds.home)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Potential Win: {calculatePotentialWinnings(event.odds.home)} SOL
            </p>
          </div>
          <div className="text-center text-gray-400 font-bold">VS</div>
          <div className={`text-center p-4 rounded-lg border ${getWinnerStyle(event.awayTeam)}`}>
            <p className="font-semibold mb-2">{event.awayTeam}</p>
            <p className="text-lg font-bold text-indigo-400">x{formatOdds(event.odds.away)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Potential Win: {calculatePotentialWinnings(event.odds.away)} SOL
            </p>
          </div>
        </div>

        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">AI Prediction</p>
            <span className="text-sm font-bold text-indigo-400">{event.prediction.confidence}% Confidence</span>
          </div>
          <p className="text-sm text-gray-400 mb-3">{event.prediction.analysis}</p>
          <div className="w-full bg-gray-700/50 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${event.prediction.confidence}%` }}
            />
          </div>
        </div>

        {wallet.connected && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full bg-black/20 rounded-lg pl-3 pr-12 py-2 text-sm border border-gray-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="Amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  SOL
                </span>
              </div>
              <button
                onClick={() => handleBetClick(event.homeTeam, event.odds.home)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors"
              >
                Bet Home
              </button>
              <button
                onClick={() => handleBetClick(event.awayTeam, event.odds.away)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors"
              >
                Bet Away
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <Dialog isOpen={showConfirmation} onClose={() => setShowConfirmation(false)}>
        {pendingBet && (
          <>
            <h3 className="text-xl font-bold mb-4 text-white">Confirm Your Bet</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                <span className="text-gray-300">Team</span>
                <span className="font-medium text-white">{pendingBet.team}</span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                <span className="text-gray-300">Amount</span>
                <div className="font-medium text-white">
                  {pendingBet.amount}
                  <span className="text-sm text-gray-400 ml-1">SOL</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                <span className="text-gray-300">Odds</span>
                <div className="font-medium text-indigo-400">
                  x{formatOdds(pendingBet.odds)}
                </div>
              </div>
              <div className="flex justify-between items-center bg-indigo-500/20 p-3 rounded-lg">
                <span className="text-gray-200">Potential Win</span>
                <div className="font-medium text-indigo-400">
                  {calculatePotentialWinnings(pendingBet.odds)}
                  <span className="text-sm ml-1">SOL</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmBet}
                className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-medium text-white transition-colors"
              >
                Sign & Confirm
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}