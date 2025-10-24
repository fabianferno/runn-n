// ============================================
// API Types
// ============================================

export interface PathInput {
  user: string;
  color: string;
  path: [number, number][]; // [lat, lng]
  options?: {
    autoClose?: boolean;
    minLoopSize?: number;
  };
}

export interface PathResponse {
  success: boolean;
  pathType: "closed_loop" | "open_path" | "single_hex";
  hexPath: string[];
  uniqueHexes: number;
  loopClosed: boolean;
  hexesCaptured: number;
  boundaryHexes: number;
  interiorHexes: number;
  regionsAffected: string[];
  conflicts: {
    [hexId: string]: string;
  };
  processingTime: number;
  pathId: string;
}

export interface BatchUpdateRequest {
  updates: {
    [userId: string]: string[];
  };
}

export interface BatchUpdateResponse {
  success: boolean;
  updated: number;
  users: number;
  regionsAffected: string[];
  conflicts: {
    [hexId: string]: {
      previous: string;
      new: string;
    };
  };
}

export interface ViewportResponse {
  success: boolean;
  regions: {
    [regionId: string]: {
      [hexId: string]: {
        user: string;
        color: string;
      };
    };
  };
  regionIds: string[];
  totalHexes: number;
  timestamp: number;
}

export interface RegionResponse {
  success: boolean;
  regionId: string;
  territories: {
    [hexId: string]: Territory;
  };
  metadata: RegionMetadata;
}

export interface UserStatsResponse {
  success: boolean;
  user: User;
}

export interface GlobalStatsResponse {
  success: boolean;
  stats: {
    totalHexesCaptured: number;
    totalRegionsActive: number;
    totalPlayers: number;
    totalPaths: number;
    leaderboard: LeaderboardEntry[];
    lastUpdate: number;
  };
}

export interface PathHistoryResponse {
  success: boolean;
  paths: PathHistory[];
  total: number;
  hasMore: boolean;
}

// ============================================
// Territory & Region Types
// ============================================

export interface Territory {
  user: string;
  color: string;
  capturedAt: number;
  method: "click" | "line" | "loop";
}

export interface Region {
  _id: string;
  territories: {
    [hexId: string]: Territory;
  };
  metadata: RegionMetadata;
}

export interface RegionMetadata {
  hexCount: number;
  lastUpdate: number;
  playerCounts: {
    [playerId: string]: number;
  };
  contestedBy: string[];
}

export interface RegionUpdate {
  regionId: string;
  changes: {
    [hexId: string]: {
      user: string;
      color: string;
    } | null;
  };
  updatedBy: string;
  timestamp: number;
}

// ============================================
// User Types
// ============================================

