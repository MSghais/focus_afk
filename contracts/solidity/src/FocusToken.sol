// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FocusToken (MVP with Access Control)
 * @dev ERC20 token for the Focus AFK platform with minter role management
 */
contract FocusToken is ERC20, ERC20Burnable, Ownable, AccessControl {
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event MinterGranted(address indexed minter);
    event MinterRevoked(address indexed minter);
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10 million tokens cap
    
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    constructor() 
        ERC20("Focus AFK Token", "FOCUS") 
        Ownable(msg.sender)
    {
        // Grant minter role to deployer
        _grantRole(MINTER_ROLE, msg.sender);
        // Grant default admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint new tokens (only minter or owner)
     */
    function mint(address to, uint256 amount, string memory reason) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(to != address(0), "Cannot mint to zero address");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Mint tokens for focus session completion (only minter or owner)
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
     * @dev Grant minter role to an address (only admin)
     */
    function grantMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(minter != address(0), "Invalid minter address");
        _grantRole(MINTER_ROLE, minter);
        emit MinterGranted(minter);
    }
    
    /**
     * @dev Revoke minter role from an address (only admin)
     */
    function revokeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(minter != address(0), "Invalid minter address");
        _revokeRole(MINTER_ROLE, minter);
        emit MinterRevoked(minter);
    }
    
    /**
     * @dev Check if an address has minter role
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }
    

} 