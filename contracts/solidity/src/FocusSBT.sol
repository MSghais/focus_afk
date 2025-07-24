// contracts/solidity/src/FocusSBT.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FocusSBT is ERC1155, Ownable {
    struct FocusRecord {
        uint256 totalMinutes;
        uint256 streakDays;
        uint256 completedQuests;
        uint256 lastSession;
        string aiFeedbackHash; // IPFS hash of AI mentor feedback
    }
    
    mapping(address => FocusRecord) public focusRecords;
    mapping(address => uint256) public focusLevel;
    
    event FocusSessionCompleted(
        address indexed user,
        uint256 minutes,
        uint256 newStreak,
        string aiFeedbackHash
    );
    
    constructor() ERC1155("") Ownable(msg.sender) {}
    
    function updateFocusRecord(
        address user,
        uint256 minutes,
        uint256 streak,
        string memory aiFeedbackHash
    ) external onlyOwner {
        FocusRecord storage record = focusRecords[user];
        record.totalMinutes += minutes;
        record.streakDays = streak;
        record.completedQuests += 1;
        record.lastSession = block.timestamp;
        record.aiFeedbackHash = aiFeedbackHash;
        
        // Level up logic
        focusLevel[user] = record.totalMinutes / 60; // 1 level per hour
        
        emit FocusSessionCompleted(user, minutes, streak, aiFeedbackHash);
    }
}