const { ethers } = require("ethers");
const bcrypt = require("bcrypt");
const fs = require("fs");
require("dotenv").config();
const DatacoinFactoryABI = require("./abi/DataCoinFactory.js");
const ERC20ABI = require("./abi/ERC20");
const { getChainConfig, getAssetConfig } = require("./chainConfig.js");

// ============================================================================
// 🎯 QUEST DATACOIN CONFIGURATION
// ============================================================================

// 🌐 BLOCKCHAIN CONFIGURATION
const chainName = "sepolia"; // Available options: "sepolia", "base", "polygon", "worldchain"

// 🔒 LOCK ASSET CONFIGURATION
const lockAsset = "USDC"; // Available options: "USDC", "WETH", "LSDC"
const lockAmount = 1; // Amount to lock for each quest (must be >= minimum for selected asset)

// 📊 ALLOCATION CONFIGURATION (Must total 100% = 10000 basis points)
const creatorAllocationBps = 2000; // 20% - Creator's allocation in basis points
const contributorsAllocationBps = 5000; // 50% - Contributors' allocation in basis points
const liquidityAllocationBps = 3000; // 30% - Liquidity pool allocation in basis points
const creatorVesting = 365 * 24 * 60 * 60; // 1 year vesting period in seconds

// 🎮 QUEST DEFINITIONS
const quests = [
  {
    name: "Pothole Patrol",
    symbol: "POTHOLE",
    description: "Find and report potholes in your neighborhood roads",
    image: "https://example.com/pothole-quest.png",
    email: "pothole@runnn.com",
    telegram: "pothole_patrol",
    tokenURI: "QmPotholeQuestCID",
    questType: "Infrastructure",
    difficulty: "Easy",
    reward: "Community Safety"
  },
  {
    name: "Litter Hunter",
    symbol: "LITTER",
    description: "Clean up litter and waste from public spaces",
    image: "https://example.com/litter-quest.png",
    email: "litter@runnn.com",
    telegram: "litter_hunter",
    tokenURI: "QmLitterQuestCID",
    questType: "Environment",
    difficulty: "Easy",
    reward: "Clean Environment"
  },
  {
    name: "Tree Guardian",
    symbol: "TREE",
    description: "Plant and care for trees in urban areas",
    image: "https://example.com/tree-quest.png",
    email: "tree@runnn.com",
    telegram: "tree_guardian",
    tokenURI: "QmTreeQuestCID",
    questType: "Environment",
    difficulty: "Medium",
    reward: "Green Future"
  },
  {
    name: "Street Art Scout",
    symbol: "ART",
    description: "Discover and document street art and murals",
    image: "https://example.com/art-quest.png",
    email: "art@runnn.com",
    telegram: "street_art_scout",
    tokenURI: "QmArtQuestCID",
    questType: "Culture",
    difficulty: "Easy",
    reward: "Cultural Heritage"
  },
  {
    name: "Wildlife Spotter",
    symbol: "WILDLIFE",
    description: "Spot and report urban wildlife sightings",
    image: "https://example.com/wildlife-quest.png",
    email: "wildlife@runnn.com",
    telegram: "wildlife_spotter",
    tokenURI: "QmWildlifeQuestCID",
    questType: "Nature",
    difficulty: "Medium",
    reward: "Biodiversity"
  }
];

// Constants
const basisPoints = 10000; // 100%
const datacoinCreationFeeBps = 500; // 5%
const totalDatacoinSupply = 100000000000; // 100 million

// ============================================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================================

function validateConfiguration() {
  console.log("🔍 Validating configuration...");
  
  const totalAllocation = creatorAllocationBps + contributorsAllocationBps + liquidityAllocationBps;
  if (totalAllocation !== basisPoints) {
    throw new Error(`Total allocation must equal 100% (10000 basis points). Current total: ${totalAllocation}`);
  }
  
  console.log("✅ Configuration validated!");
}

function setupBlockchainConnection() {
  console.log("🔗 Setting up blockchain connection...");
  
  const { rpc, factoryAddress } = getChainConfig(chainName);
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`✅ Connected to ${chainName} network`);
  console.log(`👤 Wallet address: ${wallet.address}`);
  
  const factoryContract = new ethers.Contract(
    factoryAddress,
    DatacoinFactoryABI,
    wallet
  );
  
  return { provider, wallet, factoryContract };
}

function validateLockAssetConfig(lockAsset, lockAmount) {
  console.log("🔒 Validating lock asset configuration...");
  
  const lockAssetConfig = getAssetConfig(chainName, lockAsset);
  console.log(`📊 Lock Asset: ${lockAsset}`);
  console.log(`📍 Address: ${lockAssetConfig.address}`);
  console.log(`🔢 Decimals: ${lockAssetConfig.decimal}`);
  console.log(`💰 Minimum Lock Amount: ${lockAssetConfig.minLockAmount}`);
  
  const lockAmountInWei = lockAmount * Math.pow(10, lockAssetConfig.decimal);
  
  if (lockAmountInWei < lockAssetConfig.minLockAmount) {
    throw new Error(
      `Lock amount (${lockAmount}) is below minimum required (${
        lockAssetConfig.minLockAmount / Math.pow(10, lockAssetConfig.decimal)
      })`
    );
  }
  
  console.log(`✅ Lock amount (${lockAmount}) meets minimum requirement`);
  return lockAssetConfig;
}

// ============================================================================
// 🚀 MAIN QUEST DATACOIN CREATION FUNCTION
// ============================================================================

