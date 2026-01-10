// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OrgMemoryRegistry} from "../src/OrgMemoryRegistry.sol";

contract OrgMemoryRegistryTest is Test {
    OrgMemoryRegistry public registry;
    
    address public admin = address(this);
    address public writer = address(0x1);
    address public observer = address(0x2);
    
    function setUp() public {
        registry = new OrgMemoryRegistry(address(0)); // No wormhole for tests
    }
    
    function test_AdminIsRegistered() public view {
        OrgMemoryRegistry.AgentAuthority memory agent = registry.getAgent(admin);
        assertEq(uint8(agent.role), uint8(OrgMemoryRegistry.AgentRole.Admin));
        assertTrue(agent.isActive);
        assertEq(agent.trustScore, 10000);
    }
    
    function test_RegisterAgent() public {
        registry.registerAgent(writer, OrgMemoryRegistry.AgentRole.Writer);
        
        OrgMemoryRegistry.AgentAuthority memory agent = registry.getAgent(writer);
        assertEq(uint8(agent.role), uint8(OrgMemoryRegistry.AgentRole.Writer));
        assertTrue(agent.isActive);
        assertEq(agent.trustScore, 5000);
    }
    
    function test_WriteMemory() public {
        registry.registerAgent(writer, OrgMemoryRegistry.AgentRole.Writer);
        
        vm.startPrank(writer);
        
        bytes32 memoryId = keccak256("test-memory-1");
        bytes32 contentHash = keccak256("test content");
        string[] memory tags = new string[](2);
        tags[0] = "test";
        tags[1] = "origin-os";
        
        bytes32 returnedId = registry.writeMemory(
            memoryId,
            OrgMemoryRegistry.MemoryType.Semantic,
            OrgMemoryRegistry.PrivacyLevel.Public,
            contentHash,
            "ipfs://QmTest123",
            8000, // 80% confidence
            tags
        );
        
        vm.stopPrank();
        
        assertEq(returnedId, memoryId);
        
        OrgMemoryRegistry.MemoryRecord memory memory_ = registry.getMemory(memoryId);
        assertEq(memory_.author, writer);
        assertEq(uint8(memory_.memoryType), uint8(OrgMemoryRegistry.MemoryType.Semantic));
        assertEq(memory_.confidence, 8000);
    }
    
    function test_BridgeFromSolana() public {
        registry.registerAgent(writer, OrgMemoryRegistry.AgentRole.Writer);
        
        // Advance time to avoid rate limiting
        vm.warp(block.timestamp + 120);
        
        vm.startPrank(writer);
        
        bytes32 solanaMemoryId = keccak256("solana-memory-123");
        bytes32 solanaSignature = keccak256("ed25519-sig");
        bytes32 contentHash = keccak256("bridged content");
        
        bytes32 ethMemoryId = registry.bridgeFromSolana(
            solanaMemoryId,
            solanaSignature,
            12345678, // Solana slot
            contentHash,
            OrgMemoryRegistry.MemoryType.Fact,
            "ipfs://QmBridged"
        );
        
        vm.stopPrank();
        
        // Check memory was created
        OrgMemoryRegistry.MemoryRecord memory memory_ = registry.getMemory(ethMemoryId);
        assertEq(memory_.contentHash, contentHash);
        assertEq(memory_.confidence, 5000); // Unverified = 50%
        
        // Check Solana attestation
        OrgMemoryRegistry.SolanaAttestation memory attestation = registry.getSolanaAttestation(ethMemoryId);
        assertEq(attestation.solanaMemoryId, solanaMemoryId);
        assertEq(attestation.solanaSlot, 12345678);
        assertFalse(attestation.verified);
    }
    
    function test_VerifySolanaAttestation() public {
        registry.registerAgent(writer, OrgMemoryRegistry.AgentRole.Writer);
        
        // Advance time to avoid rate limiting
        vm.warp(block.timestamp + 120);
        
        vm.prank(writer);
        bytes32 ethMemoryId = registry.bridgeFromSolana(
            keccak256("solana-mem"),
            keccak256("sig"),
            100,
            keccak256("content"),
            OrgMemoryRegistry.MemoryType.Preference,
            "ipfs://Qm"
        );
        
        // Verify as owner (simulating wormhole relayer)
        registry.verifySolanaAttestation(ethMemoryId, "", block.timestamp);
        
        // Check verification
        assertTrue(registry.isVerifiedBridge(ethMemoryId));
        
        // Check confidence boosted
        OrgMemoryRegistry.MemoryRecord memory memory_ = registry.getMemory(ethMemoryId);
        assertEq(memory_.confidence, 9000); // Verified = 90%
    }
    
    function test_AddClaim() public {
        registry.registerAgent(writer, OrgMemoryRegistry.AgentRole.Writer);
        
        vm.startPrank(writer);
        
        bytes32 memoryId = keccak256("mem-with-claim");
        string[] memory emptyTags = new string[](0);
        registry.writeMemory(
            memoryId,
            OrgMemoryRegistry.MemoryType.Fact,
            OrgMemoryRegistry.PrivacyLevel.Public,
            keccak256("fact"),
            "ipfs://fact",
            7000,
            emptyTags
        );
        
        bytes32 claimId = keccak256("claim-1");
        registry.addClaim(
            memoryId,
            claimId,
            keccak256("evidence"),
            9000
        );
        
        vm.stopPrank();
        
        OrgMemoryRegistry.Claim[] memory claims = registry.getClaims(memoryId);
        assertEq(claims.length, 1);
        assertEq(claims[0].claimId, claimId);
        assertEq(uint8(claims[0].status), uint8(OrgMemoryRegistry.ClaimStatus.Active));
    }
    
    function test_PromoteMemory() public {
        registry.registerAgent(writer, OrgMemoryRegistry.AgentRole.Writer);
        
        vm.prank(writer);
        bytes32 memoryId = keccak256("to-promote");
        string[] memory emptyTags = new string[](0);
        registry.writeMemory(
            memoryId,
            OrgMemoryRegistry.MemoryType.Skill,
            OrgMemoryRegistry.PrivacyLevel.Team,
            keccak256("skill"),
            "ipfs://skill",
            6000,
            emptyTags
        );
        
        // Promote as admin
        registry.promoteMemory(memoryId);
        
        OrgMemoryRegistry.MemoryRecord memory memory_ = registry.getMemory(memoryId);
        assertTrue(memory_.isPromoted);
    }
    
    function test_RevertWhen_NonWriterCannotWrite() public {
        vm.expectRevert(OrgMemoryRegistry.AgentNotRegistered.selector);
        vm.prank(observer);
        bytes32 memoryId = keccak256("fail");
        string[] memory emptyTags = new string[](0);
        registry.writeMemory(
            memoryId,
            OrgMemoryRegistry.MemoryType.Episodic,
            OrgMemoryRegistry.PrivacyLevel.Private,
            keccak256("x"),
            "ipfs://x",
            5000,
            emptyTags
        );
    }
    
    function test_UpdateTrustScore() public {
        registry.registerAgent(writer, OrgMemoryRegistry.AgentRole.Writer);
        
        registry.updateTrustScore(writer, 9500);
        
        OrgMemoryRegistry.AgentAuthority memory agent = registry.getAgent(writer);
        assertEq(agent.trustScore, 9500);
    }
}
