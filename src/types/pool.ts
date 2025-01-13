import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';

export interface PoolState {
  eventId: string;
  totalHomeBets: number;
  totalAwayBets: number;
  oddsHome: number;
  oddsAway: number;
  minBet: number;
  maxBet: number;
  feePercentage: number;
  isSettled: boolean;
  authority: PublicKey;
  winner?: string;
  bets: Bet[];
}

export interface Bet {
  better: PublicKey;
  amount: number;
  team: string;
  odds: number;
  timestamp: number;
}

export interface CreatePoolParams {
  eventId: string;
  initialOddsHome: number;
  initialOddsAway: number;
  minBet: number;
  maxBet: number;
}

export interface PoolAccount {
  eventId: string;
  totalHomeBets: typeof BN;
  totalAwayBets: typeof BN;
  oddsHome: typeof BN;
  oddsAway: typeof BN;
  minBet: typeof BN;
  maxBet: typeof BN;
  feePercentage: typeof BN;
  isSettled: boolean;
  authority: PublicKey;
  winner: string | null;
  bets: {
    better: PublicKey;
    amount: typeof BN;
    team: string;
    odds: typeof BN;
    timestamp: typeof BN;
  }[];
} 