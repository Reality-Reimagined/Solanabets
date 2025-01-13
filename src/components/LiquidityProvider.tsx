import React, { useState } from 'react';

import { PoolState } from '../types/pool';

interface LiquidityProviderProps {
  pool: PoolState;
  onAddLiquidity: (amount: number) => Promise<void>;
  onRemoveLiquidity: (amount: number) => Promise<void>;
}

export function LiquidityProvider({ pool, onAddLiquidity, onRemoveLiquidity }: LiquidityProviderProps) {
  const [amount, setAmount] = useState(1);
  const [isAdding, setIsAdding] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAdding) {
        await onAddLiquidity(amount);
      } else {
        await onRemoveLiquidity(amount);
      }
      setAmount(1);
    } catch (error) {
      console.error('Failed to handle liquidity:', error);
    }
  };

  return (
    <div className="bg-black/20 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Liquidity Provider</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsAdding(true)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isAdding ? 'bg-indigo-500 text-white' : 'bg-gray-700/50 text-gray-300'
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setIsAdding(false)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isAdding ? 'bg-indigo-500 text-white' : 'bg-gray-700/50 text-gray-300'
          }`}
        >
          Remove Liquidity
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
            className="w-full bg-black/20 rounded-lg pl-3 pr-12 py-2 text-sm border border-gray-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            placeholder="Amount"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            SOL
          </span>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors"
        >
          {isAdding ? 'Add Liquidity' : 'Remove Liquidity'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-400">
        <p>Your Share: {/* Calculate LP share */}%</p>
        <p>Estimated Returns: {/* Calculate estimated returns */} SOL</p>
      </div>
    </div>
  );
} 