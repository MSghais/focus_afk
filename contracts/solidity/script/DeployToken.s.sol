// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {FocusToken} from "../src/FocusToken.sol";

contract DeployTokenScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying FocusToken with Access Control...");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy FocusToken
        FocusToken focusToken = new FocusToken();
        console.log("FocusToken deployed at:", address(focusToken));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== TOKEN DEPLOYMENT SUMMARY ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("FocusToken:", address(focusToken));
        console.log("========================\n");

        // Output deployment address for easy copying to .env
        console.log("=== COPY TO YOUR .ENV FILE ===");
        console.log("FOCUS_TOKEN_ADDRESS=", vm.toString(address(focusToken)));
        console.log("========================\n");
    }
} 