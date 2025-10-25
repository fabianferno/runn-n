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

