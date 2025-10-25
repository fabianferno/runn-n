export interface QuestInput {
  // Quest information
  questName: string;
  questDescription: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  
  // DataCoin information
  coinName: string;
  coinSymbol: string;
  coinDescription: string;
  tokenURI: string;
  
  // Allocation configuration (basis points)
  creatorAllocationBps: number;
  contributorsAllocationBps: number;
  liquidityAllocationBps: number;
  creatorVestingDays: number;
  
  // Lock asset configuration
  lockAsset: string;
  lockAmount: number;
  
  // Chain configuration
  chainName: string;
  
  // Creator info
  creator: string;
  
  // Blockchain data (will be populated after creation)
  dataCoinAddress?: string;
  poolAddress?: string;
  
  // Status
  status?: "active" | "completed" | "cancelled";
  
  // Timestamps
  createdAt?: string;
}

export interface QuestResponse {
  success: boolean;
  quest?: Quest;
  error?: string;
}

export interface Quest extends QuestInput {
  _id: string;
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface QuestListResponse {
  success: boolean;
  quests?: Quest[];
  total?: number;
  error?: string;
}
