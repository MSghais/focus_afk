// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuestNFT (MVP)
 * @dev Minimal NFT Quest Badge for MVP
 */
contract QuestNFT is ERC721, Ownable {
    struct Quest {
        string name;
        string description;
        uint256 xpReward;
        bool isCompleted;
        uint256 completedAt;
    }

    mapping(uint256 => Quest) public quests;
    uint256 private _tokenIdCounter;
    string public baseTokenURI;

    event QuestMinted(uint256 indexed tokenId, address indexed user, string name);
    event QuestCompleted(uint256 indexed tokenId, address indexed user, uint256 xpReward);

    constructor(string memory _baseTokenURI) ERC721("Focus AFK Quest Badges", "FAFQ") Ownable(msg.sender) {
        baseTokenURI = _baseTokenURI;
    }

    function mintQuest(address to, string memory name, string memory description, uint256 xpReward) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient address");
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        quests[tokenId] = Quest({
            name: name,
            description: description,
            xpReward: xpReward,
            isCompleted: false,
            completedAt: 0
        });
        emit QuestMinted(tokenId, to, name);
        return tokenId;
    }

    function completeQuest(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Quest does not exist");
        Quest storage quest = quests[tokenId];
        require(!quest.isCompleted, "Quest already completed");
        quest.isCompleted = true;
        quest.completedAt = block.timestamp;
        emit QuestCompleted(tokenId, ownerOf(tokenId), quest.xpReward);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }
}
