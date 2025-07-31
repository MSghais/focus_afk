// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {FocusToken} from "../src/FocusToken.sol";
import {FocusStaking} from "../src/FocusStaking.sol";
import {QuestNFT} from "../src/QuestNft.sol";
import {FocusSBT} from "../src/FocusSBT.sol";

contract DeploySimpleScript is Script {
    // Deployed contract addresses
    FocusToken public focusToken;
    FocusStaking public focusStaking;
    QuestNFT public questNFT;
    FocusSBT public focusSBT;

    // Configuration
    string public constant QUEST_BASE_URI = "https://api.focusafk.com/quests/";
    string public constant SBT_BASE_URI = "https://api.focusafk.com/sbt/";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Focus AFK contracts...");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy FocusToken
        console.log("\n1. Deploying FocusToken...");
        focusToken = new FocusToken();
        console.log("FocusToken deployed at:", address(focusToken));

        // 2. Deploy FocusStaking
        console.log("\n2. Deploying FocusStaking...");
        focusStaking = new FocusStaking(address(focusToken));
        console.log("FocusStaking deployed at:", address(focusStaking));

        // 3. Deploy QuestNFT
        console.log("\n3. Deploying QuestNFT...");
        questNFT = new QuestNFT(QUEST_BASE_URI);
        console.log("QuestNFT deployed at:", address(questNFT));

        // 4. Deploy FocusSBT
        console.log("\n4. Deploying FocusSBT...");
        focusSBT = new FocusSBT(SBT_BASE_URI);
        console.log("FocusSBT deployed at:", address(focusSBT));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("FocusToken:", address(focusToken));
        console.log("FocusStaking:", address(focusStaking));
        console.log("QuestNFT:", address(questNFT));
        console.log("FocusSBT:", address(focusSBT));
        console.log("========================\n");

        // Output addresses for easy copying
        console.log("=== COPY THESE ADDRESSES TO YOUR .ENV FILE ===");
        console.log("FOCUS_TOKEN_ADDRESS=", vm.toString(address(focusToken)));
        console.log("FOCUS_STAKING_ADDRESS=", vm.toString(address(focusStaking)));
        console.log("QUEST_NFT_ADDRESS=", vm.toString(address(questNFT)));
        console.log("FOCUS_SBT_ADDRESS=", vm.toString(address(focusSBT)));
        console.log("=============================================\n");
    }
} 