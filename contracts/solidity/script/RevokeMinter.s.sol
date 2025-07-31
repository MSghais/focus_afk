// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {FocusToken} from "../src/FocusToken.sol";

contract RevokeMinterScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get the FocusToken address from environment
        address focusTokenAddress = vm.envAddress("FOCUS_TOKEN_ADDRESS");
        
        // Get the address to revoke minter role from
        address minterToRevoke = vm.envAddress("MINTER_TO_REVOKE");
        
        console.log("Revoking minter role...");
        console.log("FocusToken address:", focusTokenAddress);
        console.log("Minter to revoke:", minterToRevoke);
        console.log("Deployer (admin):", deployer);
        
        FocusToken focusToken = FocusToken(focusTokenAddress);
        
        // Check if deployer has admin role
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;
        if (!focusToken.hasRole(DEFAULT_ADMIN_ROLE, deployer)) {
            console.log("❌ Deployer does not have admin role!");
            return;
        }
        
        // Check if minter has minter role
        bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");
        if (!focusToken.hasRole(MINTER_ROLE, minterToRevoke)) {
            console.log("⚠️  Address does not have minter role!");
            return;
        }
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Revoke minter role
        focusToken.revokeMinter(minterToRevoke);
        
        vm.stopBroadcast();
        
        console.log("✅ Minter role revoked successfully!");
        console.log("Address can no longer mint tokens.");
    }
} 