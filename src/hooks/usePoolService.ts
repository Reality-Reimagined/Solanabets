import { useRef, useEffect, useState, useCallback } from 'react';
import { PoolService } from '../services/poolService';
import { useAppKitProvider } from '@reown/appkit/react';
import { AnchorProvider } from '@project-serum/anchor';
import type { Provider } from '@reown/appkit-adapter-solana/react';

export function usePoolService() {
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const [error, setError] = useState<Error | null>(null);
  const poolServiceRef = useRef<PoolService | null>(null);

  const initializePoolService = useCallback(async () => {
    try {
      console.log('Wallet Provider Debug:', {
        exists: !!walletProvider,
        connection: {
          exists: !!walletProvider?.connect,
          endpoint: walletProvider?.type,
        },
        wallet: {
          exists: !!walletProvider?.connect,
          connected: walletProvider?.connect,
          publicKey: walletProvider?.publicKey?.toString(),
        }
      });

      if (!walletProvider?.connect || !walletProvider?.publicKey) {
        console.log('Missing wallet or connection');
        poolServiceRef.current = null;
        return;
      }

      setError(null);
    } catch (err) {
      console.error('Pool service initialization error:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize pool service'));
      poolServiceRef.current = null;
    }
  }, [walletProvider]);

  useEffect(() => {
    initializePoolService();
  }, [initializePoolService]);

  const connect = useCallback(async () => {
    try {
      if (!walletProvider) {
        throw new Error('Wallet provider not initialized');
      }
      console.log('Attempting to connect wallet...');
      await walletProvider.connect();
      console.log('Wallet connected, initializing pool service...');
      await initializePoolService();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      throw err;
    }
  }, [walletProvider, initializePoolService]);

  return { 
    poolService: poolServiceRef.current, 
    error,
    isInitialized: !!poolServiceRef.current,
    walletConnected: !!walletProvider?.connect,
    connect
  };
} 