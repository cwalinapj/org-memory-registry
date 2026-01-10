// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OrgMemoryRegistry
 * @notice Ethereum-side memory registry for Origin OS unified memory framework
 * @dev Mirrors Solana org-memory-registry for cross-chain memory attestation
 */
contract OrgMemoryRegistry is Ownable, ReentrancyGuard {
    // ============ Enums ============
    enum AgentRole { Observer, Writer, TrustedPublisher, Admin }
    enum MemoryType { Episodic, Semantic, Fact, Preference, Plan, Interaction, Artifact, Skill, Rule }
    enum PrivacyLevel { Private, Team, Public }
    enum ClaimStatus { Active, Retracted, Superseded }

    // ============ Structs ============
    struct AgentAuthority {
        address agent;
        AgentRole role;
        uint64 trustScore;      // basis points (0-10000)
        uint64 memoriesWritten;
        uint64 registeredAt;
        bool isActive;
    }

    struct MemoryRecord {
        bytes32 memoryId;
        address author;
        MemoryType memoryType;
        PrivacyLevel privacy;
        bytes32 contentHash;    // SHA256 of off-chain content
        string ipfsUri;         // IPFS CID for content
        uint64 confidence;      // basis points
        uint64 createdAt;
        uint64 updatedAt;
        bool isPromoted;
        string[] tags;
    }

    struct Claim {
        bytes32 claimId;
        bytes32 memoryId;
        address claimant;
        bytes32 evidenceHash;
        ClaimStatus status;
        uint64 confidence;
        uint64 createdAt;
    }

    struct MerkleAttestation {
        bytes32 merkleRoot;
        uint64 leafCount;
        uint64 attestedAt;
        address attester;
    }

    // ============ Cross-Chain Bridge ============
    struct SolanaAttestation {
        bytes32 solanaSignature;    // Ed25519 signature from Solana
        bytes32 solanaProgramId;    // Solana program ID
        bytes32 solanaMemoryId;     // Memory ID on Solana
        uint64 solanaSlot;          // Slot when attested on Solana
        bool verified;
    }

    // ============ State ============
    uint64 public totalMemories;
    uint64 public totalAgents;
    uint64 public totalAttestations;
    
    // Solana program ID for cross-chain verification
    bytes32 public constant SOLANA_PROGRAM_ID = 0x0000000000000000000000000000000000000000000000000000000000000000; // Set on deploy
    
    mapping(address => AgentAuthority) public agents;
    mapping(bytes32 => MemoryRecord) public memories;
    mapping(bytes32 => Claim[]) public memoryClaims;
    mapping(bytes32 => MerkleAttestation) public attestations;
    mapping(bytes32 => SolanaAttestation) public solanaAttestations;
    
    // Wormhole bridge integration
    address public wormholeRelayer;
    uint16 public constant SOLANA_CHAIN_ID = 1; // Wormhole chain ID for Solana
    
    // ============ Events ============
    event AgentRegistered(address indexed agent, AgentRole role, uint64 timestamp);
    event MemoryCreated(bytes32 indexed memoryId, address indexed author, MemoryType memoryType);
    event MemoryPromoted(bytes32 indexed memoryId, address indexed promoter);
    event ClaimAdded(bytes32 indexed memoryId, bytes32 indexed claimId, address indexed claimant);
    event ClaimRetracted(bytes32 indexed claimId, address indexed retractor);
    event MerkleRootAttested(bytes32 indexed root, uint64 leafCount, address indexed attester);
    event TrustScoreUpdated(address indexed agent, uint64 oldScore, uint64 newScore);
    event SolanaBridged(bytes32 indexed solanaMemoryId, bytes32 indexed ethMemoryId, uint64 solanaSlot);
    event CrossChainVerified(bytes32 indexed memoryId, bytes32 solanaSignature);

    // ============ Errors ============
    error AgentNotRegistered();
    error AgentAlreadyRegistered();
    error InsufficientRole();
    error MemoryNotFound();
    error ClaimNotFound();
    error InvalidConfidence();
    error NotClaimOwner();
    error ClaimNotActive();
    error InvalidMerkleProof();
    error InvalidSolanaAttestation();

    // ============ Modifiers ============
    modifier onlyRegisteredAgent() {
        if (!agents[msg.sender].isActive) revert AgentNotRegistered();
        _;
    }

    modifier onlyWriter() {
        if (!agents[msg.sender].isActive) revert AgentNotRegistered();
        if (agents[msg.sender].role < AgentRole.Writer) revert InsufficientRole();
        _;
    }

    modifier onlyAdmin() {
        if (!agents[msg.sender].isActive) revert AgentNotRegistered();
        if (agents[msg.sender].role != AgentRole.Admin) revert InsufficientRole();
        _;
    }

    // ============ Constructor ============
    constructor(address _wormholeRelayer) Ownable(msg.sender) {
        wormholeRelayer = _wormholeRelayer;
        
        // Register deployer as admin
        agents[msg.sender] = AgentAuthority({
            agent: msg.sender,
            role: AgentRole.Admin,
            trustScore: 10000, // 100%
            memoriesWritten: 0,
            registeredAt: uint64(block.timestamp),
            isActive: true
        });
        totalAgents = 1;
        
        emit AgentRegistered(msg.sender, AgentRole.Admin, uint64(block.timestamp));
    }

    // ============ Agent Management ============
    function registerAgent(address agent, AgentRole role) external onlyAdmin {
        if (agents[agent].isActive) revert AgentAlreadyRegistered();
        
        agents[agent] = AgentAuthority({
            agent: agent,
            role: role,
            trustScore: 5000, // Start at 50%
            memoriesWritten: 0,
            registeredAt: uint64(block.timestamp),
            isActive: true
        });
        totalAgents++;
        
        emit AgentRegistered(agent, role, uint64(block.timestamp));
    }

    function updateTrustScore(address agent, uint64 newScore) external onlyAdmin {
        if (!agents[agent].isActive) revert AgentNotRegistered();
        if (newScore > 10000) revert InvalidConfidence();
        
        uint64 oldScore = agents[agent].trustScore;
        agents[agent].trustScore = newScore;
        
        emit TrustScoreUpdated(agent, oldScore, newScore);
    }

    // ============ Memory Operations ============
    function writeMemory(
        bytes32 memoryId,
        MemoryType memoryType,
        PrivacyLevel privacy,
        bytes32 contentHash,
        string calldata ipfsUri,
        uint64 confidence,
        string[] calldata tags
    ) external onlyWriter nonReentrant returns (bytes32) {
        if (confidence > 10000) revert InvalidConfidence();
        
        memories[memoryId] = MemoryRecord({
            memoryId: memoryId,
            author: msg.sender,
            memoryType: memoryType,
            privacy: privacy,
            contentHash: contentHash,
            ipfsUri: ipfsUri,
            confidence: confidence,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            isPromoted: false,
            tags: tags
        });
        
        agents[msg.sender].memoriesWritten++;
        totalMemories++;
        
        emit MemoryCreated(memoryId, msg.sender, memoryType);
        return memoryId;
    }

    function promoteMemory(bytes32 memoryId) external onlyAdmin {
        if (memories[memoryId].createdAt == 0) revert MemoryNotFound();
        
        memories[memoryId].isPromoted = true;
        memories[memoryId].updatedAt = uint64(block.timestamp);
        
        emit MemoryPromoted(memoryId, msg.sender);
    }

    // ============ Claims ============
    function addClaim(
        bytes32 memoryId,
        bytes32 claimId,
        bytes32 evidenceHash,
        uint64 confidence
    ) external onlyWriter {
        if (memories[memoryId].createdAt == 0) revert MemoryNotFound();
        if (confidence > 10000) revert InvalidConfidence();
        
        memoryClaims[memoryId].push(Claim({
            claimId: claimId,
            memoryId: memoryId,
            claimant: msg.sender,
            evidenceHash: evidenceHash,
            status: ClaimStatus.Active,
            confidence: confidence,
            createdAt: uint64(block.timestamp)
        }));
        
        emit ClaimAdded(memoryId, claimId, msg.sender);
    }

    function retractClaim(bytes32 memoryId, uint256 claimIndex) external {
        if (claimIndex >= memoryClaims[memoryId].length) revert ClaimNotFound();
        Claim storage claim = memoryClaims[memoryId][claimIndex];
        if (claim.claimant != msg.sender) revert NotClaimOwner();
        if (claim.status != ClaimStatus.Active) revert ClaimNotActive();
        
        claim.status = ClaimStatus.Retracted;
        emit ClaimRetracted(claim.claimId, msg.sender);
    }

    // ============ Merkle Attestation ============
    function attestMerkleRoot(
        bytes32 merkleRoot,
        uint64 leafCount,
        bytes32[] calldata /* leaves - for verification */
    ) external onlyAdmin returns (bytes32) {
        bytes32 attestationId = keccak256(abi.encodePacked(merkleRoot, block.timestamp, msg.sender));
        
        attestations[attestationId] = MerkleAttestation({
            merkleRoot: merkleRoot,
            leafCount: leafCount,
            attestedAt: uint64(block.timestamp),
            attester: msg.sender
        });
        totalAttestations++;
        
        emit MerkleRootAttested(merkleRoot, leafCount, msg.sender);
        return attestationId;
    }

    // ============ Cross-Chain Bridge Functions ============
    
    /**
     * @notice Bridge a memory from Solana to Ethereum
     * @param solanaMemoryId The memory ID on Solana
     * @param solanaSignature Ed25519 signature from Solana attestation
     * @param solanaSlot The slot when memory was created on Solana
     * @param contentHash SHA256 hash of memory content
     * @param memoryType Type of memory
     */
    function bridgeFromSolana(
        bytes32 solanaMemoryId,
        bytes32 solanaSignature,
        uint64 solanaSlot,
        bytes32 contentHash,
        MemoryType memoryType,
        string calldata ipfsUri
    ) external onlyWriter nonReentrant returns (bytes32) {
        // Generate Ethereum memory ID from Solana data
        bytes32 ethMemoryId = keccak256(abi.encodePacked(
            "SOLANA_BRIDGE",
            solanaMemoryId,
            solanaSlot
        ));
        
        // Store Solana attestation
        solanaAttestations[ethMemoryId] = SolanaAttestation({
            solanaSignature: solanaSignature,
            solanaProgramId: SOLANA_PROGRAM_ID,
            solanaMemoryId: solanaMemoryId,
            solanaSlot: solanaSlot,
            verified: false // Will be verified by oracle/wormhole
        });
        
        // Create mirrored memory on Ethereum
        string[] memory emptyTags = new string[](0);
        memories[ethMemoryId] = MemoryRecord({
            memoryId: ethMemoryId,
            author: msg.sender,
            memoryType: memoryType,
            privacy: PrivacyLevel.Public, // Bridged memories are public
            contentHash: contentHash,
            ipfsUri: ipfsUri,
            confidence: 5000, // Start at 50%, increases after verification
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            isPromoted: false,
            tags: emptyTags
        });
        
        totalMemories++;
        emit SolanaBridged(solanaMemoryId, ethMemoryId, solanaSlot);
        
        return ethMemoryId;
    }

    /**
     * @notice Verify a bridged memory using Wormhole VAA
     * @dev Called by Wormhole relayer with verified attestation
     */
    function verifySolanaAttestation(
        bytes32 ethMemoryId,
        bytes calldata vaa // Wormhole Verified Action Approval
    ) external {
        require(msg.sender == wormholeRelayer || msg.sender == owner(), "Unauthorized");
        
        SolanaAttestation storage attestation = solanaAttestations[ethMemoryId];
        if (attestation.solanaSlot == 0) revert InvalidSolanaAttestation();
        
        // In production, decode and verify VAA here
        // For testnet, we trust the relayer
        attestation.verified = true;
        
        // Boost confidence after verification
        memories[ethMemoryId].confidence = 9000; // 90%
        memories[ethMemoryId].updatedAt = uint64(block.timestamp);
        
        emit CrossChainVerified(ethMemoryId, attestation.solanaSignature);
    }

    /**
     * @notice Prepare memory for bridging TO Solana
     * @dev Emits event that Wormhole relayer picks up
     */
    function bridgeToSolana(bytes32 memoryId) external onlyWriter {
        if (memories[memoryId].createdAt == 0) revert MemoryNotFound();
        
        // Emit event for Wormhole/relayer to pick up
        // The relayer will call the Solana program
        emit MemoryBridgeRequested(
            memoryId,
            memories[memoryId].contentHash,
            memories[memoryId].author,
            uint8(memories[memoryId].memoryType)
        );
    }

    event MemoryBridgeRequested(
        bytes32 indexed memoryId,
        bytes32 contentHash,
        address author,
        uint8 memoryType
    );

    // ============ View Functions ============
    function getMemory(bytes32 memoryId) external view returns (MemoryRecord memory) {
        return memories[memoryId];
    }

    function getAgent(address agent) external view returns (AgentAuthority memory) {
        return agents[agent];
    }

    function getClaims(bytes32 memoryId) external view returns (Claim[] memory) {
        return memoryClaims[memoryId];
    }

    function getSolanaAttestation(bytes32 ethMemoryId) external view returns (SolanaAttestation memory) {
        return solanaAttestations[ethMemoryId];
    }

    function isVerifiedBridge(bytes32 ethMemoryId) external view returns (bool) {
        return solanaAttestations[ethMemoryId].verified;
    }

    // ============ Admin Functions ============
    function setWormholeRelayer(address _relayer) external onlyOwner {
        wormholeRelayer = _relayer;
    }
}
