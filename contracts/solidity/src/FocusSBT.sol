// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FocusSBT (MVP)
 * @dev Minimal Soulbound NFT for focus achievements
 */
contract FocusSBT is ERC721, Ownable {
    struct FocusStats {
        uint256 totalMinutes;
        uint256 streakDays;
        uint256 completedQuests;
        uint256 level;
        uint256 lastSession;
    }

    mapping(address => FocusStats) public focusStats;
    mapping(address => uint256) public userTokenId;
    uint256 private _tokenIdCounter;
    string public baseTokenURI;

    event FocusSessionCompleted(address indexed user, uint256 sessionMinutes, uint256 newStreak, uint256 newLevel);
    event LevelUp(address indexed user, uint256 oldLevel, uint256 newLevel);

    uint256 public constant MINUTES_PER_LEVEL = 60; // 1 hour per level
    uint256 public constant MAX_LEVEL = 100;

    constructor(string memory _baseTokenURI) ERC721("Focus AFK Soulbound", "FOCUS-SBT") Ownable(msg.sender) {
        baseTokenURI = _baseTokenURI;
    }

    function updateFocusRecord(
        address user,
        uint256 sessionMinutes,
        uint256 streak
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        FocusStats storage stats = focusStats[user];
        uint256 oldLevel = stats.level;
        
        // Update stats
        stats.totalMinutes += sessionMinutes;
        stats.streakDays = streak;
        stats.completedQuests += 1;
        stats.lastSession = block.timestamp;
        
        // Calculate new level
        uint256 newLevel = stats.totalMinutes / MINUTES_PER_LEVEL;
        if (newLevel > MAX_LEVEL) newLevel = MAX_LEVEL;
        stats.level = newLevel;
        
        // Mint SBT if user doesn't have one
        if (userTokenId[user] == 0) {
            uint256 tokenId = _tokenIdCounter++;
            _mint(user, tokenId);
            userTokenId[user] = tokenId;
        }
        
        emit FocusSessionCompleted(user, sessionMinutes, streak, newLevel);
        
        if (newLevel > oldLevel) {
            emit LevelUp(user, oldLevel, newLevel);
        }
    }

    // Override transfer functions to make token soulbound
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfer not allowed");
        }
        
        return super._update(to, tokenId, auth);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function getUserStats(address user) external view returns (FocusStats memory) {
        return focusStats[user];
    }
}