// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title QuestNFT
 * @dev NFT Quest Badge representing completed quests and achievements
 * Features:
 * - Dynamic metadata based on quest completion
 * - AI mentor feedback integration
 * - Difficulty levels and XP rewards
 * - Quest categories and rarity
 */
contract QuestNFT is ERC721, ERC721URIStorage, Ownable {
    using Base64 for bytes;
    
    // Structs
    struct Quest {
        string name;
        string description;
        uint256 difficulty;
        uint256 xpReward;
        bool isCompleted;
        uint256 completedAt;
        string aiMentorFeedback;
        QuestCategory category;
        QuestRarity rarity;
        uint256 timeLimit;
        uint256 createdAt;
    }
    
    enum QuestCategory {
        Focus,
        Learning,
        Productivity,
        Wellness,
        Social,
        Creative
    }
    
    enum QuestRarity {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }
    
    // State variables
    mapping(uint256 => Quest) public quests;
    mapping(address => uint256[]) public userQuests;
    mapping(address => uint256) public userQuestCount;
    
    uint256 private _tokenIdCounter;
    
    // Events
    event QuestMinted(
        uint256 indexed tokenId,
        address indexed user,
        string name,
        QuestCategory category,
        QuestRarity rarity
    );
    
    event QuestCompleted(
        uint256 indexed tokenId,
        address indexed user,
        uint256 xpReward,
        string aiFeedback
    );
    
    event QuestExpired(
        uint256 indexed tokenId,
        address indexed user
    );
    
    // Constants
    uint256 public constant MAX_QUESTS_PER_USER = 50;
    uint256 public constant DEFAULT_TIME_LIMIT = 7 days;
    
    // Rarity multipliers for XP rewards
    mapping(QuestRarity => uint256) public rarityMultipliers;
    
    constructor() ERC721("Focus AFK Quest Badges", "FAFQ") Ownable(msg.sender) {
        rarityMultipliers[QuestRarity.Common] = 1;
        rarityMultipliers[QuestRarity.Uncommon] = 2;
        rarityMultipliers[QuestRarity.Rare] = 5;
        rarityMultipliers[QuestRarity.Epic] = 10;
        rarityMultipliers[QuestRarity.Legendary] = 25;
    }
    
    /**
     * @dev Mint a new quest NFT
     * @param to Address to mint the quest to
     * @param name Quest name
     * @param description Quest description
     * @param difficulty Quest difficulty (1-10)
     * @param baseXpReward Base XP reward
     * @param category Quest category
     * @param rarity Quest rarity
     * @param timeLimit Time limit for completion (0 for no limit)
     */
    function mintQuest(
        address to,
        string memory name,
        string memory description,
        uint256 difficulty,
        uint256 baseXpReward,
        QuestCategory category,
        QuestRarity rarity,
        uint256 timeLimit
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient address");
        require(difficulty >= 1 && difficulty <= 10, "Invalid difficulty");
        require(userQuestCount[to] < MAX_QUESTS_PER_USER, "Too many quests");
        
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        
        uint256 xpReward = baseXpReward * rarityMultipliers[rarity];
        
        quests[tokenId] = Quest({
            name: name,
            description: description,
            difficulty: difficulty,
            xpReward: xpReward,
            isCompleted: false,
            completedAt: 0,
            aiMentorFeedback: "",
            category: category,
            rarity: rarity,
            timeLimit: timeLimit == 0 ? DEFAULT_TIME_LIMIT : timeLimit,
            createdAt: block.timestamp
        });
        
        userQuests[to].push(tokenId);
        userQuestCount[to]++;
        
        // Set initial metadata
        _setTokenURI(tokenId, _generateMetadata(tokenId));
        
        emit QuestMinted(tokenId, to, name, category, rarity);
        
        return tokenId;
    }
    
    /**
     * @dev Complete a quest
     * @param tokenId Quest token ID
     * @param aiFeedback AI mentor feedback
     */
    function completeQuest(
        uint256 tokenId,
        string memory aiFeedback
    ) external onlyOwner {
        require(_exists(tokenId), "Quest does not exist");
        require(!quests[tokenId].isCompleted, "Quest already completed");
        require(!_isQuestExpired(tokenId), "Quest has expired");
        
        Quest storage quest = quests[tokenId];
        quest.isCompleted = true;
        quest.completedAt = block.timestamp;
        quest.aiMentorFeedback = aiFeedback;
        
        // Update metadata
        _setTokenURI(tokenId, _generateMetadata(tokenId));
        
        emit QuestCompleted(tokenId, ownerOf(tokenId), quest.xpReward, aiFeedback);
    }
    
    /**
     * @dev Check if quest is expired
     * @param tokenId Quest token ID
     */
    function _isQuestExpired(uint256 tokenId) internal view returns (bool) {
        Quest storage quest = quests[tokenId];
        return quest.timeLimit > 0 && 
               block.timestamp > quest.createdAt + quest.timeLimit;
    }
    
    /**
     * @dev Generate metadata JSON for the quest NFT
     * @param tokenId Quest token ID
     */
    function _generateMetadata(uint256 tokenId) internal view returns (string memory) {
        Quest storage quest = quests[tokenId];
        
        string memory status = quest.isCompleted ? "Completed" : 
                              _isQuestExpired(tokenId) ? "Expired" : "Active";
        
        string memory categoryName = _getCategoryName(quest.category);
        string memory rarityName = _getRarityName(quest.rarity);
        
        string memory attributes = string(abi.encodePacked(
            '[{"trait_type":"Status","value":"', status, '"},',
            '{"trait_type":"Difficulty","value":"', _uint2str(quest.difficulty), '"},',
            '{"trait_type":"XP Reward","value":"', _uint2str(quest.xpReward), '"},',
            '{"trait_type":"Category","value":"', categoryName, '"},',
            '{"trait_type":"Rarity","value":"', rarityName, '"},',
            '{"trait_type":"Time Limit","value":"', _uint2str(quest.timeLimit / 1 days), ' days"}'
        ));
        
        if (quest.isCompleted) {
            attributes = string(abi.encodePacked(
                attributes, ',{"trait_type":"Completed At","value":"', _uint2str(quest.completedAt), '"}'
            ));
        }
        
        attributes = string(abi.encodePacked(attributes, ']'));
        
        string memory description = quest.isCompleted ? 
            string(abi.encodePacked("Completed quest: ", quest.description)) :
            string(abi.encodePacked("Active quest: ", quest.description));
        
        string memory json = string(abi.encodePacked(
            '{"name":"', quest.name, ' #', _uint2str(tokenId), '",',
            '"description":"', description, '",',
            '"image":"data:image/svg+xml;base64,', _generateQuestSVG(tokenId), '",',
            '"attributes":', attributes, '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            json.encode()
        ));
    }
    
    /**
     * @dev Generate SVG image for the quest NFT
     * @param tokenId Quest token ID
     */
    function _generateQuestSVG(uint256 tokenId) internal view returns (string memory) {
        Quest storage quest = quests[tokenId];
        
        string memory statusColor = quest.isCompleted ? "#4CAF50" : 
                                   _isQuestExpired(tokenId) ? "#F44336" : "#2196F3";
        
        string memory rarityColor = _getRarityColor(quest.rarity);
        
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#1a1a1a"/>',
            '<rect x="50" y="50" width="300" height="300" rx="20" fill="', rarityColor, '" opacity="0.3"/>',
            '<circle cx="200" cy="150" r="60" fill="', statusColor, '"/>',
            '<text x="200" y="160" text-anchor="middle" fill="#ffffff" font-size="40" font-family="Arial">Q</text>',
            '<text x="200" y="220" text-anchor="middle" fill="#ffffff" font-size="16" font-family="Arial">', quest.name, '</text>',
            '<text x="200" y="240" text-anchor="middle" fill="#4CAF50" font-size="14" font-family="Arial">', _uint2str(quest.xpReward), ' XP</text>',
            '<text x="200" y="260" text-anchor="middle" fill="#FFC107" font-size="12" font-family="Arial">', _getRarityName(quest.rarity), '</text>',
            '<text x="200" y="280" text-anchor="middle" fill="#9E9E9E" font-size="12" font-family="Arial">', _getCategoryName(quest.category), '</text>',
            '</svg>'
        ));
        
        return svg.encode();
    }
    
    /**
     * @dev Get category name
     * @param category Quest category
     */
    function _getCategoryName(QuestCategory category) internal pure returns (string memory) {
        if (category == QuestCategory.Focus) return "Focus";
        if (category == QuestCategory.Learning) return "Learning";
        if (category == QuestCategory.Productivity) return "Productivity";
        if (category == QuestCategory.Wellness) return "Wellness";
        if (category == QuestCategory.Social) return "Social";
        if (category == QuestCategory.Creative) return "Creative";
        return "Unknown";
    }
    
    /**
     * @dev Get rarity name
     * @param rarity Quest rarity
     */
    function _getRarityName(QuestRarity rarity) internal pure returns (string memory) {
        if (rarity == QuestRarity.Common) return "Common";
        if (rarity == QuestRarity.Uncommon) return "Uncommon";
        if (rarity == QuestRarity.Rare) return "Rare";
        if (rarity == QuestRarity.Epic) return "Epic";
        if (rarity == QuestRarity.Legendary) return "Legendary";
        return "Unknown";
    }
    
    /**
     * @dev Get rarity color
     * @param rarity Quest rarity
     */
    function _getRarityColor(QuestRarity rarity) internal pure returns (string memory) {
        if (rarity == QuestRarity.Common) return "#9E9E9E";
        if (rarity == QuestRarity.Uncommon) return "#4CAF50";
        if (rarity == QuestRarity.Rare) return "#2196F3";
        if (rarity == QuestRarity.Epic) return "#9C27B0";
        if (rarity == QuestRarity.Legendary) return "#FF9800";
        return "#9E9E9E";
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
     * @dev Get user's quests
     * @param user Address of the user
     */
    function getUserQuests(address user) external view returns (uint256[] memory) {
        return userQuests[user];
    }
    
    /**
     * @dev Get quest details
     * @param tokenId Quest token ID
     */
    function getQuestDetails(uint256 tokenId) external view returns (Quest memory) {
        require(_exists(tokenId), "Quest does not exist");
        return quests[tokenId];
    }
    
    /**
     * @dev Check if quest is expired
     * @param tokenId Quest token ID
     */
    function isQuestExpired(uint256 tokenId) external view returns (bool) {
        return _isQuestExpired(tokenId);
    }
    
    /**
     * @dev Override tokenURI to use our custom metadata
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Check if token exists
     * @param tokenId Token ID to check
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
