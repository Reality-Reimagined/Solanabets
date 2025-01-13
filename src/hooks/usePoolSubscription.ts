import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { PoolState } from '../types/pool';
import { usePoolService } from './usePoolService';

export function usePoolSubscription(poolAddress?: PublicKey) {
  const [poolState, setPoolState] = useState<PoolState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const poolService = usePoolService();

  useEffect(() => {
    if (!poolAddress || !poolService) return;

    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      try {
        setLoading(true);
        // Get initial state
        const initialState = await poolService.getPoolState(poolAddress);
        setPoolState(initialState);

        // Subscribe to updates
        unsubscribe = await poolService.subscribeToPool(
          poolAddress,
          (newState) => setPoolState(newState)
        );

        setError(null);
      } catch (err) {
        setError('Failed to load pool data');
        console.error('Pool subscription error:', err);
      } finally {
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [poolAddress, poolService]);

  return { poolState, loading, error };
} 