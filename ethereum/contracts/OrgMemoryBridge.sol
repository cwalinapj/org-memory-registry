// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IWormhole.sol";

/**
 * @title OrgMemoryBridge
 * @notice Cross-chain memory registry bridge for Origin OS
 * @dev Bridges memory attestations between Solana and Ethereum via Wormhole
 */
contract OrgMemoryBridge {
    // ============ Enums ============
    enum MemoryType {
        Episodic,      // 0 - Time-bound experiences
        Semantic,      // 1 - General knowledge
        Fact,          // 2 - Verified facts
        Preference,    // 3 - User preferences
        Plan,          // 4 - Future intentions
        Interaction,   // 5 - Conversation logs
        Artifact,      // 6 - Created content
        Skill,         // 7 - Learned capabilities
        Rule           // 8 - Behavioral constraints
    }

    enum PrivacyLevel {
        Private,       // 0 - Owner only
        Team,          // 1 - Team access
        Public         // 2 - Public access
    }

    // ============ Structs ============
    struct MemoryRecord {
        bytes32 memoryId;
        bytes32 contentHash;
        MemoryType memoryType;
        PrivacyLevel privacy;
        uint16 confidence;      // Basis points (0-10000)
        uint64 createdAt;
        uint64 expiresAt;
        address author;
        bytes32 solanaOrigin;   // Original Solana pubkey if bridged
        bool bridgedFromSolana;
        string[] tags;
    }

    struct MerkleAttestation {
        bytes32 merkleRoot;
        uint64 timestamp;
        uint32 leafCount;
        address attester;
        bytes32 solanaSignature; // Ed25519 signature from Solana
    }

    struct BridgeMessage {
        uint8 messageType;      // 1=memory, 2=attestation, 3=trust_update
        bytes32 memoryId;
        bytes32 contentHash;
        uint8 memoryType;
        uint16 confidence;
        bytes32 author;         // Solana pubkey
        uint64 timestamp;
    }

    // ============ State ============
    IWormhole public wormhole;
    uint16 public solanaChainId;
    bytes32 public solanaEmitter; // org-memory-registry program ID
    
    address public admin;
    uint256 public memoryCount;
    uint256 public attestationCount;
    
    mapping(bytes32 => MemoryRecord) public memories;
    mapping(bytes32 => MerkleAttestation) public attestations;
    mapping(address => uint32) public trustScores;
    mapping(bytes32 => bool) public processedVaas; // Prevent replay
    
    bytes32[] public memoryIds;
    bytes32[] public attestationIds;

    // ============ Events ============
    event MemoryCreated(
        bytes32 indexed memoryId,
        address indexed author,
        MemoryType memoryType,
        bytes32 contentHash
    );
    
    event MemoryBridged(
        bytes32 indexed memoryId,
        bytes32 indexed solanaOrigin,
        MemoryType memoryType
    );
    
    event MerkleRootAttested(
        bytes32 indexed attestationId,
        bytes32 merkleRoot,
        uint32 leafCount,
        address attester
    );
    
    event TrustScoreUpdated(
        address indexed agent,
        uint32 oldScore,
        uint32 newScore
    );
    
    event CrossChainMessageReceived(
        uint16 sourceChain,
        bytes32 sourceAddress,
        uint8 messageType
    );

    // ============ Errors ============
    error Unauthorized();
    error InvalidMemoryType();
    error InvalidConfidence();
    error MemoryNotFound();
    error AttestationNotFound();
    error InvalidVAA();
    error VAAAlreadyProcessed();
    error InvalidEmitter();

    // ============ Modifiers ============
    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    // ============ Constructor ============
    constructor(
        address _wormhole,
        uint16 _solanaChainId,
        bytes32 _solanaEmitter
    ) {
        admin = msg.sender;
        wormhole = IWormhole(_wormhole);
        solanaChainId = _solanaChainId;
        solanaEmitter = _solanaEmitter;
    }

    // ============ Write Functions ============
    
    /**
     * @notice Create a new memory record on Ethereum
     */
    function writeMemory(
        bytes32 contentHash,
        MemoryType memoryType,
        PrivacyLevel privacy,
        uint16 confidence,
        uint64 expiresAt,
        string[] calldata tags
    ) external returns (bytes32 memoryId) {
        if (confidence > 10000) revert InvalidConfidence();
        
        memoryId = keccak256(abi.encodePacked(
            msg.sender,
            contentHash,
            block.timestamp,
            memoryCount
        ));
        
        memories[memoryId] = MemoryRecord({
            memoryId: memoryId,
            contentHash: contentHash,
            memoryType: memoryType,
            privacy: privacy,
            confidence: confidence,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            author: msg.sender,
            solanaOrigin: bytes32(0),
            bridgedFromSolana: false,
            tags: tags
        });
        
        memoryIds.push(memoryId);
        memoryCount++;
        
        emit MemoryCreated(memoryId, msg.sender, memoryType, contentHash);
    }

    /**
     * @notice Attest a Merkle root for batch verification
     */
    function attestMerkleRoot(
        bytes32 merkleRoot,
        uint32 leafCount,
        bytes32 solanaSignature
    ) external returns (bytes32 attestationId) {
        attestationId = keccak256(abi.encodePacked(
            merkleRoot,
            msg.sender,
            block.timestamp
        ));
        
        attestations[attestationId] = MerkleAttestation({
            merkleRoot: merkleRoot,
            timestamp: uint64(block.timestamp),
            leafCount: leafCount,
            attester: msg.sender,
            solanaSignature: solanaSignature
        });
        
        attestationIds.push(attestationId);
        attestationCount++;
        
        emit MerkleRootAttested(attestationId, merkleRoot, leafCount, msg.sender);
    }

    /**
     * @notice Receive and process a Wormhole VAA from Solana
     */
    function receiveWormholeMessage(bytes calldata vaa) external {
        // Parse and verify VAA
        (IWormhole.VM memory vm, bool valid, string memory reason) = 
            wormhole.parseAndVerifyVM(vaa);
        
        if (!valid) revert InvalidVAA();
        if (processedVaas[vm.hash]) revert VAAAlreadyProcessed();
        if (vm.emitterChainId != solanaChainId) revert InvalidEmitter();
        if (vm.emitterAddress != solanaEmitter) revert InvalidEmitter();
        
        processedVaas[vm.hash] = true;
        
        // Decode the message
        BridgeMessage memory message = _decodeBridgeMessage(vm.payload);
        
        emit CrossChainMessageReceived(
            vm.emitterChainId,
            vm.emitterAddress,
            message.messageType
        );
        
        // Process based on message type
        if (message.messageType == 1) {
            _processMemoryBridge(message);
        } else if (message.messageType == 2) {
            _processAttestationBridge(message);
        } else if (message.messageType == 3) {
            _processTrustUpdate(message);
        }
    }

    // ============ View Functions ============
    
    function getMemory(bytes32 memoryId) external view returns (MemoryRecord memory) {
        MemoryRecord memory record = memories[memoryId];
        if (record.createdAt == 0) revert MemoryNotFound();
        return record;
    }
    
    function getAttestation(bytes32 attestationId) external view returns (MerkleAttestation memory) {
        MerkleAttestation memory attestation = attestations[attestationId];
        if (attestation.timestamp == 0) revert AttestationNotFound();
        return attestation;
    }
    
    function verifyMerkleProof(
        bytes32 attestationId,
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 index
    ) external view returns (bool) {
        MerkleAttestation memory attestation = attestations[attestationId];
        if (attestation.timestamp == 0) revert AttestationNotFound();
        
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (index % 2 == 0) {
                computedHash = keccak256(abi.encodePacked(computedHash, proof[i]));
            } else {
                computedHash = keccak256(abi.encodePacked(proof[i], computedHash));
            }
            index = index / 2;
        }
        
        return computedHash == attestation.merkleRoot;
    }
    
    function getTrustMultiplier(address agent) external view returns (uint256) {
        uint32 score = trustScores[agent];
        if (score < 50) return 100;      // 1.0x
        if (score < 100) return 150;     // 1.5x
        return 200;                       // 2.0x
    }

    function getMemoryCount() external view returns (uint256) {
        return memoryCount;
    }

    function getAttestationCount() external view returns (uint256) {
        return attestationCount;
    }

    // ============ Admin Functions ============
    
    function updateSolanaEmitter(bytes32 newEmitter) external onlyAdmin {
        solanaEmitter = newEmitter;
    }
    
    function updateTrustScore(address agent, uint32 newScore) external onlyAdmin {
        uint32 oldScore = trustScores[agent];
        trustScores[agent] = newScore;
        emit TrustScoreUpdated(agent, oldScore, newScore);
    }
    
    function transferAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    // ============ Internal Functions ============
    
    function _decodeBridgeMessage(bytes memory payload) internal pure returns (BridgeMessage memory) {
        require(payload.length >= 91, "Invalid payload length");
        
        BridgeMessage memory message;
        
        uint256 offset = 0;
        message.messageType = uint8(payload[offset]);
        offset += 1;
        
        assembly {
            let data := add(payload, 32)
            mstore(add(message, 32), mload(add(data, offset)))  // memoryId
            mstore(add(message, 64), mload(add(data, add(offset, 32))))  // contentHash
        }
        offset += 64;
        
        message.memoryType = uint8(payload[offset]);
        offset += 1;
        
        message.confidence = uint16(uint8(payload[offset])) << 8 | uint16(uint8(payload[offset + 1]));
        offset += 2;
        
        assembly {
            let data := add(payload, 32)
            mstore(add(message, 160), mload(add(data, offset)))  // author
        }
        offset += 32;
        
        // timestamp (8 bytes big-endian)
        message.timestamp = 0;
        for (uint i = 0; i < 8; i++) {
            message.timestamp = message.timestamp << 8 | uint64(uint8(payload[offset + i]));
        }
        
        return message;
    }
    
    function _processMemoryBridge(BridgeMessage memory message) internal {
        bytes32 memoryId = keccak256(abi.encodePacked(
            message.memoryId,
            "bridged",
            block.timestamp
        ));
        
        string[] memory emptyTags = new string[](0);
        
        memories[memoryId] = MemoryRecord({
            memoryId: memoryId,
            contentHash: message.contentHash,
            memoryType: MemoryType(message.memoryType),
            privacy: PrivacyLevel.Private,
            confidence: message.confidence,
            createdAt: uint64(block.timestamp),
            expiresAt: 0,
            author: address(0),
            solanaOrigin: message.author,
            bridgedFromSolana: true,
            tags: emptyTags
        });
        
        memoryIds.push(memoryId);
        memoryCount++;
        
        emit MemoryBridged(memoryId, message.author, MemoryType(message.memoryType));
    }
    
    function _processAttestationBridge(BridgeMessage memory message) internal {
        bytes32 attestationId = keccak256(abi.encodePacked(
            message.contentHash,
            "bridged_attestation",
            block.timestamp
        ));
        
        attestations[attestationId] = MerkleAttestation({
            merkleRoot: message.contentHash,
            timestamp: uint64(block.timestamp),
            leafCount: uint32(message.confidence), // Reusing field
            attester: address(0),
            solanaSignature: message.author
        });
        
        attestationIds.push(attestationId);
        attestationCount++;
        
        emit MerkleRootAttested(attestationId, message.contentHash, uint32(message.confidence), address(0));
    }
    
    function _processTrustUpdate(BridgeMessage memory message) internal {
        // Convert Solana pubkey to Ethereum address (take first 20 bytes)
        address agent;
        bytes32 author = message.author;
        assembly {
            agent := and(author, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
        }
        
        uint32 oldScore = trustScores[agent];
        uint32 newScore = uint32(message.confidence);
        trustScores[agent] = newScore;
        
        emit TrustScoreUpdated(agent, oldScore, newScore);
    }
}
