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
    draw?: number;
  };
  prediction?: {
    winner: string;
    confidence: number;
    analysis: string;
  };
}

export interface Prediction {
  eventId: string;
  prediction: string;
  amount: number;
  timestamp: string;
  claimed: boolean;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
}