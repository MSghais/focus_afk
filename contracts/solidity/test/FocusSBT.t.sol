// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {FocusSBT} from "../src/FocusSBT.sol";

contract FocusSBTTest is Test {
    FocusSBT public sbt;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.prank(owner);
        sbt = new FocusSBT("https://api.focusafk.com/sbt/");
    }

    function testUpdateFocusRecord() public {
        vm.prank(owner);
        sbt.updateFocusRecord(user, 60, 7); // 60 minutes, 7 day streak
        
        FocusSBT.FocusStats memory stats = sbt.getUserStats(user);
        assertEq(stats.totalMinutes, 60);
        assertEq(stats.streakDays, 7);
        assertEq(stats.completedQuests, 1);
        assertEq(stats.level, 1); // 60 minutes / 60 = level 1
    }

    function testMintSBTOnFirstSession() public {
        vm.prank(owner);
        sbt.updateFocusRecord(user, 60, 7);
        
        uint256 tokenId = sbt.userTokenId(user);
        assertEq(tokenId, 0);
        assertEq(sbt.ownerOf(tokenId), user);
    }

    function testLevelUp() public {
        // First session: 60 minutes = level 1
        vm.prank(owner);
        sbt.updateFocusRecord(user, 60, 7);
        
        // Second session: 120 minutes = level 3 (180 total / 60)
        vm.prank(owner);
        sbt.updateFocusRecord(user, 120, 14);
        
        FocusSBT.FocusStats memory stats = sbt.getUserStats(user);
        assertEq(stats.totalMinutes, 180);
        assertEq(stats.level, 3);
    }

    function testMaxLevel() public {
        // Add enough minutes to exceed max level
        uint256 minutesForMaxLevel = 100 * 60; // 100 levels * 60 minutes
        
        vm.prank(owner);
        sbt.updateFocusRecord(user, minutesForMaxLevel, 1);
        
        FocusSBT.FocusStats memory stats = sbt.getUserStats(user);
        assertEq(stats.level, 100); // Max level
    }

    function testOnlyOwnerCanUpdateRecord() public {
        vm.prank(user);
        vm.expectRevert();
        sbt.updateFocusRecord(user, 60, 7);
    }

    function testSoulboundTransfer() public {
        // First create an SBT
        vm.prank(owner);
        sbt.updateFocusRecord(user, 60, 7);
        
        uint256 tokenId = sbt.userTokenId(user);
        
        // Try to transfer the SBT (should fail)
        vm.prank(user);
        vm.expectRevert("Soulbound: transfer not allowed");
        sbt.transferFrom(user, address(3), tokenId);
    }

    function testMultipleSessions() public {
        // Multiple focus sessions
        vm.prank(owner);
        sbt.updateFocusRecord(user, 30, 1);
        
        vm.prank(owner);
        sbt.updateFocusRecord(user, 45, 2);
        
        vm.prank(owner);
        sbt.updateFocusRecord(user, 60, 3);
        
        FocusSBT.FocusStats memory stats = sbt.getUserStats(user);
        assertEq(stats.totalMinutes, 135);
        assertEq(stats.completedQuests, 3);
        assertEq(stats.level, 2); // 135 / 60 = 2
    }

    function testSetBaseURI() public {
        string memory newURI = "https://new-api.focusafk.com/sbt/";
        
        vm.prank(owner);
        sbt.setBaseURI(newURI);
        
        assertEq(sbt.baseTokenURI(), newURI);
    }

    function testOnlyOwnerCanSetBaseURI() public {
        vm.prank(user);
        vm.expectRevert();
        sbt.setBaseURI("https://new-api.focusafk.com/sbt/");
    }
} 