async function createQuestDataCoins() {
  try {
    console.log("🎯 Starting Quest DataCoin creation process...\n");
    
    // Step 1: Validate configuration
    validateConfiguration();
    
    // Step 2: Setup blockchain connection
    const { wallet, factoryContract } = setupBlockchainConnection();
    
    // Step 3: Validate lock asset
    const lockAssetConfig = validateLockAssetConfig(lockAsset, lockAmount);
    
    // Step 4: Setup lock token contract
    const lockTokenContract = new ethers.Contract(
      lockAssetConfig.address,
      ERC20ABI,
      wallet
    );
    
    // Step 5: Check wallet balance
    const balance = await lockTokenContract.balanceOf(wallet.address);
    const totalRequired = ethers.parseUnits(
      (lockAmount * quests.length).toString(),
      lockAssetConfig.decimal
    );
    
    console.log(`💰 Wallet balance: ${ethers.formatUnits(balance, lockAssetConfig.decimal)} ${lockAsset}`);
    console.log(`💸 Total required: ${ethers.formatUnits(totalRequired, lockAssetConfig.decimal)} ${lockAsset}`);
    
    if (balance < totalRequired) {
      throw new Error(`Insufficient balance. Need ${ethers.formatUnits(totalRequired, lockAssetConfig.decimal)} ${lockAsset}`);
    }
    
    // Step 6: Approve total amount for all quests
    console.log("🔓 Approving total token spending...");
    const approveTx = await lockTokenContract.approve(
      factoryContract.target,
      totalRequired
    );
    await approveTx.wait();
    console.log("✅ Token approval successful");
    
    // Step 7: Create all quest DataCoins
    const questResults = [];
    
    for (let i = 0; i < quests.length; i++) {
      const quest = quests[i];
      console.log(`\n🎮 Creating Quest ${i + 1}/${quests.length}: ${quest.name}`);
      
      try {
        // Generate unique salt for each quest
        const salt = await bcrypt.genSalt(10);
        
        // Create DataCoin
        const createTx = await factoryContract.createDataCoin(
          quest.name,
          quest.symbol,
          quest.tokenURI,
          wallet.address, // Creator address
          creatorAllocationBps,
          creatorVesting,
          contributorsAllocationBps,
          liquidityAllocationBps,
          lockAssetConfig.address,
          ethers.parseUnits(lockAmount.toString(), lockAssetConfig.decimal),
          ethers.keccak256(ethers.toUtf8Bytes(salt))
        );
        
        console.log(`📝 Transaction submitted: ${createTx.hash}`);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await createTx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Extract creation results
        const dataCoinCreatedEvent = receipt.logs.find(
          (log) =>
            log.topics[0] ===
            ethers.id(
              "DataCoinCreated(address,address,address,string,string,string,address,uint256)"
            )
        );
        
        if (dataCoinCreatedEvent) {
          const decodedEvent = factoryContract.interface.decodeEventLog(
            "DataCoinCreated",
            dataCoinCreatedEvent.data,
            dataCoinCreatedEvent.topics
          );
          
          const questResult = {
            questNumber: i + 1,
            quest: quest,
            datacoinAddress: decodedEvent.coinAddress,
            poolAddress: decodedEvent.poolAddress,
            creator: decodedEvent.creator,
            lockToken: decodedEvent.lockToken,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            timestamp: new Date().toISOString(),
            network: chainName
          };
          
          questResults.push(questResult);
          
          console.log(`🎉 Quest DataCoin Created Successfully!`);
          console.log(`📊 DataCoin Address: ${decodedEvent.coinAddress}`);
          console.log(`🏊 Pool Address: ${decodedEvent.poolAddress}`);
          console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
          
        } else {
          console.error(`❌ Could not find DataCoinCreated event for quest: ${quest.name}`);
        }
        
        // Add delay between transactions to avoid nonce issues
        if (i < quests.length - 1) {
          console.log("⏳ Waiting 5 seconds before next quest...");
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error) {
        console.error(`❌ Error creating quest ${quest.name}:`, error.message);
        // Continue with next quest instead of failing completely
      }
    }
    
    // Step 8: Save all results to JSON file
    const resultsData = {
      summary: {
        totalQuests: quests.length,
        successfulCreations: questResults.length,
        failedCreations: quests.length - questResults.length,
        network: chainName,
        lockAsset: lockAsset,
        lockAmountPerQuest: lockAmount,
        totalLockAmount: lockAmount * quests.length,
        creatorAllocationBps: creatorAllocationBps,
        contributorsAllocationBps: contributorsAllocationBps,
        liquidityAllocationBps: liquidityAllocationBps,
        creatorVesting: creatorVesting,
        creationTimestamp: new Date().toISOString()
      },
      quests: questResults
    };
    
    const filename = `quest-datacoins-${chainName}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(resultsData, null, 2));
    
    // Step 9: Display final summary
    console.log("\n🎉 QUEST DATACOIN CREATION COMPLETED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Total Quests: ${quests.length}`);
    console.log(`✅ Successful Creations: ${questResults.length}`);
    console.log(`❌ Failed Creations: ${quests.length - questResults.length}`);
    console.log(`🌐 Network: ${chainName}`);
    console.log(`💰 Lock Asset: ${lockAsset}`);
    console.log(`📄 Results saved to: ${filename}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Display individual quest results
    questResults.forEach((result, index) => {
      console.log(`\n🎮 Quest ${result.questNumber}: ${result.quest.name}`);
      console.log(`   📊 DataCoin: ${result.datacoinAddress}`);
      console.log(`   🏊 Pool: ${result.poolAddress}`);
      console.log(`   🔗 TX: ${result.transactionHash}`);
    });
    
  } catch (error) {
    console.error("\n🚨 Error creating Quest DataCoins:");
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

// ============================================================================
// 🎬 SCRIPT EXECUTION
// ============================================================================

console.log("🚀 Quest DataCoin Creation Script");
console.log("==================================\n");

createQuestDataCoins()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  });
