
export enum PlayerName {
  GREGORY = 'GREGORY',
  BIRCHAN = 'BIRCHAN',
  PETER = 'PETER',
  SEVEN = 'SEVEN'
}

export interface PlayerScore {
  playerName: PlayerName;
  score: number;
}

export interface GolfGame {
  id: string;
  date: string;
  course: string;
  scores: PlayerScore[];
}

export type RankingPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'YEARLY' | 'ALL_TIME';

export interface PlayerStats {
  playerName: PlayerName;
  averageScore: number;
  bestScore: number;
  recentScore: number;
  gamesPlayed: number;
  totalScore: number;
  rank: number;
}
