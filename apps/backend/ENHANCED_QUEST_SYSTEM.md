# Enhanced Quest System with Vector Context and Gamification

This document describes the enhanced quest generation system that integrates Pinecone vector search with advanced gamification features to create personalized, context-aware quests for users.

## Overview

The enhanced quest system provides:

1. **Vector-Based Context**: Uses Pinecone embeddings to understand user behavior and preferences
2. **Personalized Quest Generation**: Creates quests tailored to individual user patterns
3. **Advanced Gamification**: Comprehensive reward system with XP, tokens, badges, and achievements
4. **Adaptive Quests**: AI-generated quests that adapt to user context and goals
5. **Real-time Progress Tracking**: Automatic quest progress updates based on user activity
6. **Multi-tier Quest System**: Daily, weekly, special, and adaptive quests

## Architecture

```
User Activity → Vector Embeddings → Context Analysis → Quest Generation → Gamification Events
     ↓              ↓                    ↓                ↓                ↓
Pinecone Service → Enhanced Context → Quest Service → Gamification → User Rewards
```

## Core Components

### 1. EnhancedQuestService

The main service responsible for generating personalized quests using vector context.

**Key Features:**
- **Quest Templates**: Predefined quest structures with configurable parameters
- **User Context Analysis**: Analyzes user activity patterns and preferences
- **Vector Context Integration**: Uses Pinecone to retrieve relevant user context
- **Adaptive Quest Generation**: Creates AI-powered personalized quests
- **Progress Tracking**: Monitors and updates quest completion status

**Quest Types:**
- **Daily Quests**: Short-term challenges (30 min focus, 3 tasks, etc.)
- **Weekly Quests**: Medium-term goals (5 hours focus, 2 goals, etc.)
- **Special Quests**: Milestone achievements (7-day streak, deep dive sessions)
- **Adaptive Quests**: AI-generated personalized challenges

### 2. EnhancedGamificationService

Comprehensive gamification system that handles all user progression and rewards.

**Key Features:**
- **Event Processing**: Handles various gamification events (quest completion, focus sessions, etc.)
- **Reward Calculation**: Calculates XP, tokens, and badges based on user actions
- **Level System**: Progressive leveling with XP thresholds
- **Achievement System**: Milestone-based achievements with rarity levels
- **Streak Tracking**: Maintains and rewards user streaks
- **Leaderboard**: Competitive ranking system

**Event Types:**
- `quest_completed`: Quest completion with rewards
- `streak_updated`: Streak milestone achievements
- `level_up`: Level progression rewards
- `badge_earned`: Badge and achievement unlocks
- `focus_session`: Focus session rewards
- `task_completed`: Task completion XP
- `goal_completed`: Goal achievement rewards

### 3. Vector Context Integration

Uses Pinecone vector search to provide personalized context for quest generation.

**Context Sources:**
- User tasks and goals
- Focus session history
- Mentor chat conversations
- User profile and preferences
- Recent achievements and badges
- Quest completion history

**Context Query Building:**
```typescript
const contextQuery = this.buildContextQuery(userContext);
// Example: "user activity context: focus sessions: 5, completed tasks: 3, 
//          preferred categories: focus, tasks, level: 3, streak: 7"
```

## Quest Generation Process

### 1. User Context Building

```typescript
const userContext = await this.buildUserContext(userId, userAddress);
// Includes: level, streak, recent activity, preferences, completed quests
```

### 2. Vector Context Retrieval

```typescript
const vectorContext = await this.pineconeService.retrieveUserContext(
  userId,
  contextQuery,
  5, // top 5 most relevant items
  ['tasks', 'goals', 'sessions', 'messages', 'profile']
);
```

### 3. Quest Personalization

```typescript
const personalizedDescription = await this.personalizeQuestDescription(
  template,
  userContext,
  vectorContext
);
// Adds context-specific details and motivational elements
```

### 4. Quest Creation

```typescript
const quest: GeneratedQuest = {
  id: `${template.id}_${userId}_${Date.now()}`,
  userId,
  templateId: template.id,
  name: template.name,
  description: personalizedDescription,
  type: template.type,
  category: template.category,
  status: 'active',
  progress: 0,
  goal: template.completionCriteria.target,
  rewardXp: template.rewardXp,
  rewardTokens: template.rewardTokens,
  difficulty: template.difficulty,
  createdAt: new Date(),
  vectorContext: relevantContext,
  meta: { template, requirements, completionCriteria }
};
```

