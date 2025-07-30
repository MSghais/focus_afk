// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {QuestNFT} from "../src/QuestNft.sol";

contract QuestNFTTest is Test {
    QuestNFT public questNFT;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.prank(owner);
        questNFT = new QuestNFT("https://api.focusafk.com/quests/");
    }

    function testMintQuest() public {
        vm.prank(owner);
        uint256 tokenId = questNFT.mintQuest(
            user,
            "Complete Focus Session",
            "Complete a 25-minute focus session",
            100 // 100 XP reward
        );
        
        assertEq(tokenId, 0);
        assertEq(questNFT.ownerOf(tokenId), user);
        
        // Check individual fields
        (string memory name, string memory description, uint256 xpReward, bool isCompleted, uint256 completedAt) = questNFT.quests(tokenId);
        assertEq(name, "Complete Focus Session");
        assertEq(description, "Complete a 25-minute focus session");
        assertEq(xpReward, 100);
        assertEq(isCompleted, false);
    }

    function testCompleteQuest() public {
        // First mint a quest
        vm.prank(owner);
        uint256 tokenId = questNFT.mintQuest(
            user,
            "Complete Focus Session",
            "Complete a 25-minute focus session",
            100
        );
        
        // Complete the quest
        vm.prank(owner);
        questNFT.completeQuest(tokenId);
        
        // Check individual fields
        (string memory name, string memory description, uint256 xpReward, bool isCompleted, uint256 completedAt) = questNFT.quests(tokenId);
        assertEq(isCompleted, true);
        assertGt(completedAt, 0);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(user);
        vm.expectRevert();
        questNFT.mintQuest(
            user,
            "Test Quest",
            "Test Description",
            100
        );
    }

    function testOnlyOwnerCanComplete() public {
        // First mint a quest
        vm.prank(owner);
        uint256 tokenId = questNFT.mintQuest(
            user,
            "Complete Focus Session",
            "Complete a 25-minute focus session",
            100
        );
        
        // Try to complete as non-owner
        vm.prank(user);
        vm.expectRevert();
        questNFT.completeQuest(tokenId);
    }

    function testCannotCompleteNonExistentQuest() public {
        vm.prank(owner);
        vm.expectRevert("Quest does not exist");
        questNFT.completeQuest(999);
    }

    function testCannotCompleteAlreadyCompletedQuest() public {
        // First mint a quest
        vm.prank(owner);
        uint256 tokenId = questNFT.mintQuest(
            user,
            "Complete Focus Session",
            "Complete a 25-minute focus session",
            100
        );
        
        // Complete the quest
        vm.prank(owner);
        questNFT.completeQuest(tokenId);
        
        // Try to complete again
        vm.prank(owner);
        vm.expectRevert("Quest already completed");
        questNFT.completeQuest(tokenId);
    }

    function testSetBaseURI() public {
        string memory newURI = "https://new-api.focusafk.com/quests/";
        
        vm.prank(owner);
        questNFT.setBaseURI(newURI);
        
        assertEq(questNFT.baseTokenURI(), newURI);
    }

    function testOnlyOwnerCanSetBaseURI() public {
        vm.prank(user);
        vm.expectRevert();
        questNFT.setBaseURI("https://new-api.focusafk.com/quests/");
    }
} 