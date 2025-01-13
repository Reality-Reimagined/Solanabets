import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { usePoolService } from './usePoolService';

interface OracleData {
  winner: string;
  timestamp: number;
  confidence: number;
}

export function useOracle(poolAddress?: PublicKey) {
  const [oracleData, setOracleData] = useState<OracleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poolService = usePoolService();

  useEffect(() => {
    if (!poolAddress || !poolService) return;

    const fetchOracleData = async () => {
      try {
        setLoading(true);
        // In production, this would fetch from a real oracle service
        // For now, we'll simulate it
        const data = await poolService.getOracleData(poolAddress);
        setOracleData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch oracle data');
        console.error('Oracle error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOracleData();
    const interval = setInterval(fetchOracleData, 60000); // Poll every minute

    return () => clearInterval(interval);
  }, [poolAddress, poolService]);

  return { oracleData, loading, error };
} 