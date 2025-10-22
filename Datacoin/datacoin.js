const { ethers } = require("ethers");
require("dotenv").config();
const DatacoinABI = require("./abi/DataCoin.js");

const { getChainConfig } = require("./chainConfig.js");

const chainName = "sepolia"; // Available options: "sepolia", "base", "polygon", "worldchain"
const dataCoinAddress = "0xB244c03710D4BCa56C15C0ccb866Ceb8eaada5f9"; // Valid DataCoin address for the selected chain

const { rpc } = getChainConfig(chainName);
const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const datacoinContract = new ethers.Contract(
  dataCoinAddress,
  DatacoinABI,
  wallet
);

const getCoinInfo = async () => {
  const name = await datacoinContract.name();
  const symbol = await datacoinContract.symbol();
  const creator = await datacoinContract.creator();
  const allocationConfig = await datacoinContract.allocConfig();
  const maxSupply = await datacoinContract.MAX_SUPPLY();
  const contributorsAllocationMinted =
    await datacoinContract.contributorsAllocMinted();

  const creatorAllocation =
    (maxSupply * BigInt(allocationConfig[0])) / BigInt(10000);
  const creatorVestingDuration = Number(allocationConfig[1]) / (24 * 60 * 60);
  const contributorsAllocation =
    (maxSupply * BigInt(allocationConfig[2])) / BigInt(10000);
  const liquidityAllocation =
    (maxSupply * BigInt(allocationConfig[3])) / BigInt(10000);

  console.log(`Coin name: ${name}, Coin symbol: ${symbol}`);
  console.log(`Creator: ${creator}`);
  console.log(`Max supply: ${ethers.formatUnits(maxSupply, 18)}`);
  console.log(
    `Creator allocation: ${ethers.formatUnits(creatorAllocation, 18)}`
  );
  console.log(`Creator vesting duration: ${creatorVestingDuration} days`);
  console.log(
    `Contributors allocation: ${ethers.formatUnits(contributorsAllocation, 18)}`
  );
  console.log(
    `Contributors allocation minted: ${ethers.formatUnits(
      contributorsAllocationMinted,
      18
    )}`
  );
  console.log(
    `Liquidity allocation: ${ethers.formatUnits(liquidityAllocation, 18)}`
  );
};

// function will fail if called other than admin
const grantMinterRole = async (address) => {
  console.log("Granting minter role to ", address);
  const grantRoleTx = await datacoinContract.grantRole(
    ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
    address
  );
  await grantRoleTx.wait();
  console.log("Tx hash : ", grantRoleTx.hash);
  console.log("Minter role granted to ", address);
};

// function will fail if called other than admin
const revokeMinterRole = async (address) => {
  console.log("Revoking minter role from ", address);
  const revokeRoleTx = await datacoinContract.revokeRole(
    ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
    address
  );
  await revokeRoleTx.wait();
  console.log("Tx hash : ", revokeRoleTx.hash);
  console.log("Minter role revoked from ", address);
};

const mintTokens = async (address, amount) => {
  console.log(` Minting ${amount} tokens to ${address}`);
  const mintTx = await datacoinContract.mint(
    address,
    ethers.parseUnits(amount.toString(), 18)
  );
  await mintTx.wait();
  console.log("Tx hash : ", mintTx.hash);
  console.log("Tokens minted to ", address);
};

const claimVesting = async () => {
  const claimableAmount = await datacoinContract.getClaimableAmount();
  console.log("Claimable amount: ", claimableAmount);
  console.log("Claiming vesting...");
  const claimVestingTx = await datacoinContract.claimVesting();
  await claimVestingTx.wait();
  console.log("Tx hash : ", claimVestingTx.hash);
  console.log("Vesting claimed");
};

// ============= Grant Minter Role =============
// const mintRoleAddress = "0x0035cd0CA79A5b156d5443b698655DBDc5403B45";
// grantMinterRole(mintRoleAddress);

// ============= Get Coin Info =============
// getCoinInfo();

// ============= Mint Tokens ===============
const receiverAddress = "0x0035cd0CA79A5b156d5443b698655DBDc5403B45";
const amount = 100;
mintTokens(receiverAddress, amount);

// ============= Claim Vesting =============
// claimVesting();
