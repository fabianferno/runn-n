export interface Territory {
  user: string;
  color: string;
  capturedAt: number;
  method: "click" | "line" | "loop";
}

export interface Region {
  _id: string; // H3 Region ID (resolution 4)
  territories: {
    [hexId: string]: Territory;
  };
  metadata: {
    hexCount: number;
    lastUpdate: number;
    playerCounts: {
      [playerId: string]: number;
    };
    contestedBy: string[];
  };
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
