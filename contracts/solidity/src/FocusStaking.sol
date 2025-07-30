// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title FocusStaking
 * @dev Staking contract for FOCUS tokens with focus-based rewards
 * - Only OPERATOR_ROLE can record focus sessions
 * - Owner can grant/revoke operator role
 */
contract FocusStaking is Ownable, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Structs
    struct Staker {
        uint256 stakedAmount;
        uint256 rewardDebt;
        uint256 lastFocusSession;
        uint256 totalFocusMinutes;
        uint256 totalRewardsEarned;
        uint256 lastRewardCalculation;
    }
    
    struct StakingPool {
        uint256 totalStaked;
        uint256 rewardPerToken;
        uint256 lastUpdateTime;
        uint256 rewardRate;
    }
    
    // State variables
    IERC20 public immutable focusToken;
    StakingPool public stakingPool;
    
    mapping(address => Staker) public stakers;
    mapping(address => bool) public authorizedOperators;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event FocusSessionRecorded(address indexed user, uint256 sessionMinutes, uint256 rewards);
    event OperatorAuthorized(address indexed operator, bool authorized);
    
    // Constants
    uint256 public constant MINIMUM_STAKE = 100 * 10**18; // 100 FOCUS tokens
    uint256 public constant REWARD_PER_MINUTE = 10**15; // 0.001 FOCUS per minute of focus
    uint256 public constant MAX_FOCUS_SESSION = 480; // 8 hours max per session
    
    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier updateRewards(address user) {
        _updateRewards(user);
        _;
    }
    
    constructor(address _focusToken) Ownable(msg.sender) {
        focusToken = IERC20(_focusToken);
        stakingPool.rewardRate = REWARD_PER_MINUTE;
        stakingPool.lastUpdateTime = block.timestamp;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Stake FOCUS tokens
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant updateRewards(msg.sender) {
        require(amount >= MINIMUM_STAKE, "Below minimum stake");
        require(amount > 0, "Cannot stake 0");
        
        Staker storage staker = stakers[msg.sender];
        
        focusToken.safeTransferFrom(msg.sender, address(this), amount);
        
        staker.stakedAmount += amount;
        stakingPool.totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake FOCUS tokens
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant updateRewards(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        
        Staker storage staker = stakers[msg.sender];
        require(staker.stakedAmount >= amount, "Insufficient staked amount");
        
        staker.stakedAmount -= amount;
        stakingPool.totalStaked -= amount;
        
        focusToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant updateRewards(msg.sender) {
        Staker storage staker = stakers[msg.sender];
        uint256 pendingRewards = _calculatePendingRewards(msg.sender);
        
        require(pendingRewards > 0, "No rewards to claim");
        
        staker.rewardDebt = staker.stakedAmount * stakingPool.rewardPerToken / 1e18;
        staker.totalRewardsEarned += pendingRewards;
        
        focusToken.safeTransfer(msg.sender, pendingRewards);
        
        emit RewardsClaimed(msg.sender, pendingRewards);
    }
    
    /**
     * @dev Record focus session and calculate rewards (only OPERATOR_ROLE)
     * @param user Address of the user
     * @param sessionMinutes Duration of focus session in minutes
     */
    function recordFocusSession(address user, uint256 sessionMinutes) external onlyRole(OPERATOR_ROLE) updateRewards(user) {
        require(sessionMinutes > 0 && sessionMinutes <= MAX_FOCUS_SESSION, "Invalid session duration");
        require(user != address(0), "Invalid user address");
        
        Staker storage staker = stakers[user];
        require(staker.stakedAmount > 0, "User not staking");
        
        uint256 sessionRewards = sessionMinutes * REWARD_PER_MINUTE;
        
        staker.lastFocusSession = block.timestamp;
        staker.totalFocusMinutes += sessionMinutes;
        
        // Add session rewards to the pool
        if (stakingPool.totalStaked > 0) {
            stakingPool.rewardPerToken += (sessionRewards * 1e18) / stakingPool.totalStaked;
        }
        
        emit FocusSessionRecorded(user, sessionMinutes, sessionRewards);
    }
    
    /**
     * @dev Authorize or revoke operator permissions
     * @param operator Address to authorize/revoke
     * @param authorized Whether to authorize or revoke
     */
    function setOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
        emit OperatorAuthorized(operator, authorized);
    }
    
    /**
     * @dev Grant OPERATOR_ROLE (only owner)
     */
    function grantOperator(address account) external onlyOwner {
        _grantRole(OPERATOR_ROLE, account);
    }
    /**
     * @dev Revoke OPERATOR_ROLE (only owner)
     */
    function revokeOperator(address account) external onlyOwner {
        _revokeRole(OPERATOR_ROLE, account);
    }
    
    /**
     * @dev Get staker information
     * @param user Address of the staker
     */
    function getStakerInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 totalRewardsEarned,
        uint256 totalFocusMinutes,
        uint256 lastFocusSession
    ) {
        Staker storage staker = stakers[user];
        return (
            staker.stakedAmount,
            _calculatePendingRewards(user),
            staker.totalRewardsEarned,
            staker.totalFocusMinutes,
            staker.lastFocusSession
        );
    }
    
    /**
     * @dev Get pool information
     */
    function getPoolInfo() external view returns (
        uint256 totalStaked,
        uint256 rewardPerToken,
        uint256 rewardRate
    ) {
        return (
            stakingPool.totalStaked,
            stakingPool.rewardPerToken,
            stakingPool.rewardRate
        );
    }
    
    /**
     * @dev Calculate pending rewards for a user
     * @param user Address of the user
     */
    function _calculatePendingRewards(address user) internal view returns (uint256) {
        Staker storage staker = stakers[user];
        if (staker.stakedAmount == 0) return 0;
        
        uint256 currentRewardPerToken = stakingPool.rewardPerToken;
        uint256 userRewardDebt = staker.rewardDebt;
        
        return (staker.stakedAmount * currentRewardPerToken / 1e18) - userRewardDebt;
    }
    
    /**
     * @dev Update rewards for a user
     * @param user Address of the user
     */
    function _updateRewards(address user) internal {
        Staker storage staker = stakers[user];
        if (staker.stakedAmount > 0) {
            staker.rewardDebt = staker.stakedAmount * stakingPool.rewardPerToken / 1e18;
        }
    }
    
    /**
     * @dev Emergency withdraw function for owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = focusToken.balanceOf(address(this));
        if (balance > 0) {
            focusToken.safeTransfer(owner(), balance);
        }
    }
} 