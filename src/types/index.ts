import type { ReactNode } from 'react';

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
}

export interface Event {
  id: string;
  title: string;
  sport: string;
  startTime: string;
  homeTeam: string;
  awayTeam: string;
  odds: {
    home: number;
    away: number;
  };
  prediction: {
    winner: string;
    confidence: number;
    analysis: string;
  };
}

export interface Prediction {
  eventId: string;
  prediction: string;
  amount: number;
  odds: number;
  timestamp: string;
  claimed: boolean;
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export interface EventCardProps {
  event: Event;
  wallet: WalletState;
  onPlaceBet: (eventId: string, prediction: string, amount: number) => void;
  selected?: boolean;
  onSelect?: () => void;
}

export interface PredictionsListProps {
  predictions: Prediction[];
  onClaim: (predictionId: string) => void;
} 