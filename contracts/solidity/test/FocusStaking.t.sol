// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {FocusToken} from "../src/FocusToken.sol";
import {FocusStaking} from "../src/FocusStaking.sol";

contract FocusStakingTest is Test {
    FocusToken public token;
    FocusStaking public staking;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.prank(owner);
        token = new FocusToken();
        
        vm.prank(owner);
        staking = new FocusStaking(address(token));
        
        // Give user some tokens
        vm.prank(owner);
        token.mint(user, 10000 * 10**18, "Setup tokens");
    }

    function testStake() public {
        uint256 stakeAmount = 1000 * 10**18;
        
        vm.startPrank(user);
        token.approve(address(staking), stakeAmount);
        staking.stake(stakeAmount);
        vm.stopPrank();
        
        assertEq(staking.stakedBalance(user), stakeAmount);
        assertEq(staking.totalStaked(), stakeAmount);
    }

    function testUnstake() public {
        uint256 stakeAmount = 1000 * 10**18;
        
        // First stake
        vm.startPrank(user);
        token.approve(address(staking), stakeAmount);
        staking.stake(stakeAmount);
        
        // Then unstake
        staking.unstake(stakeAmount);
        vm.stopPrank();
        
        assertEq(staking.stakedBalance(user), 0);
        assertEq(staking.totalStaked(), 0);
    }

    function testRecordFocusSession() public {
        uint256 stakeAmount = 1000 * 10**18;
        
        // Stake first
        vm.startPrank(user);
        token.approve(address(staking), stakeAmount);
        staking.stake(stakeAmount);
        vm.stopPrank();
        
        // Record focus session
        vm.prank(owner);
        staking.recordFocusSession(user, 60); // 60 minutes
        
        // Check individual fields
        (uint256 stakedAmount, uint256 lastFocusSession, uint256 totalFocusMinutes) = staking.stakers(user);
        assertEq(totalFocusMinutes, 60);
    }

    function testDistributeReward() public {
        uint256 stakeAmount = 1000 * 10**18;
        uint256 rewardAmount = 100 * 10**18;
        
        // Stake first
        vm.startPrank(user);
        token.approve(address(staking), stakeAmount);
        staking.stake(stakeAmount);
        vm.stopPrank();
        
        // Distribute reward
        vm.prank(owner);
        token.mint(address(staking), rewardAmount, "Reward pool");
        
        vm.prank(owner);
        staking.distributeReward(user, rewardAmount);
        
        // User started with 10,000, staked 1,000, received 100 reward
        // Final balance: 10,000 - 1,000 + 100 = 9,100
        assertEq(token.balanceOf(user), 9100 * 10**18);
    }

    function testMinimumStake() public {
        uint256 belowMinimum = 50 * 10**18; // Below 100 FOCUS minimum
        
        vm.startPrank(user);
        token.approve(address(staking), belowMinimum);
        vm.expectRevert("Below minimum stake");
        staking.stake(belowMinimum);
        vm.stopPrank();
    }

    function testOnlyOwnerCanRecordSession() public {
        uint256 stakeAmount = 1000 * 10**18;
        
        // Stake first
        vm.startPrank(user);
        token.approve(address(staking), stakeAmount);
        staking.stake(stakeAmount);
        vm.stopPrank();
        
        // Try to record session as non-owner
        vm.prank(user);
        vm.expectRevert();
        staking.recordFocusSession(user, 60);
    }
} 