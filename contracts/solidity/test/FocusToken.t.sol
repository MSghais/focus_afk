// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {FocusToken} from "../src/FocusToken.sol";

contract FocusTokenTest is Test {
    FocusToken public token;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.prank(owner);
        token = new FocusToken();
    }

    function testInitialSupply() public {
        assertEq(token.totalSupply(), 1_000_000 * 10**18);
        assertEq(token.balanceOf(owner), 1_000_000 * 10**18);
    }

    function testMint() public {
        vm.prank(owner);
        token.mint(user, 1000 * 10**18, "Test mint");
        
        assertEq(token.balanceOf(user), 1000 * 10**18);
    }

    function testMintFocusReward() public {
        vm.prank(owner);
        token.mintFocusReward(user, 60, 7); // 60 minutes, 7 day streak
        
        // Expected: 60 * 0.01 + 7 * 0.01 = 0.67 tokens
        assertEq(token.balanceOf(user), 67 * 10**16);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(user);
        vm.expectRevert();
        token.mint(user, 1000 * 10**18, "Test mint");
    }

    function testMaxSupply() public {
        uint256 remainingSupply = 9_000_000 * 10**18; // 10M - 1M initial
        
        vm.prank(owner);
        token.mint(user, remainingSupply, "Max supply test");
        
        vm.prank(owner);
        vm.expectRevert("Exceeds max supply");
        token.mint(user, 1, "Should fail");
    }
} 