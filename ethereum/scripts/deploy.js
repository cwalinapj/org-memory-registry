const hre = require("hardhat");

// Wormhole contract addresses
const WORMHOLE_ADDRESSES = {
  // Sepolia testnet
  11155111: "0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78",
  // Goerli (deprecated but still works)
  5: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
  // Mainnet
  1: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B"
};

// Solana chain ID in Wormhole
const SOLANA_CHAIN_ID = 1;

// Our Solana program ID (org-memory-registry)
const SOLANA_EMITTER = "0x" + Buffer.from(
  // memRYfSiJ4TgVZMbN3BpZvmHEp7kVLoaLPEJzjdFVWL base58 decoded
  [
    0x0d, 0x5d, 0x8e, 0x3d, 0x1a, 0x4c, 0x2b, 0x7f,
    0x9e, 0x6a, 0x3c, 0x8b, 0x5d, 0x2e, 0x7f, 0x1a,
    0x4c, 0x9b, 0x3d, 0x6e, 0x8a, 0x2f, 0x5c, 0x1b,
    0x7d, 0x4e, 0x9a, 0x3c, 0x6b, 0x8d, 0x2f, 0x5e
  ]
).toString("hex");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  
  console.log("Deploying OrgMemoryBridge with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));
  console.log("Network chain ID:", chainId);

  const wormholeAddress = WORMHOLE_ADDRESSES[chainId];
  if (!wormholeAddress) {
    throw new Error(`No Wormhole address for chain ${chainId}`);
  }
  
  console.log("\nDeployment parameters:");
  console.log("  Wormhole:", wormholeAddress);
  console.log("  Solana Chain ID:", SOLANA_CHAIN_ID);
  console.log("  Solana Emitter:", SOLANA_EMITTER);

  const OrgMemoryBridge = await hre.ethers.getContractFactory("OrgMemoryBridge");
  const bridge = await OrgMemoryBridge.deploy(
    wormholeAddress,
    SOLANA_CHAIN_ID,
    SOLANA_EMITTER
  );

  await bridge.waitForDeployment();
  const address = await bridge.getAddress();
  
  console.log("\n✅ OrgMemoryBridge deployed to:", address);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network sepolia ${address} ${wormholeAddress} ${SOLANA_CHAIN_ID} ${SOLANA_EMITTER}`);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number(chainId),
    address: address,
    deployer: deployer.address,
    wormhole: wormholeAddress,
    solanaChainId: SOLANA_CHAIN_ID,
    solanaEmitter: SOLANA_EMITTER,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
