// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OrgMemoryRegistry} from "../src/OrgMemoryRegistry.sol";
import {WormholeBridgeRelayer} from "../src/WormholeBridgeRelayer.sol";

contract DeployAllScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Registry first (with placeholder relayer)
        OrgMemoryRegistry registry = new OrgMemoryRegistry(address(0));
        console.log("OrgMemoryRegistry deployed:", address(registry));
        
        // Deploy Bridge Relayer
        // Wormhole Core on Sepolia: 0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78
        address wormholeCore = address(0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78);
        WormholeBridgeRelayer relayer = new WormholeBridgeRelayer(wormholeCore, address(registry));
        console.log("WormholeBridgeRelayer deployed:", address(relayer));
        
        // Update registry with relayer address
        registry.setWormholeRelayer(address(relayer));
        console.log("Registry updated with relayer");
        
        // Register a test writer agent
        address testWriter = vm.addr(deployerPrivateKey);
        // Already admin from constructor
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("Chain: Sepolia Testnet");
        console.log("Registry:", address(registry));
        console.log("Relayer:", address(relayer));
        console.log("Admin:", testWriter);
        console.log("\nSolana Program ID: memRYfSiJ4TgVZMbN3BpZvmHEp7kVLoaLPEJzjdFVWL");
    }
}
