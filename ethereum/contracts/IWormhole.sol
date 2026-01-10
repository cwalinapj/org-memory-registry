// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IWormhole
 * @notice Interface for Wormhole core bridge contract
 */
interface IWormhole {
    struct VM {
        uint8 version;
        uint32 timestamp;
        uint32 nonce;
        uint16 emitterChainId;
        bytes32 emitterAddress;
        uint64 sequence;
        uint8 consistencyLevel;
        bytes payload;
        uint32 guardianSetIndex;
        Signature[] signatures;
        bytes32 hash;
    }

    struct Signature {
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint8 guardianIndex;
    }

    /**
     * @notice Parse and verify a VAA
     * @param encodedVM The encoded VAA bytes
     * @return vm The parsed VM struct
     * @return valid Whether the VAA is valid
     * @return reason If invalid, the reason string
     */
    function parseAndVerifyVM(bytes calldata encodedVM) 
        external 
        view 
        returns (VM memory vm, bool valid, string memory reason);

    /**
     * @notice Publish a message to be picked up by guardians
     * @param nonce User-specified nonce for deduplication
     * @param payload The message payload
     * @param consistencyLevel Required finality level
     * @return sequence The sequence number of the published message
     */
    function publishMessage(
        uint32 nonce,
        bytes memory payload,
        uint8 consistencyLevel
    ) external payable returns (uint64 sequence);

    /**
     * @notice Get the fee for publishing a message
     */
    function messageFee() external view returns (uint256);

    /**
     * @notice Get the current guardian set index
     */
    function getCurrentGuardianSetIndex() external view returns (uint32);

    /**
     * @notice Get chain ID
     */
    function chainId() external view returns (uint16);
}
