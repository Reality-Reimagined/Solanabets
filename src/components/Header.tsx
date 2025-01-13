import React from 'react';
import { WalletState } from '../types';
import { Wallet2 } from 'lucide-react';

interface HeaderProps {
  wallet: WalletState;
  onConnect: () => void;
}

export function Header({ wallet, onConnect }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Wallet2 className="h-8 w-8" />
          <h1 className="text-2xl font-bold">SolanaBets</h1>
        </div>
        
        <button
          onClick={onConnect}
          className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
        >
          {wallet.connected ? (
            <span>
              {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)} ({wallet.balance.toFixed(2)} SOL)
            </span>
          ) : (
            'Connect Wallet'
          )}
        </button>
      </div>
    </header>
  );
}