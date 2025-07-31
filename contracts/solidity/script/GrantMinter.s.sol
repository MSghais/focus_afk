// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {FocusToken} from "../src/FocusToken.sol";

contract GrantMinterScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get the FocusToken address from environment or use a default
        address focusTokenAddress = vm.envAddress("FOCUS_TOKEN_ADDRESS");
        
        // Get the address to grant minter role to
        address newMinter = vm.envAddress("NEW_MINTER_ADDRESS");
        
        console.log("Granting minter role...");
        console.log("FocusToken address:", focusTokenAddress);
        console.log("New minter address:", newMinter);
        console.log("Deployer (admin):", deployer);
        
        FocusToken focusToken = FocusToken(focusTokenAddress);
        
        // Check if deployer has admin role
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;
        if (!focusToken.hasRole(DEFAULT_ADMIN_ROLE, deployer)) {
            console.log("❌ Deployer does not have admin role!");
            return;
        }
        
        // Check if new minter already has minter role
        bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");
        if (focusToken.hasRole(MINTER_ROLE, newMinter)) {
            console.log("⚠️  Address already has minter role!");
            return;
        }
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Grant minter role
        focusToken.grantMinter(newMinter);
        
        vm.stopBroadcast();
        
        console.log("✅ Minter role granted successfully!");
        console.log("New minter can now call:");
        console.log("  - mint(address to, uint256 amount, string reason)");
        console.log("  - mintFocusReward(address user, uint256 sessionMinutes, uint256 streak)");
    }
} 