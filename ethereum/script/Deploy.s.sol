// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OrgMemoryRegistry} from "../src/OrgMemoryRegistry.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Wormhole Relayer on Sepolia (placeholder - use actual address)
        address wormholeRelayer = address(0); // Will set later
        
        vm.startBroadcast(deployerPrivateKey);
        
        OrgMemoryRegistry registry = new OrgMemoryRegistry(wormholeRelayer);
        
        console.log("OrgMemoryRegistry deployed to:", address(registry));
        console.log("Deployer/Admin:", vm.addr(deployerPrivateKey));
        
        vm.stopBroadcast();
    }
}
