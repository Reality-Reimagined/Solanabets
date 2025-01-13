import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/Header';
import { EventCard } from '../components/EventCard';
import { PredictionsList } from '../components/PredictionsList';
import { Event, Prediction, WalletState } from '../types';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection, type Provider } from '@reown/appkit-adapter-solana/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { oddsApi, GameOdds } from '../services/oddsApi';
// import { PoolService } from '../services/poolService';
import { PublicKey } from '@solana/web3.js';
import { PoolStats } from '../components/PoolStats';
import { LiquidityProvider } from '../components/LiquidityProvider';
import { usePoolSubscription } from '../hooks/usePoolSubscription';
import { PoolState } from '../types/pool';
import { usePoolService } from '../hooks/usePoolService';

// Group events by date
const groupEventsByDate = (events: Event[]) => {
  const grouped = events.reduce((acc, event) => {
    const date = new Date(event.startTime).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return Object.entries(grouped).sort((a, b) => 
    new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );
};

interface BetParams {
  eventId: string;
  prediction: string;
  amount: number;
  game: Event;
}

export function Platform() {
  const navigate = useNavigate();
  const { address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [games, setGames] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<Map<string, PublicKey>>(new Map());
  const { poolService, error: poolServiceError, walletConnected, connect } = usePoolService();
  const [selectedPool, setSelectedPool] = useState<PoolState | null>(null);
  const [lpShare, setLpShare] = useState<number>(0);
  const [selectedGame, setSelectedGame] = useState<Event | null>(null);

  // Subscribe to pool updates
  const { poolState, loading: poolLoading } = usePoolSubscription(
    selectedGame ? pools.get(selectedGame.id) : undefined
  );

  // Calculate LP share when pool state changes
  useEffect(() => {
    if (poolState && address) {
      const userLiquidity = poolState.bets
        .filter(bet => bet.better.toString() === address)
        .reduce((sum, bet) => sum + bet.amount, 0);
      
      const totalLiquidity = poolState.totalHomeBets + poolState.totalAwayBets;
      setLpShare((userLiquidity / totalLiquidity) * 100);
    }
  }, [poolState, address]);

  // Fetch balance when address changes
  const [balance, setBalance] = React.useState(0);
  useEffect(() => {
    if (address && connection) {
      connection.getBalance(new PublicKey(address)).then(bal => 
        setBalance(bal / LAMPORTS_PER_SOL)
      );
    }
  }, [address, connection]);

  // Add debug ref to track mount count
  const mountCount = React.useRef(0);

  // Fetch NBA games
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    // Debug mount count
    mountCount.current += 1;
    console.log('Effect running, mount count:', mountCount.current);

    const fetchGames = async () => {
      if (!mounted) return;

      try {
        setLoading(true);
        const odds = await oddsApi.getOdds('basketball_nba', 'h2h');
        
        if (!mounted) return;

        const transformedGames = odds.map((game: GameOdds): Event => ({
          id: game.id,
          title: 'NBA Regular Season',
          sport: 'Basketball',
          startTime: game.commence_time,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          odds: {
            home: game.bookmakers[0]?.markets[0]?.outcomes
              .find(o => o.name === game.home_team)?.price || 2.0,
            away: game.bookmakers[0]?.markets[0]?.outcomes
              .find(o => o.name === game.away_team)?.price || 2.0
          },
          prediction: {
            winner: game.home_team,
            confidence: Math.floor(55 + Math.random() * 30),
            analysis: `Based on recent performance metrics and historical matchups...`
          }
        }));

        setGames(transformedGames);
        setError(null);
      } catch (err) {
        if (mounted) {
          setError('Failed to load games. Please try again later.');
          console.error('Error fetching games:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Only fetch if we don't have games yet
    if (games.length === 0) {
      fetchGames();
    }

    // Set up interval for refreshing
    intervalId = setInterval(() => {
      if (mounted) {
        console.log('Refreshing games data...');
        fetchGames();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      console.log('Cleaning up effect, mount count:', mountCount.current);
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Empty dependency array since we don't need to re-run this effect

  // Add debug logging for wallet state
  useEffect(() => {
    console.log('Wallet Debug:', {
      hasAddress: !!address,
      hasConnection: !!connection,
      hasProvider: !!walletProvider,
      providerState: {
        hasWallet: !!walletProvider?.name,
        isConnected: walletProvider?.connect,
        publicKey: walletProvider?.publicKey?.toString()
      }
    });
  }, [address, connection, walletProvider]);

  // Simplify the wallet connection check
  const wallet: WalletState = {
    connected: !!walletProvider?.connect,
    address: address || null,
    balance: 0 // We'll update this after connection
  };

  // Handle initial navigation/connection
  useEffect(() => {
    if (!wallet.connected) {
      console.log('No wallet connection, redirecting to landing...');
      navigate('/');
    }
  }, [wallet.connected, navigate]);

  // // Show loading state while checking connection
  // if (!wallet.connected) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
  //     </div>
  //   );
  // }

  // Add connection status logging
  useEffect(() => {
    console.log('Connection Status:', {
      address,
      walletConnected,
      hasPoolService: !!poolService,
      error: poolServiceError?.message
    });
  }, [address, walletConnected, poolService, poolServiceError]);

  // Initialize pool service when wallet is connected
  useEffect(() => {
    if (!address || !walletConnected) {
      console.log('Waiting for wallet connection...');
      return;
    }

    console.log('Wallet connected, initializing pool service...');
  }, [address, walletConnected]);

  // Create or update pools based on API odds
  useEffect(() => {
    const syncPools = async () => {
      // Temporarily comment out pool syncing
      /*
      if (!poolService || !games.length) return;

      try {
        for (const game of games) {
          if (!pools.has(game.id)) {
            console.log('Creating pool for game:', game.id);
            const poolAddress = await poolService.createPool({
              eventId: game.id,
              initialOddsHome: game.odds.home,
              initialOddsAway: game.odds.away,
              minBet: 0.1,
              maxBet: 10
            });
            setPools(prev => new Map(prev).set(game.id, poolAddress.poolAddress));
          }
        }
      } catch (err) {
        console.error('Failed to sync pools:', err);
      }
      */
    };

    syncPools();
  }, [games, poolService]);

  const handlePlaceBet = async ({ eventId, prediction, amount, game }: BetParams) => {
    if (!poolService || !pools.has(eventId)) {
      console.error('Pool service or pool not found');
      return;
    }

    try {
      const team = prediction === game.homeTeam ? 'home' : 'away';
      console.log(`Placing bet on ${team} team for game ${eventId}`);

      await poolService.placeBet(
        pools.get(eventId)!,
        amount * LAMPORTS_PER_SOL,
        team
      );

      // Update UI after bet
      const poolState = await poolService.getPoolState(pools.get(eventId)!);
      setSelectedPool(poolState);
    } catch (error) {
      console.error('Failed to place bet:', error);
      // You might want to show an error notification here
    }
  };

  const handleClaim = async (predictionId: string) => {
    if (!address) {
      await walletProvider.connect();
      return;
    }

    try {
      setPredictions(predictions.map(p => 
        p.eventId === predictionId ? { ...p, claimed: true } : p
      ));
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const groupedEvents = groupEventsByDate(games);

  const handleAddLiquidity = async (amount: number) => {
    if (!poolService || !selectedPool) return;
    
    try {
      await poolService.addLiquidity(
        pools.get(selectedPool.eventId)!,
        amount * LAMPORTS_PER_SOL
      );
    } catch (error) {
      console.error('Failed to add liquidity:', error);
    }
  };

  const handleRemoveLiquidity = async (amount: number) => {
    if (!poolService || !selectedPool) return;
    
    try {
      await poolService.removeLiquidity(
        pools.get(selectedPool.eventId)!,
        amount * LAMPORTS_PER_SOL
      );
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
    }
  };

  // Update selectedPool when poolState changes
  useEffect(() => {
    if (poolState) {
      setSelectedPool(poolState);
    }
  }, [poolState]);

  // Add game selection handler
  const handleGameSelect = (game: Event) => {
    setSelectedGame(game);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header wallet={wallet} onConnect={() => walletProvider.connect()} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">NBA Games</h2>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
              ) : error ? (
                <div className="text-red-500 p-4 text-center">{error}</div>
              ) : (
                <Tabs defaultValue={groupedEvents[0]?.[0]} className="w-full">
                  <TabsList className="w-full flex overflow-x-auto">
                    {groupedEvents.map(([date]) => (
                      <TabsTrigger key={date} value={date} className="flex-1">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {groupedEvents.map(([date, events]) => (
                    <TabsContent key={date} value={date} className="space-y-4">
                      {events.map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          wallet={wallet}
                          onPlaceBet={(prediction, amount) => handlePlaceBet({
                            eventId: event.id,
                            prediction,
                            amount,
                            game: event
                          })}
                          selected={selectedGame?.id === event.id}
                          onSelect={() => handleGameSelect(event)}
                        />
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>

            {selectedPool && (
              <PoolStats 
                pool={selectedPool}
                className="mb-6"
              />
            )}
          </div>
          
          <div className="space-y-6">
            {selectedPool && (
              <LiquidityProvider
                pool={selectedPool}
                onAddLiquidity={handleAddLiquidity}
                onRemoveLiquidity={handleRemoveLiquidity}
                lpShare={lpShare}
              />
            )}
            
            <PredictionsList
              predictions={predictions}
              onClaim={handleClaim}
            />
          </div>
        </div>
      </main>
    </div>
  );
}