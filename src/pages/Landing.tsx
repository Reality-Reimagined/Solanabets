import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { TrendingUp, Trophy, ChevronRight, BarChart2, Shield, Zap, Users } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function Landing() {
  const navigate = useNavigate();
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');

  // Add debug logging
  useEffect(() => {
    console.log('Landing Debug:', {
      hasAddress: !!address,
      hasProvider: !!walletProvider,
      providerState: {
        hasWallet: !!walletProvider?.wallet,
        isConnected: walletProvider?.wallet?.connected
      }
    });
  }, [address, walletProvider]);

  // Handle auto-navigation when connected
  useEffect(() => {
    const connectWallet = async () => {
      const connected = await walletProvider?.connect();
      if (connected && address) {
        console.log('Wallet connected, navigating to app...');
        navigate('/app');
      }
    };
    connectWallet();
  }, [walletProvider, address, navigate]);

  const handleConnect = async () => {
    try {
      console.log('Attempting to connect wallet...');
      await walletProvider?.connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white">
       <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Predict. Stake. Win.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              The future of sports betting powered by Solana and AI
            </p>
            <button
              onClick={handleConnect}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105"
            >
              Connect Wallet <ChevronRight className="inline-block ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-black/40 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 p-6 rounded-xl backdrop-blur-lg"
            >
              <TrendingUp className="h-12 w-12 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Predictions</h3>
              <p className="text-gray-400">
                Advanced analytics and machine learning for accurate sports predictions
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 p-6 rounded-xl backdrop-blur-lg"
            >
              <Trophy className="h-12 w-12 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Instant Rewards</h3>
              <p className="text-gray-400">
                Automated payouts directly to your Solana wallet
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 p-6 rounded-xl backdrop-blur-lg"
            >
              <BarChart2 className="h-12 w-12 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Markets</h3>
              <p className="text-gray-400">
                Live odds and market data for informed decision making
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose SolanaBets?</h2>
            <p className="text-xl text-gray-300">Experience the next generation of sports betting</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
                <Shield className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Transparent</h3>
              <p className="text-gray-400">All transactions are recorded on Solana blockchain</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
                <Zap className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Instant transactions and payouts on Solana</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Driven</h3>
              <p className="text-gray-400">Join a growing community of sports enthusiasts</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-800/50 to-indigo-800/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Predicting?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users making smarter sports predictions
            </p>
            <button
              onClick={handleConnect}
              className="bg-white text-indigo-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Launch App <ChevronRight className="inline-block ml-2" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}