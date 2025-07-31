# Gamification System Setup Guide

This guide explains how to set up the QuestNFT integration and token rewards system for the Focus AFK platform.

## Overview

The gamification system integrates:
- **QuestNFT**: NFT badges for quest completion
- **FocusToken**: ERC20 tokens for rewards
- **FocusSBT**: Soulbound tokens for user achievements
- **Quest System**: Dynamic quests with XP and token rewards

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://sepolia.base.org  # or your preferred network
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here

# Contract Addresses (deploy contracts first)
FOCUS_TOKEN_ADDRESS=0x...  # Deployed FocusToken contract
QUEST_NFT_ADDRESS=0x...    # Deployed QuestNFT contract
FOCUS_SBT_ADDRESS=0x...    # Deployed FocusSBT contract
```

## Contract Deployment

1. **Deploy Contracts**:
   ```bash
   cd contracts/solidity
   ./deploy.sh base-sepolia  # or your preferred network
   ```

2. **Update Environment Variables**:
   Copy the deployed addresses from `deployment.env` to your backend `.env` file.

3. **Grant Minter Role**:
   ```bash
   cd contracts/solidity
   ./grant-minter.sh 0xYOUR_BACKEND_ADDRESS
   ```

## Features

### 1. SBT Minting on User Creation
- Automatically mints a Soulbound Token (SBT) for new users
- Runs in background thread to avoid blocking user registration
- Tracks user's focus stats and achievements

### 2. Quest System
- **Daily Quests**: Focus time, task completion
- **Weekly Quests**: Extended focus sessions, goal achievement
- **Special Quests**: Streak milestones with NFT rewards
- **Auto-progression**: Quests update based on user activity

### 3. Token Rewards
- **Focus Sessions**: 0.01 tokens per minute + streak bonus
- **Quest Completion**: XP-based token rewards
- **Badge Milestones**: Additional token rewards

### 4. Badge System
- **Session Badges**: Focus time milestones (5min, 15min, 30min, 1hour)
- **Deep Work Badges**: Deep work session milestones
- **Break Badges**: Restorative break milestones
- **Daily Connection**: Login streak badges

## API Endpoints

### Quests
- `GET /quests/user/:userId` - Get user's quests
- `POST /quests/:id/complete` - Complete a quest
- `POST /quests/generate` - Generate new quests

### Gamification
- `GET /gamification/user/:userId/stats` - Get user stats
- `POST /gamification/user/:userId/focus-stats` - Update focus stats
- `GET /gamification/user/:userId/badges` - Get user badges
- `GET /gamification/user/:userId/token-balance` - Get token balance

### Timer Integration
- `POST /timer/complete-session` - Complete timer session with rewards
- `GET /timer/stats` - Get timer statistics

## Quest Types

### Daily Quests
- **Daily Focus**: Complete 30 minutes of focused work
- **Task Master**: Complete 3 tasks

### Weekly Quests
- **Focus Warrior**: Complete 5 hours of focused work
- **Goal Achiever**: Complete 2 goals

### Special Quests
- **Week Warrior**: Maintain 7-day focus streak (NFT reward)

## Reward Structure

### XP Rewards
- Focus session: 10 XP per minute
- Deep work: 20 XP per minute
- Quest completion: 100-1000 XP
- Badge milestones: 25-1000 XP

### Token Rewards
- Focus session: 0.01 tokens per minute
- Streak bonus: 0.01 tokens per streak day
- Quest completion: XP-based calculation
- Difficulty multiplier: 1.5x for harder quests

### NFT Rewards
- Special quests award QuestNFT badges
- SBT tracks overall user progress
- Badges can be displayed in user profile

## Integration Points

### Frontend Integration
1. **Timer Completion**: Call `/timer/complete-session` after sessions
2. **Quest Display**: Use `/quests/user/:userId` for quest UI
3. **Stats Display**: Use `/gamification/user/:userId/stats` for dashboard
4. **Badge Display**: Use `/gamification/user/:userId/badges` for profile

### Backend Integration
1. **User Creation**: SBT minting happens automatically
2. **Session Tracking**: Timer routes integrate with gamification
3. **Quest Progress**: Auto-updates based on user activity
4. **Reward Distribution**: Automatic token and NFT minting

## Testing

### Local Development
1. Start local blockchain (Anvil):
   ```bash
   anvil
   ```

2. Deploy contracts locally:
   ```bash
   cd contracts/solidity
   ./deploy.sh anvil
   ```

3. Update environment variables with local addresses

4. Test user creation and SBT minting

### Production Deployment
1. Deploy contracts to production network
2. Update environment variables
3. Grant minter role to backend address
4. Test quest completion and reward distribution

## Monitoring

### Logs to Watch
- SBT minting success/failure
- Quest completion events
- Token reward distribution
- Badge award events

### Metrics to Track
- Daily active users with SBTs
- Quest completion rates
- Token distribution volume
- Badge unlock rates

## Troubleshooting

### Common Issues
1. **SBT Minting Fails**: Check private key and RPC URL
2. **Quest Not Updating**: Verify quest progress calculation
3. **Token Rewards Missing**: Check minter role and contract addresses
4. **Badge Not Awarded**: Verify badge type exists in BadgeService

### Debug Commands
```bash
# Check contract deployment
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# Verify minter role
cast call $FOCUS_TOKEN_ADDRESS "isMinter(address)" $BACKEND_ADDRESS

# Check user SBT
cast call $FOCUS_SBT_ADDRESS "userTokenId(address)" $USER_ADDRESS
```

## Security Considerations

1. **Private Key Security**: Store private key securely
2. **Minter Role**: Only grant to trusted backend
3. **Rate Limiting**: Implement on reward endpoints
4. **Input Validation**: Validate all user inputs
5. **Contract Upgrades**: Plan for contract upgrades

## Future Enhancements

1. **Staking System**: Allow users to stake tokens
2. **Governance**: Token-based voting system
3. **Marketplace**: Trade quest NFTs
4. **Leaderboards**: Competitive rankings
5. **Seasonal Events**: Time-limited quests and rewards 