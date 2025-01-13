import React from 'react';
import { Prediction } from '../types';
import { motion } from 'framer-motion';

interface PredictionsListProps {
  predictions: Prediction[];
  onClaim: (predictionId: string) => void;
}

export function PredictionsList({ predictions, onClaim }: PredictionsListProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
      <h2 className="text-xl font-bold mb-4">Your Predictions</h2>
      {predictions.length === 0 ? (
        <p className="text-gray-400 text-sm">No predictions yet. Place a bet to get started!</p>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <motion.div
              key={`${prediction.eventId}-${prediction.timestamp}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/20 rounded-lg p-4 border border-gray-700/50"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-black">{prediction.prediction}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(prediction.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-indigo-400 font-medium">
                    <span className="text-gray-400 text-sm">Bet: </span>
                    <span className="text-lg">{prediction.amount}</span>
                    <span className="text-sm text-gray-400 ml-1"> SOL</span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-gray-400">Win: </span>
                    <span className="text-indigo-400 font-medium">
                      {(prediction.amount * prediction.odds).toFixed(2)}
                      <span className="text-sm ml-1">SOL</span>
                    </span>
                  </div>
                </div>
              </div>

              {!prediction.claimed && (
                <button
                  onClick={() => onClaim(prediction.eventId)}
                  className="w-full mt-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Claim Reward
                </button>
              )}
              {prediction.claimed && (
                <div className="flex items-center justify-center w-full mt-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Claimed
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}