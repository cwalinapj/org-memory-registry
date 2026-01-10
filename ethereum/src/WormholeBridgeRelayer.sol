// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WormholeBridgeRelayer
 * @notice Relayer for Solana <-> Ethereum memory bridging
 * @dev Integrates with Wormhole for cross-chain verification
 */
contract WormholeBridgeRelayer is Ownable {
    
    // Wormhole core contract on Sepolia
    address public wormholeCore;
    
    // Memory registry contract
    address public memoryRegistry;
    
    // Authorized relayers
    mapping(address => bool) public authorizedRelayers;
    
    // Pending bridge requests from Solana
    struct PendingBridge {
        bytes32 solanaMemoryId;
        bytes32 contentHash;
        uint8 memoryType;
        uint64 solanaSlot;
        bool processed;
    }
    
    mapping(bytes32 => PendingBridge) public pendingBridges;
    
    // Events
    event RelayerAuthorized(address indexed relayer);
    event RelayerRevoked(address indexed relayer);
    event BridgeReceived(bytes32 indexed solanaMemoryId, bytes32 vaaHash);
    event BridgeProcessed(bytes32 indexed solanaMemoryId, bytes32 ethMemoryId);
    
    // Errors
    error UnauthorizedRelayer();
    error AlreadyProcessed();
    error InvalidVAA();
    
    modifier onlyRelayer() {
        if (!authorizedRelayers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedRelayer();
        }
        _;
    }
    
    constructor(address _wormholeCore, address _memoryRegistry) Ownable(msg.sender) {
        wormholeCore = _wormholeCore;
        memoryRegistry = _memoryRegistry;
        authorizedRelayers[msg.sender] = true;
    }
    
    function authorizeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = true;
        emit RelayerAuthorized(relayer);
    }
    
    function revokeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = false;
        emit RelayerRevoked(relayer);
    }
    
    /**
     * @notice Receive and parse Wormhole VAA for Solana memory
     * @dev In production, this validates the VAA signature
     */
    function receiveSolanaMemory(
        bytes calldata vaa,
        bytes32 solanaMemoryId,
        bytes32 contentHash,
        uint8 memoryType,
        uint64 solanaSlot
    ) external onlyRelayer {
        bytes32 vaaHash = keccak256(vaa);
        
        // Store pending bridge
        pendingBridges[vaaHash] = PendingBridge({
            solanaMemoryId: solanaMemoryId,
            contentHash: contentHash,
            memoryType: memoryType,
            solanaSlot: solanaSlot,
            processed: false
        });
        
        emit BridgeReceived(solanaMemoryId, vaaHash);
    }
    
    /**
     * @notice Process pending bridge and create memory on Ethereum
     */
    function processBridge(bytes32 vaaHash) external onlyRelayer {
        PendingBridge storage bridge = pendingBridges[vaaHash];
        if (bridge.processed) revert AlreadyProcessed();
        if (bridge.solanaSlot == 0) revert InvalidVAA();
        
        bridge.processed = true;
        
        // In production, call memoryRegistry.bridgeFromSolana()
        // For now, emit event
        bytes32 ethMemoryId = keccak256(abi.encodePacked(
            "SOLANA_BRIDGE",
            bridge.solanaMemoryId,
            bridge.solanaSlot
        ));
        
        emit BridgeProcessed(bridge.solanaMemoryId, ethMemoryId);
    }
    
    /**
     * @notice Send memory to Solana via Wormhole
     */
    function sendToSolana(
        bytes32 ethMemoryId,
        bytes32 contentHash,
        uint8 memoryType
    ) external payable onlyRelayer {
        // In production:
        // 1. Call wormholeCore.publishMessage()
        // 2. Pay Wormhole fee (msg.value)
        // 3. Emit event for guardian network
        
        // For testnet, just emit
        emit BridgeToSolanaInitiated(ethMemoryId, contentHash, memoryType);
    }
    
    event BridgeToSolanaInitiated(bytes32 indexed ethMemoryId, bytes32 contentHash, uint8 memoryType);
    
    function setMemoryRegistry(address _registry) external onlyOwner {
        memoryRegistry = _registry;
    }
    
    function setWormholeCore(address _core) external onlyOwner {
        wormholeCore = _core;
    }
}
