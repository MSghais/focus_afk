// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FocusSBT
 * @dev Soulbound NFT representing focus achievements and progress
 * Features:
 * - Non-transferable (Soulbound)
 * - Dynamic metadata based on focus stats
 * - AI mentor feedback integration
 * - Achievement levels and badges
 */
contract FocusSBT is ERC721, ERC721URIStorage, Ownable {
    using Base64 for bytes;
    
    // Structs
    struct FocusStats {
        uint256 totalMinutes;
        uint256 streakDays;
        uint256 completedQuests;
        uint256 lastSession;
        uint256 level;
        string aiFeedbackHash;
        uint256 achievements;
        uint256 totalSessions;
    }
    
    struct Achievement {
        string name;
        string description;
        uint256 requirement;
        bool unlocked;
        uint256 unlockedAt;
    }
    
    // State variables
    mapping(address => FocusStats) public focusStats;
    mapping(address => mapping(uint256 => Achievement)) public achievements;
    mapping(address => uint256) public achievementCount;
    
    uint256 private _tokenIdCounter;
    mapping(address => uint256) public userTokenId;
    
    // Events
    event FocusSessionCompleted(
        address indexed user,
        uint256 sessionMinutes,
        uint256 newStreak,
        uint256 newLevel,
        string aiFeedbackHash
    );
    
    event AchievementUnlocked(
        address indexed user,
        string achievementName,
        uint256 requirement
    );
    
    event LevelUp(
        address indexed user,
        uint256 oldLevel,
        uint256 newLevel
    );
    
    // Constants
    uint256 public constant MINUTES_PER_LEVEL = 60; // 1 hour per level
    uint256 public constant MAX_LEVEL = 100;
    
    // Achievement definitions
    string[] public achievementNames = [
        "First Focus",
        "Streak Master",
        "Quest Champion",
        "Focus Legend",
        "AI Mentor Favorite"
    ];
    
    string[] public achievementDescriptions = [
        "Complete your first focus session",
        "Maintain a 7-day focus streak",
        "Complete 10 quests",
        "Reach level 50",
        "Receive AI mentor feedback"
    ];
    
    uint256[] public achievementRequirements = [1, 7, 10, 50, 1];
    
    constructor() ERC721("Focus AFK Soulbound", "FOCUS-SBT") Ownable(msg.sender) {}
    
    /**
     * @dev Update focus record and mint/update SBT
     * @param user Address of the user
     * @param sessionMinutes Focus session duration
     * @param streak Current streak days
     * @param aiFeedbackHash IPFS hash of AI feedback
     */
    function updateFocusRecord(
        address user,
        uint256 sessionMinutes,
        uint256 streak,
        string memory aiFeedbackHash
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        FocusStats storage stats = focusStats[user];
        uint256 oldLevel = stats.level;
        
        // Update stats
        stats.totalMinutes += sessionMinutes;
        stats.streakDays = streak;
        stats.completedQuests += 1;
        stats.lastSession = block.timestamp;
        stats.totalSessions += 1;
        stats.aiFeedbackHash = aiFeedbackHash;
        
        // Calculate new level
        uint256 newLevel = Math.min(stats.totalMinutes / MINUTES_PER_LEVEL, MAX_LEVEL);
        stats.level = newLevel;
        
        // Mint SBT if user doesn't have one
        if (userTokenId[user] == 0) {
            _mintSBT(user);
        }
        
        // Check for achievements
        _checkAchievements(user);
        
        // Update token URI with new metadata
        _updateTokenURI(user);
        
        emit FocusSessionCompleted(user, sessionMinutes, streak, newLevel, aiFeedbackHash);
        
        if (newLevel > oldLevel) {
            emit LevelUp(user, oldLevel, newLevel);
        }
    }
    
    /**
     * @dev Mint SBT for a user
     * @param user Address of the user
     */
    function _mintSBT(address user) internal {
        uint256 tokenId = _tokenIdCounter++;
        _mint(user, tokenId);
        userTokenId[user] = tokenId;
    }
    
    /**
     * @dev Check and unlock achievements
     * @param user Address of the user
     */
    function _checkAchievements(address user) internal {
        FocusStats storage stats = focusStats[user];
        
        for (uint256 i = 0; i < achievementNames.length; i++) {
            if (!achievements[user][i].unlocked) {
                bool shouldUnlock = false;
                
                if (i == 0) shouldUnlock = stats.totalSessions >= achievementRequirements[i];
                else if (i == 1) shouldUnlock = stats.streakDays >= achievementRequirements[i];
                else if (i == 2) shouldUnlock = stats.completedQuests >= achievementRequirements[i];
                else if (i == 3) shouldUnlock = stats.level >= achievementRequirements[i];
                else if (i == 4) shouldUnlock = bytes(stats.aiFeedbackHash).length > 0;
                
                if (shouldUnlock) {
                    achievements[user][i] = Achievement({
                        name: achievementNames[i],
                        description: achievementDescriptions[i],
                        requirement: achievementRequirements[i],
                        unlocked: true,
                        unlockedAt: block.timestamp
                    });
                    
                    stats.achievements += 1;
                    emit AchievementUnlocked(user, achievementNames[i], achievementRequirements[i]);
                }
            }
        }
    }
    
    /**
     * @dev Update token URI with current metadata
     * @param user Address of the user
     */
    function _updateTokenURI(address user) internal {
        uint256 tokenId = userTokenId[user];
        if (tokenId == 0) return;
        
        string memory metadata = _generateMetadata(user);
        _setTokenURI(tokenId, metadata);
    }
    
    /**
     * @dev Generate metadata JSON for the SBT
     * @param user Address of the user
     */
    function _generateMetadata(address user) internal view returns (string memory) {
        FocusStats storage stats = focusStats[user];
        
        string memory attributes = "[";
        attributes = string(abi.encodePacked(attributes, 
            '{"trait_type":"Level","value":"', _uint2str(stats.level), '"},',
            '{"trait_type":"Total Minutes","value":"', _uint2str(stats.totalMinutes), '"},',
            '{"trait_type":"Streak Days","value":"', _uint2str(stats.streakDays), '"},',
            '{"trait_type":"Completed Quests","value":"', _uint2str(stats.completedQuests), '"},',
            '{"trait_type":"Achievements","value":"', _uint2str(stats.achievements), '"},',
            '{"trait_type":"Total Sessions","value":"', _uint2str(stats.totalSessions), '"}'
        ));
        attributes = string(abi.encodePacked(attributes, "]"));
        
        string memory json = string(abi.encodePacked(
            '{"name":"Focus AFK Soulbound #', _uint2str(userTokenId[user]), '",',
            '"description":"Soulbound NFT representing focus achievements and progress",',
            '"image":"data:image/svg+xml;base64,', _generateSVG(user), '",',
            '"attributes":', attributes, '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }
    
    /**
     * @dev Generate SVG image for the SBT
     * @param user Address of the user
     */
    function _generateSVG(address user) internal view returns (string memory) {
        FocusStats storage stats = focusStats[user];
        
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#1a1a1a"/>',
            '<circle cx="200" cy="200" r="150" fill="none" stroke="#4CAF50" stroke-width="8"/>',
            '<circle cx="200" cy="200" r="150" fill="none" stroke="#2E7D32" stroke-width="8" stroke-dasharray="', 
            _uint2str((stats.totalMinutes % MINUTES_PER_LEVEL) * 942 / MINUTES_PER_LEVEL), ' 942"/>',
            '<text x="200" y="180" text-anchor="middle" fill="#ffffff" font-size="24" font-family="Arial">Level ', _uint2str(stats.level), '</text>',
            '<text x="200" y="220" text-anchor="middle" fill="#4CAF50" font-size="16" font-family="Arial">', _uint2str(stats.totalMinutes), ' min</text>',
            '<text x="200" y="240" text-anchor="middle" fill="#4CAF50" font-size="14" font-family="Arial">', _uint2str(stats.streakDays), ' day streak</text>',
            '</svg>'
        ));
        
        return svg.encode();
    }
    
    /**
     * @dev Convert uint to string
     * @param value Value to convert
     */
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    /**
     * @dev Override transfer functions to make token soulbound
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721URIStorage) {
        require(from == address(0) || to == address(0), "Soulbound: transfer not allowed");
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
    
    /**
     * @dev Override tokenURI to use our custom metadata
     */
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override supportsInterface for AccessControl compatibility
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Get user's focus stats
     * @param user Address of the user
     */
    function getUserStats(address user) external view returns (FocusStats memory) {
        return focusStats[user];
    }
    
    /**
     * @dev Get user's achievements
     * @param user Address of the user
     */
    function getUserAchievements(address user) external view returns (Achievement[] memory) {
        Achievement[] memory userAchievements = new Achievement[](achievementNames.length);
        for (uint256 i = 0; i < achievementNames.length; i++) {
            userAchievements[i] = achievements[user][i];
        }
        return userAchievements;
    }
    
    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}