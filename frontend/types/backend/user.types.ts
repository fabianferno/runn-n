export interface User {
  _id: string;
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
  color: string;
  hexCount: number;
  rank: number;
  totalCaptures?: number;
  largestCapture?: number;
  regions?: number;
  lastActive?: number;
}

export interface UserDetailedStats {
  userId: string;
  color: string;
  hexCount: number;
  totalCaptures: number;
  largestCapture: number;
  regions: number;
  lastActive: number;
  rank: number;
}

export interface RecentActivity {
  userId: string;
  color: string;
  action: string;
  hexesCaptured: number;
  timestamp: number;
  pathType: string;
}

export interface GameStats {
  totalUsers: number;
  totalHexes: number;
  totalRegions: number;
  totalPaths: number;
  averageHexesPerUser: number;
  mostActiveUser: string;
  mostActiveRegion: string;
}

