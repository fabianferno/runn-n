export interface User {
  _id: string;
  username: string;
  color: string;
  stats: {
    totalHexes: number;
    totalRegions: number;
    largestCapture: number;
    totalCaptures: number;
    lastActive: number;
  };
  activeRegions: string[];
  createdAt: number;
}

export interface UserStats {
  totalHexes: number;
  totalRegions: number;
  largestCapture: number;
  totalCaptures: number;
  lastActive: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  color: string;
  hexCount: number;
  rank: number;
}
