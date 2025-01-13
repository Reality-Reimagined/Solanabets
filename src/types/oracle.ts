export interface OracleData {
  winner: string;
  timestamp: number;
  confidence: number;
}

export interface GameResult {
  winner: string;
  score: {
    home: number;
    away: number;
  };
  status: 'scheduled' | 'in_progress' | 'completed';
} 