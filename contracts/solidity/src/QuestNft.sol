// contracts/solidity/src/QuestNFT.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QuestNFT is ERC721, Ownable {
    struct Quest {
        string name;
        string description;
        uint256 difficulty;
        uint256 xpReward;
        bool isCompleted;
        uint256 completedAt;
        string aiMentorFeedback;
    }
    
    mapping(uint256 => Quest) public quests;
    uint256 private _tokenIdCounter;
    
    event QuestCompleted(
        uint256 indexed tokenId,
        address indexed user,
        uint256 xpReward
    );
    
    constructor() ERC721("Focus AFK Quests", "FAFQ") Ownable(msg.sender) {}
    
    function mintQuest(
        address to,
        string memory name,
        string memory description,
        uint256 difficulty,
        uint256 xpReward
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        
        quests[tokenId] = Quest({
            name: name,
            description: description,
            difficulty: difficulty,
            xpReward: xpReward,
            isCompleted: false,
            completedAt: 0,
            aiMentorFeedback: ""
        });
        
        return tokenId;
    }
    
    function completeQuest(
        uint256 tokenId,
        string memory aiFeedback
    ) external onlyOwner {
        require(_exists(tokenId), "Quest does not exist");
        require(!quests[tokenId].isCompleted, "Quest already completed");
        
        quests[tokenId].isCompleted = true;
        quests[tokenId].completedAt = block.timestamp;
        quests[tokenId].aiMentorFeedback = aiFeedback;
        
        emit QuestCompleted(tokenId, ownerOf(tokenId), quests[tokenId].xpReward);
    }
}
