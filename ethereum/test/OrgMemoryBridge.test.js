const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrgMemoryBridge", function () {
  let bridge;
  let owner;
  let user1;
  let user2;
  
  // Mock Wormhole address (we'll deploy a mock)
  const MOCK_WORMHOLE = "0x0000000000000000000000000000000000000001";
  const SOLANA_CHAIN_ID = 1;
  const SOLANA_EMITTER = "0x0d5d8e3d1a4c2b7f9e6a3c8b5d2e7f1a4c9b3d6e8a2f5c1b7d4e9a3c6b8d2f5e";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const OrgMemoryBridge = await ethers.getContractFactory("OrgMemoryBridge");
    bridge = await OrgMemoryBridge.deploy(
      MOCK_WORMHOLE,
      SOLANA_CHAIN_ID,
      SOLANA_EMITTER
    );
    await bridge.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await bridge.admin()).to.equal(owner.address);
    });

    it("Should set the correct Solana chain ID", async function () {
      expect(await bridge.solanaChainId()).to.equal(SOLANA_CHAIN_ID);
    });

    it("Should set the correct Solana emitter", async function () {
      expect(await bridge.solanaEmitter()).to.equal(SOLANA_EMITTER);
    });

    it("Should start with zero memories", async function () {
      expect(await bridge.getMemoryCount()).to.equal(0);
    });
  });

  describe("Memory Writing", function () {
    it("Should write a new memory", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test content"));
      const memoryType = 0; // Episodic
      const privacy = 0; // Private
      const confidence = 8500; // 85%
      const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 1 day
      const tags = ["test", "memory"];

      const tx = await bridge.writeMemory(
        contentHash,
        memoryType,
        privacy,
        confidence,
        expiresAt,
        tags
      );

      await expect(tx).to.emit(bridge, "MemoryCreated");
      expect(await bridge.getMemoryCount()).to.equal(1);
    });

    it("Should reject invalid confidence", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      
      await expect(
        bridge.writeMemory(contentHash, 0, 0, 10001, 0, [])
      ).to.be.revertedWithCustomError(bridge, "InvalidConfidence");
    });

    it("Should allow multiple memories from same user", async function () {
      const contentHash1 = ethers.keccak256(ethers.toUtf8Bytes("content1"));
      const contentHash2 = ethers.keccak256(ethers.toUtf8Bytes("content2"));

      await bridge.writeMemory(contentHash1, 0, 0, 5000, 0, []);
      await bridge.writeMemory(contentHash2, 1, 1, 7500, 0, []);

      expect(await bridge.getMemoryCount()).to.equal(2);
    });
  });

  describe("Merkle Attestation", function () {
    it("Should attest a Merkle root", async function () {
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkle root"));
      const leafCount = 10;
      const solanaSignature = ethers.keccak256(ethers.toUtf8Bytes("ed25519 sig"));

      const tx = await bridge.attestMerkleRoot(merkleRoot, leafCount, solanaSignature);

      await expect(tx).to.emit(bridge, "MerkleRootAttested");
      expect(await bridge.getAttestationCount()).to.equal(1);
    });

    it("Should verify Merkle proofs", async function () {
      // Create a simple 2-leaf Merkle tree
      const leaf0 = ethers.keccak256(ethers.toUtf8Bytes("leaf0"));
      const leaf1 = ethers.keccak256(ethers.toUtf8Bytes("leaf1"));
      const merkleRoot = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "bytes32"], [leaf0, leaf1])
      );

      // Attest the root
      const tx = await bridge.attestMerkleRoot(merkleRoot, 2, ethers.ZeroHash);
      const receipt = await tx.wait();
      
      // Get attestation ID from event
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "MerkleRootAttested"
      );
      const attestationId = event.args[0];

      // Verify leaf0 with proof [leaf1]
      const isValid = await bridge.verifyMerkleProof(
        attestationId,
        leaf0,
        [leaf1],
        0
      );
      expect(isValid).to.be.true;
    });
  });

  describe("Trust Scores", function () {
    it("Should return correct trust multiplier", async function () {
      // Default score (0) should give 1.0x
      expect(await bridge.getTrustMultiplier(user1.address)).to.equal(100);

      // Update to 50
      await bridge.updateTrustScore(user1.address, 50);
      expect(await bridge.getTrustMultiplier(user1.address)).to.equal(150);

      // Update to 100+
      await bridge.updateTrustScore(user1.address, 100);
      expect(await bridge.getTrustMultiplier(user1.address)).to.equal(200);
    });

    it("Should emit TrustScoreUpdated event", async function () {
      await expect(bridge.updateTrustScore(user1.address, 75))
        .to.emit(bridge, "TrustScoreUpdated")
        .withArgs(user1.address, 0, 75);
    });

    it("Should only allow admin to update trust scores", async function () {
      await expect(
        bridge.connect(user1).updateTrustScore(user2.address, 50)
      ).to.be.revertedWithCustomError(bridge, "Unauthorized");
    });
  });

  describe("Admin Functions", function () {
    it("Should transfer admin", async function () {
      await bridge.transferAdmin(user1.address);
      expect(await bridge.admin()).to.equal(user1.address);
    });

    it("Should update Solana emitter", async function () {
      const newEmitter = "0x1111111111111111111111111111111111111111111111111111111111111111";
      await bridge.updateSolanaEmitter(newEmitter);
      expect(await bridge.solanaEmitter()).to.equal(newEmitter);
    });

    it("Should reject non-admin calls", async function () {
      await expect(
        bridge.connect(user1).transferAdmin(user2.address)
      ).to.be.revertedWithCustomError(bridge, "Unauthorized");
    });
  });
});
