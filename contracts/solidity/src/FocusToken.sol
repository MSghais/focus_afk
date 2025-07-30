// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FocusToken (MVP)
 * @dev ERC20 token for the Focus AFK platform
 */
contract FocusToken is ERC20, ERC20Burnable, Ownable {
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10 million tokens cap
    
    constructor() 
        ERC20("Focus AFK Token", "FOCUS") 
        Ownable(msg.sender)
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount, string memory reason) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(to != address(0), "Cannot mint to zero address");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Mint tokens for focus session completion (only owner)
     */
    function mintFocusReward(address user, uint256 sessionMinutes, uint256 streak) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        // Calculate reward based on session duration and streak
        uint256 baseReward = sessionMinutes * 10**16; // 0.01 tokens per minute
        uint256 streakBonus = streak * 10**16; // 0.01 tokens per streak day
        uint256 totalReward = baseReward + streakBonus;
        
        require(totalSupply() + totalReward <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(user, totalReward);
        emit TokensMinted(user, totalReward, "Focus Session Reward");
    }
} 