## Quest Templates

### Daily Quests

| Template ID | Name | Description | Reward | Difficulty |
|-------------|------|-------------|--------|------------|
| `daily_focus_30` | Daily Focus | Complete 30 minutes of focused work | 100 XP, 10 Tokens | 1 |
| `daily_tasks_3` | Task Master | Complete 3 tasks today | 150 XP, 15 Tokens | 2 |
| `daily_mentor_chat` | Mentor Connection | Have a meaningful conversation with AI mentor | 50 XP, 5 Tokens | 1 |

### Weekly Quests

| Template ID | Name | Description | Reward | Difficulty |
|-------------|------|-------------|--------|------------|
| `weekly_focus_300` | Focus Warrior | Complete 5 hours of focused work | 500 XP, 50 Tokens | 3 |
| `weekly_goals_2` | Goal Achiever | Complete 2 goals this week | 300 XP, 30 Tokens | 3 |

### Special Quests

| Template ID | Name | Description | Reward | Difficulty |
|-------------|------|-------------|--------|------------|
| `special_streak_7` | Week Warrior | Maintain a 7-day focus streak | 1000 XP, 100 Tokens | 4 |
| `special_deep_dive` | Deep Dive Master | Complete a 90-minute deep focus session | 200 XP, 20 Tokens | 4 |

## Gamification Features

### XP and Leveling System

**Level Thresholds:**
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 250 XP
- Level 4: 500 XP
- Level 5: 1000 XP
- Level 6: 2000 XP
- Level 7: 4000 XP
- Level 8: 8000 XP
- Level 9: 16000 XP
- Level 10: 32000 XP

**XP Sources:**
- Focus sessions: 1 XP per minute + streak bonus
- Task completion: 10-20 XP based on priority
- Goal completion: 100 XP
- Quest completion: 50-1000 XP based on difficulty
- Badge earning: 50-500 XP based on rarity

### Achievement System

**Rarity Levels:**
- **Common**: Basic achievements (first focus session, first task)
- **Rare**: Moderate challenges (7-day streak, 10 tasks)
- **Epic**: Significant milestones (30-day streak, 100 tasks)
- **Legendary**: Exceptional achievements (100-day streak, 1000 tasks)

**Achievement Categories:**
- Focus milestones (1h, 5h, 10h, 20h, 40h total focus)
- Task milestones (10, 50, 100, 500, 1000 completed tasks)
- Streak milestones (7, 30, 100 days)
- Level milestones (5, 10, 20 levels)
- Quest completion milestones

### Token Economy

**Token Sources:**
- Focus sessions: 1 token per 10 minutes + streak bonus
- Quest completion: 5-100 tokens based on difficulty
- Achievement unlocking: 10-50 tokens based on rarity
- Level progression: 10 tokens per level

**Token Uses:**
- NFT minting (future feature)
- Premium features (future feature)
- Marketplace transactions (future feature)

## API Endpoints

### Enhanced Quest Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/enhanced-quests/user/:userId` | Get user's active and completed quests |
| POST | `/enhanced-quests/generate/:userId` | Generate new quests for user |
| POST | `/enhanced-quests/complete/:questId` | Complete a quest and award rewards |
| POST | `/enhanced-quests/update-progress/:userId` | Update quest progress based on activity |
| GET | `/enhanced-quests/templates` | Get available quest templates |
| GET | `/enhanced-quests/stats/:userId` | Get user gamification statistics |
| GET | `/enhanced-quests/leaderboard` | Get global leaderboard |
| GET | `/enhanced-quests/level-progress/:userId` | Get user's level progression |
| POST | `/enhanced-quests/event` | Process gamification event |
| GET | `/enhanced-quests/analytics/:userId` | Get quest completion analytics |

### Example API Usage

**Generate Quests:**
```bash
POST /enhanced-quests/generate/user123
```

**Complete Quest:**
```bash
POST /enhanced-quests/complete/quest456
Content-Type: application/json

{
  "userId": "user123",
  "userAddress": "0x123..."
}
```

