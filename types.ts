
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
  status?: 'online' | 'offline'; // Added status
}

export interface BattlePlayer {
  uid: string;
  name: string;
  photoURL?: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  rank?: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'starting' | 'racing' | 'finished';
  text: string;
  startTime?: number;
  players: Record<string, BattlePlayer>;
  createdAt: number;
  settings: {
    difficulty: string;
    duration: number; // 0 for text completion, or seconds for time mode
  };
}

export interface FriendRequest {
  uid: string;
  name: string;
  photoURL?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}
