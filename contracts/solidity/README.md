# Focus AFK Smart Contracts

MVP smart contracts for the Focus AFK platform - a gamified focus and productivity app.

## 📋 Contract Overview

### 1. **FocusToken** (`src/FocusToken.sol`)
- **ERC20 token** for the Focus AFK platform
- **Initial supply**: 1M FOCUS tokens
- **Max supply**: 10M FOCUS tokens
- **Features**: Mintable by owner, burnable by holders
- **Use case**: Rewards, staking, platform governance

### 2. **FocusStaking** (`src/FocusStaking.sol`)
- **Staking contract** for FOCUS tokens
- **Minimum stake**: 100 FOCUS tokens
- **Features**: Stake/unstake, focus session recording, manual reward distribution
- **Use case**: Users stake tokens to earn rewards for focus sessions

### 3. **QuestNFT** (`src/QuestNft.sol`)
- **ERC721 NFT** for quest badges
- **Features**: Mint quests, complete quests, static metadata
- **Use case**: Gamification through quest completion

### 4. **FocusSBT** (`src/FocusSBT.sol`)
- **Soulbound NFT** (non-transferable) for achievements
- **Features**: Tracks focus stats, levels, automatic minting
- **Use case**: Permanent achievement records linked to user wallets

## 🚀 Quick Deployment

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Private key for deployment
- RPC URL for target network

### 1. Setup Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your private key and RPC URLs
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 2. Deploy Contracts
```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to local network (Anvil)
./deploy.sh anvil

# Deploy to testnet (Sepolia)
./deploy.sh sepolia

# Deploy to mainnet (with confirmation)
./deploy.sh mainnet
```

## 🧪 Testing

Run the complete test suite:
```bash
forge test
```

Run specific test files:
```bash
forge test --match-contract FocusTokenTest
forge test --match-contract FocusStakingTest
forge test --match-contract QuestNFTTest
forge test --match-contract FocusSBTTest
```

## 📊 Gas Usage

| Contract | Deployment | Key Functions |
|----------|------------|---------------|
| FocusToken | ~500k gas | mint: ~50k, mintFocusReward: ~60k |
| FocusStaking | ~800k gas | stake: ~80k, unstake: ~60k |
| QuestNFT | ~600k gas | mintQuest: ~100k, completeQuest: ~50k |
| FocusSBT | ~700k gas | updateFocusRecord: ~120k |

## 🔧 Contract Functions

### FocusToken
```solidity
// Mint tokens (owner only)
function mint(address to, uint256 amount, string memory reason) external

// Mint focus session rewards (owner only)
function mintFocusReward(address user, uint256 sessionMinutes, uint256 streak) external
```

### FocusStaking
```solidity
// Stake tokens
function stake(uint256 amount) external

// Unstake tokens
function unstake(uint256 amount) external

// Record focus session (owner only)
function recordFocusSession(address user, uint256 sessionMinutes) external

// Distribute rewards (owner only)
function distributeReward(address user, uint256 amount) external
```

### QuestNFT
```solidity
// Mint quest (owner only)
function mintQuest(address to, string memory name, string memory description, uint256 xpReward) external

// Complete quest (owner only)
function completeQuest(uint256 tokenId) external

// Update base URI (owner only)
function setBaseURI(string memory _baseTokenURI) external
```

### FocusSBT
```solidity
// Update focus record and mint SBT (owner only)
function updateFocusRecord(address user, uint256 sessionMinutes, uint256 streak) external

// Get user stats
function getUserStats(address user) external view returns (FocusStats memory)

// Update base URI (owner only)
function setBaseURI(string memory _baseTokenURI) external
```

## 🔒 Security Features

- **Access Control**: All admin functions restricted to contract owner
- **Soulbound NFTs**: FocusSBT tokens are non-transferable
- **Input Validation**: Comprehensive checks for all parameters
- **Reentrancy Protection**: SafeERC20 and nonReentrant modifiers
- **Gas Optimization**: Minimal storage operations for MVP

## 📝 Integration Guide

### Frontend Integration
1. **Get contract addresses** from `deployment.env` after deployment
2. **Use Web3.js or Ethers.js** to interact with contracts
3. **Handle events** for real-time updates
4. **Implement error handling** for failed transactions

### Backend Integration
1. **Monitor events** for focus sessions and quest completions
2. **Calculate rewards** based on session data
3. **Update metadata** for NFTs
4. **Handle user authentication** and wallet connections

## 🆘 Support

- **Documentation**: See `DEPLOYMENT.md` for detailed deployment instructions
- **Testing**: All contracts have comprehensive test coverage
- **Issues**: Check the test files for usage examples
- **Foundry Book**: [https://book.getfoundry.sh/](https://book.getfoundry.sh/)

## 📄 License

MIT License - see LICENSE file for details.