**Get User Stats:**
```bash
GET /enhanced-quests/stats/user123
```

## Frontend Integration

### EnhancedQuestList Component

The main React component that displays the enhanced quest interface.

**Features:**
- User stats dashboard with level progress
- Category-based quest filtering
- Real-time quest progress updates
- Achievement display
- Recent activity feed
- Responsive design

**Key Props:**
- `user`: Current user object
- `quests`: Array of user quests
- `stats`: User gamification statistics

### Styling

Uses CSS Modules with modern design:
- Gradient backgrounds
- Smooth animations
- Responsive grid layouts
- Gamification-themed colors
- Progress bars and badges

## Configuration

### Environment Variables

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_index_name

# Blockchain Configuration
RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
FOCUS_TOKEN_ADDRESS=your_token_contract_address
QUEST_NFT_ADDRESS=your_nft_contract_address
FOCUS_SBT_ADDRESS=your_sbt_contract_address
```

### Gamification Configuration

```typescript
const config: GamificationConfig = {
  xpPerMinute: 1,
  streakBonus: 0.1, // 10% bonus per streak day
  levelThresholds: [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000],
  questRewardMultiplier: 1.5,
  badgeRewardMultiplier: 2.0,
  achievementRewardMultiplier: 3.0
};
```

## Usage Examples

### Basic Quest Generation

```typescript
// Initialize services
const questService = new EnhancedQuestService(prisma, pineconeService, enhancedContextManager, gamificationService);

// Generate quests for user
const quests = await questService.generateQuestsForUser(userId, userAddress);
```

### Process Gamification Event

```typescript
// Initialize gamification service
const gamificationService = new EnhancedGamificationService(prisma, questService, pineconeService, enhancedContextManager, rpcUrl, privateKey, focusTokenAddress, questNFTAddress, focusSBTAddress);

// Process focus session event
await gamificationService.processEvent({
  type: 'focus_session',
  userId: 'user123',
  userAddress: '0x123...',
  data: {
    duration: 30,
    streak: 5
  },
  timestamp: new Date()
});
```

### Get User Statistics

```typescript
// Get comprehensive user stats
const userStats = await gamificationService.getUserStats(userId);

// Get level progress
const levelProgress = await gamificationService.getNextLevelProgress(userId);

// Get leaderboard
const leaderboard = await gamificationService.getLeaderboard(10);
```

## Future Enhancements

### Planned Features

1. **AI-Powered Quest Generation**: More sophisticated AI-generated quests
2. **Social Features**: Quest sharing and collaboration
3. **Seasonal Events**: Special time-limited quests and rewards
4. **NFT Integration**: Quest completion NFTs and marketplace
5. **Advanced Analytics**: Detailed user behavior analysis
6. **Mobile Optimization**: Enhanced mobile experience
7. **Multi-language Support**: Internationalization
8. **Accessibility**: WCAG compliance and screen reader support

### Technical Improvements

1. **Caching**: Redis-based caching for better performance
2. **Real-time Updates**: WebSocket integration for live updates
3. **Offline Support**: PWA capabilities for offline quest tracking
4. **Advanced Vector Search**: More sophisticated context queries
5. **Machine Learning**: Predictive quest generation
6. **A/B Testing**: Quest effectiveness testing framework

## Troubleshooting

### Common Issues

1. **Vector Search Failures**: Check Pinecone API credentials and index configuration
2. **Quest Generation Errors**: Verify user data exists and is properly formatted
3. **Gamification Event Failures**: Check blockchain configuration and contract addresses
4. **Progress Update Issues**: Ensure user activity data is being properly tracked

### Debug Mode

Enable debug logging by setting the environment variable:
```env
DEBUG_QUESTS=true
```

This will provide detailed logging for quest generation, gamification events, and vector search operations.

## Contributing

When contributing to the enhanced quest system:

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure proper error handling and logging
5. Test with various user scenarios and edge cases
6. Consider performance implications of new features

## Support

For questions or issues with the enhanced quest system:

1. Check the troubleshooting section
2. Review the API documentation
3. Examine the example implementations
4. Contact the development team
5. Create an issue in the project repository 