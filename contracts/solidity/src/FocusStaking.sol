// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FocusStaking (MVP)
 * @dev Minimal staking contract for FOCUS tokens
 */
contract FocusStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Staker {
        uint256 stakedAmount;
        uint256 lastFocusSession;
        uint256 totalFocusMinutes;
    }

    IERC20 public immutable focusToken;
    mapping(address => Staker) public stakers;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event FocusSessionRecorded(address indexed user, uint256 sessionMinutes);
    event RewardDistributed(address indexed user, uint256 amount);

    uint256 public constant MINIMUM_STAKE = 100 * 10**18;
    uint256 public constant MAX_FOCUS_SESSION = 480;

    constructor(address _focusToken) Ownable(msg.sender) {
        focusToken = IERC20(_focusToken);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount >= MINIMUM_STAKE, "Below minimum stake");
        require(amount > 0, "Cannot stake 0");
        Staker storage staker = stakers[msg.sender];
        focusToken.safeTransferFrom(msg.sender, address(this), amount);
        staker.stakedAmount += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0");
        Staker storage staker = stakers[msg.sender];
        require(staker.stakedAmount >= amount, "Insufficient staked amount");
        staker.stakedAmount -= amount;
        totalStaked -= amount;
        focusToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function recordFocusSession(address user, uint256 sessionMinutes) external onlyOwner {
        require(sessionMinutes > 0 && sessionMinutes <= MAX_FOCUS_SESSION, "Invalid session duration");
        require(user != address(0), "Invalid user address");
        Staker storage staker = stakers[user];
        require(staker.stakedAmount > 0, "User not staking");
        staker.lastFocusSession = block.timestamp;
        staker.totalFocusMinutes += sessionMinutes;
        emit FocusSessionRecorded(user, sessionMinutes);
    }

    function distributeReward(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Zero reward");
        require(stakers[user].stakedAmount > 0, "User not staking");
        focusToken.safeTransfer(user, amount);
        emit RewardDistributed(user, amount);
    }

    function stakedBalance(address user) external view returns (uint256) {
        return stakers[user].stakedAmount;
    }
} 