export interface User {
  _id: string;
  username: string;
  color: string;
  stats: UserStats;
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

// ============================================
// Path & History Types
// ============================================

export interface PathHistory {
  _id: string;
  user: string;
  type: "closed_loop" | "open_path" | "single_hex";
  coordinates: [number, number][];
  hexPath: string[];
  hexesCaptured: number;
  boundaryHexes: number;
  interiorHexes: number;
  regionsAffected: string[];
  conflicts: {
    [hexId: string]: string;
  };
  timestamp: number;
  processingTime: number;
}

export interface PathPoint {
  coordinates: [number, number]; // [lng, lat]
  timestamp: number;
  accuracy: number;
}

export interface TrackedPath {
  rawPath: PathPoint[];
  matchedPath: [number, number][];
  distance: number;
}

// ============================================
// Geolocation Types
// ============================================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number | null;
  heading?: number | null;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// ============================================
// Map Types
// ============================================

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface MapMatchingResult {
  matchedCoordinates: [number, number][];
  confidence: number;
  distance: number;
}

export interface GridClickData {
  id: string;
  owner: string;
  ownerName: string;
  color: string;
  coordinates: {
    lng: number;
    lat: number;
  };
}

// ============================================
// Territory Game Types
// ============================================

export interface Player {
  color: string;
  name: string;
}

export interface TerritoryCapture {
  hex: string;
  player: string;
}

export interface TerritoryGameConfig {
  resolution: number;
  regionResolution: number;
  minZoomLevel: number;
  batchInterval: number;
  maxBatchSize: number;
}

// ============================================
// WebSocket Types
// ============================================

export interface SocketAuthData {
  userId: string;
  token?: string;
}

export interface SocketAuthResponse {
  userId: string;
  sessionId: string;
}

export interface SocketSubscribeData {
  regionIds: string[];
}

export interface SocketSubscribedResponse {
  regionIds: string[];
  hexCount: number;
}

export interface SocketInitialState {
  regions: {
    [regionId: string]: {
      [hexId: string]: {
        user: string;
        color: string;
      };
    };
  };
}

export interface SocketRegionUpdate {
  regionId: string;
  changes: {
    [hexId: string]: {
      user: string;
      color: string;
    } | null;
  };
  updatedBy: string;
  timestamp: number;
}

export interface SocketPathCaptured {
  pathId: string;
  user: string;
  username: string;
  pathType: "closed_loop" | "open_path" | "single_hex";
  hexesCaptured: number;
  regionsAffected: string[];
  timestamp: number;
}

export interface SocketStatsUpdate {
  totalHexes: number;
  totalRegions: number;
  largestCapture: number;
  rank?: number;
}

export interface SocketError {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// Error Types
// ============================================

export interface ApiError {
  success: false;
  error: string;
  code?: ErrorCode;
  details?: any;
}

export enum ErrorCode {
  PATH_TOO_LARGE = "PATH_TOO_LARGE",
  PATH_TOO_SMALL = "PATH_TOO_SMALL",
  INVALID_COORDINATES = "INVALID_COORDINATES",
  PATH_PROCESSING_FAILED = "PATH_PROCESSING_FAILED",
  REGION_NOT_FOUND = "REGION_NOT_FOUND",
  REGION_OVERLOAD = "REGION_OVERLOAD",
  TOO_MANY_REGIONS = "TOO_MANY_REGIONS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  DATABASE_ERROR = "DATABASE_ERROR",
  TIMEOUT = "TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  GEOLOCATION_ERROR = "GEOLOCATION_ERROR",
  MAP_MATCHING_ERROR = "MAP_MATCHING_ERROR",
}

// ============================================
// Component Props Types
// ============================================

export interface MapComponentProps {
  userId: string;
  userColor: string;
  username?: string;
  onStatsUpdate?: (stats: UserStats) => void;
  onCapture?: (data: PathResponse) => void;
}

export interface MapControlsProps {
  isTracking: boolean;
  isRecording: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onSubmitDataCoin: () => void;
  distance: number;
  elapsedTime: number;
}

export interface MapStatsProps {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  pathPoints: number;
  capturedHexes: number;
  lastDataCoinLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

// ============================================
// Hook Return Types
// ============================================

export interface UseGeolocationReturn {
  currentLocation: LocationData | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<LocationData>;
}

export interface UsePathTrackingReturn {
  path: PathPoint[];
  matchedPath: [number, number][];
  distance: number;
  isRecording: boolean;
  startRecording: () => void;
  addPoint: (location: LocationData) => void;
  stopRecording: () => Promise<TrackedPath>;
  clearPath: () => void;
}

export interface UseTerritoryGameReturn {
  game: any | null; // TerritoryGame instance
  isInitialized: boolean;
  capturedHexes: number;
  stats: UserStats | null;
  error: string | null;
}

// ============================================
// Utility Types
// ============================================

export type Coordinate = [number, number]; // [lng, lat] or [lat, lng] depending on context
export type HexId = string;
export type RegionId = string;
export type UserId = string;
export type PathId = string;

export type CaptureMethod = "click" | "line" | "loop";
export type PathType = "closed_loop" | "open_path" | "single_hex";

// ============================================
// Constants
// ============================================

export const LIMITS = {
  MAX_PATH_POINTS: 500,
  MAX_HEXES_PER_CAPTURE: 20000,
  MIN_LOOP_SIZE: 3,
  MAX_HEXES_PER_REGION: 50000,
  MAX_REGIONS_LOADED: 50,
  MAX_BATCH_SIZE: 100,
  BATCH_INTERVAL_MS: 2000,
  MAX_SUBSCRIBED_REGIONS: 20,
  PATH_PROCESSING_TIMEOUT_MS: 5000,
  DATABASE_OPERATION_TIMEOUT_MS: 3000,
} as const;

export const GAME_CONFIG = {
  DEFAULT_RESOLUTION: 8,
  DEFAULT_REGION_RESOLUTION: 4,
  DEFAULT_MIN_ZOOM: 12,
  DEFAULT_BATCH_INTERVAL: 2000,
  DEFAULT_MAX_BATCH_SIZE: 100,
} as const;

export const PLAYER_COLORS = {
  PLAYER1: "#FF6B6B",
  PLAYER2: "#4ECDC4",
  PLAYER3: "#95E1D3",
  NEUTRAL: "#E8E8E8",
} as const;
