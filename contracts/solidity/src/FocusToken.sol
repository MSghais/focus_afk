// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title FocusToken
 * @dev ERC20 token for the Focus AFK platform
 * Features:
 * - Mintable by MINTER_ROLE
 * - Burnable by token holders
 * - Permit functionality for gasless approvals
 * - Used for rewards, staking, and platform governance
 */
contract FocusToken is ERC20, ERC20Burnable, Ownable, AccessControl, ERC20Permit {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10 million tokens cap
    
    constructor() 
        ERC20("Focus AFK Token", "FOCUS") 
        Ownable(msg.sender)
        ERC20Permit("Focus AFK Token")
    {
        _mint(msg.sender, INITIAL_SUPPLY);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint new tokens (only MINTER_ROLE)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param reason Reason for minting (for tracking)
     */
    function mint(address to, uint256 amount, string memory reason) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(to != address(0), "Cannot mint to zero address");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Mint tokens for focus session completion (only MINTER_ROLE)
     * @param user Address of the user
     * @param sessionMinutes Focus session duration in minutes
     * @param streak Current streak days
     */
    function mintFocusReward(address user, uint256 sessionMinutes, uint256 streak) external onlyRole(MINTER_ROLE) {
        require(user != address(0), "Invalid user address");
        
        // Calculate reward based on session duration and streak
        uint256 baseReward = sessionMinutes * 10**16; // 0.01 tokens per minute
        uint256 streakBonus = streak * 10**16; // 0.01 tokens per streak day
        uint256 totalReward = baseReward + streakBonus;
        
        require(totalSupply() + totalReward <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(user, totalReward);
        emit TokensMinted(user, totalReward, "Focus Session Reward");
    }
    
    /**
     * @dev Burn tokens with reason
     * @param amount Amount of tokens to burn
     * @param reason Reason for burning
     */
    function burnWithReason(uint256 amount, string memory reason) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, reason);
    }
    
    /**
     * @dev Grant MINTER_ROLE (only owner)
     */
    function grantMinter(address account) external onlyOwner {
        _grantRole(MINTER_ROLE, account);
    }
    /**
     * @dev Revoke MINTER_ROLE (only owner)
     */
    function revokeMinter(address account) external onlyOwner {
        _revokeRole(MINTER_ROLE, account);
    }
    /**
     * @dev Get token info
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint256 totalSupply_,
        uint256 maxSupply,
        uint256 decimals_
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            MAX_SUPPLY,
            decimals()
        );
    }
} 