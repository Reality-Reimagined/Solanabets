import React from 'react';
import { Link } from 'react-router-dom';
import { useAppKit } from '@reown/appkit/react';
import { Wallet2 } from 'lucide-react';

export function Navbar() {
  const { open, isConnected, address } = useAppKit();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Wallet2 className="h-8 w-8" />
            <span className="text-2xl font-bold">SolanaBets</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/app" className="text-white hover:text-indigo-300 transition-colors">
              Platform
            </Link>
            <button
              onClick={open}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-lg transition-colors"
            >
              {isConnected ? (
                <span>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}