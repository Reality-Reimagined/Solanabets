import React from 'react';
import { PoolState } from '../types/pool';
import { motion } from 'framer-motion';

interface PoolStatsProps {
  pool: PoolState;
  className?: string;
}

export function PoolStats({ pool, className = '' }: PoolStatsProps) {
  const totalLiquidity = pool.totalHomeBets + pool.totalAwayBets;
  const homePercentage = (pool.totalHomeBets / totalLiquidity) * 100 || 0;
  const awayPercentage = (pool.totalAwayBets / totalLiquidity) * 100 || 0;

  return (
    <div className={`bg-black/20 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Pool Statistics</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Total Liquidity</span>
            <span className="font-medium">{totalLiquidity.toFixed(2)} SOL</span>
          </div>
          <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Home Pool</span>
              <span className="font-medium">{pool.totalHomeBets.toFixed(2)} SOL</span>
            </div>
            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${homePercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Away Pool</span>
              <span className="font-medium">{pool.totalAwayBets.toFixed(2)} SOL</span>
            </div>
            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${awayPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Current Odds</p>
            <div className="flex justify-between mt-1">
              <span>Home</span>
              <span className="font-medium text-indigo-400">x{pool.oddsHome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Away</span>
              <span className="font-medium text-indigo-400">x{pool.oddsAway.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="text-gray-400">Pool Info</p>
            <div className="flex justify-between mt-1">
              <span>Min Bet</span>
              <span className="font-medium">{pool.minBet} SOL</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Max Bet</span>
              <span className="font-medium">{pool.maxBet} SOL</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Fee</span>
              <span className="font-medium">{pool.feePercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 