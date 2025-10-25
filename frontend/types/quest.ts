// Quest form data structure
export interface QuestFormData {
  // Quest information
  questName: string;
  questDescription: string;
  difficulty: string;
  
  // DataCoin information (set as defaults)
  coinName: string;
  coinSymbol: string;
  coinDescription: string;
  tokenURI: string;
  
  // Allocation configuration (must total 100% = 10000 basis points)
  creatorAllocationBps: number; // basis points
  contributorsAllocationBps: number; // basis points
  liquidityAllocationBps: number; // basis points
  creatorVestingDays: number; // days
  
  // Lock asset configuration
  lockAsset: string;
  lockAmount: number;
  
  // Chain configuration
  chainName: string;
}

// Quest interface
export interface Quest {
  id: string;
  _id?: string;
  title: string;
  questName: string;
  description: string;
  questDescription: string;
  location: string;
  reward: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "available" | "in_progress" | "completed";
  photo?: string;
  analysisCriteria?: string;
  analysisResult?: {
    verified: boolean;
    confidence: number;
    explanation: string;
  };
  ipfsHash?: string;
  ipfsUrl?: string;
  dataCoinAddress?: string;
  poolAddress?: string;
  creator?: string;
}

// Chain configuration
export interface ChainConfig {
  factoryAddress: `0x${string}`;
  rpc: string;
  assets: {
    [key: string]: {
      address: `0x${string}`;
      decimal: number;
      minLockAmount: number | bigint;
    };
  };
}

// Chain configurations
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  sepolia: {
    factoryAddress: "0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990" as `0x${string}`,
    rpc: "https://1rpc.io/sepolia",
    assets: {
      USDC: {
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
        decimal: 6,
        minLockAmount: 500000,
      },
      WETH: {
        address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9" as `0x${string}`,
        decimal: 18,
        minLockAmount: 100000000000000,
      },
      LSDC: {
        address: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE" as `0x${string}`,
        decimal: 18,
        minLockAmount: 10000000000000000000000,
      },
    },
  },
};

// Default form values
export const DEFAULT_FORM_DATA: QuestFormData = {
  questName: "",
  questDescription: "",
  difficulty: "medium",
  coinName: "QuestCoin",
  coinSymbol: "QC",
  coinDescription: "Quest completion reward token",
  tokenURI: "https://ipfs.io/ipfs/QmQuestMetadata",
  creatorAllocationBps: 2000, // 20%
  contributorsAllocationBps: 5000, // 50%
  liquidityAllocationBps: 3000, // 30%
  creatorVestingDays: 365, // 1 year
  lockAsset: "USDC",
  lockAmount: 5,
  chainName: "sepolia",
};
