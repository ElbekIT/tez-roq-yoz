export interface GameHistory {
  wpm: number;
  accuracy: number;
  timestamp: number;
  mode: string; // 'time 15', 'words 10' etc
  score: number;
  difficulty: string;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  registeredAt: number;
  score?: number;
  gamesPlayed?: number;
  avgWPM?: number;
  maxStreak?: number;
  accuracy?: number;
  totalTime?: number;
  wordsTyped?: number;
  maxWPM?: number;
  banned?: boolean;
  gameHistory?: GameHistory[];
}

export interface Room {
  code: string;
  name: string;
  type: 'public' | 'private';
  maxPlayers: number;
  currentPlayers: number;
  host: string;
  hostName: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  gameSettings: {
    time: number;
    difficulty: string;
  };
}