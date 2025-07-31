import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";

// Contract ABIs - these will be imported from the compiled contracts
// For now, we'll create minimal ABIs to avoid compilation issues
const FocusTokenABI = [
  "function mint(address to, uint256 amount, string reason) external",
  "function mintFocusReward(address user, uint256 sessionMinutes, uint256 streak) external",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

const QuestNFTABI = [
  "function mintQuest(address to, string name, string description, uint256 xpReward) external returns (uint256)",
  "function completeQuest(uint256 tokenId) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function quests(uint256 tokenId) external view returns (string name, string description, uint256 xpReward, bool isCompleted, uint256 completedAt)"
];

const FocusSBTABI = [
  "function updateFocusRecord(address user, uint256 sessionMinutes, uint256 streak) external",
  "function userTokenId(address user) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function focusStats(address user) external view returns (uint256 totalMinutes, uint256 streakDays, uint256 completedQuests, uint256 level, uint256 lastSession)"
];

export interface QuestReward {
  xp: number;
  tokens: number;
  nftTokenId?: string;
  badgeId?: string;
}

export interface QuestCompletion {
  questId: string;
  userId: string;
  userAddress: string;
  reward: QuestReward;
  completedAt: Date;
}

export class GamificationService {
  private focusToken?: ethers.Contract;
  private questNFT?: ethers.Contract;
  private focusSBT?: ethers.Contract;
  private provider?: ethers.Provider;
  private wallet?: ethers.Wallet;
  private blockchainEnabled: boolean = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly rpcUrl: string,
    private readonly privateKey: string,
    private readonly focusTokenAddress: string,
    private readonly questNFTAddress: string,
    private readonly focusSBTAddress: string
  ) {
    // Only initialize blockchain components if we have valid credentials
    if (privateKey && privateKey !== '[ REDACTED ]' && privateKey !== '' && rpcUrl) {
      try {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        
        // Create contract instances using ABIs
        this.focusToken = new ethers.Contract(focusTokenAddress, FocusTokenABI, this.wallet);
        this.questNFT = new ethers.Contract(questNFTAddress, QuestNFTABI, this.wallet);
        this.focusSBT = new ethers.Contract(focusSBTAddress, FocusSBTABI, this.wallet);
        
        this.blockchainEnabled = true;
        console.log('✅ Blockchain services initialized successfully');
      } catch (error) {
        console.warn('⚠️ Failed to initialize blockchain services:', error.message);
        console.warn('Continuing with blockchain features disabled');
        this.blockchainEnabled = false;
      }
    } else {
      console.warn('⚠️ Private key or RPC URL not provided, blockchain features will be disabled');
      this.blockchainEnabled = false;
    }
  }

  /**
   * Mint SBT for new user (called in background thread)
   */
  async mintSBTForNewUser(userAddress: string, userId: string): Promise<void> {
    
    if (!this.blockchainEnabled || !this.provider || !this.focusSBT) {
      console.log(`⚠️ Blockchain services not available, skipping SBT mint for user: ${userAddress}`);
      return;
    }
    
    try {
      console.log(`Minting SBT for new user: ${userAddress}`);
      
      // First, check if the contract exists and is accessible
      try {
        const code = await this.provider.getCode(this.focusSBT.target);
        if (code === '0x') {
          console.log(`❌ No contract found at SBT address: ${this.focusSBT.target}`);
          return;
        }
        console.log(`✅ Contract found at SBT address: ${this.focusSBT.target}`);
      } catch (contractError) {
        console.error(`❌ Error checking SBT contract:`, contractError);
        return;
      }
      
      // Check if user already has SBT (with better error handling)
      let existingTokenId = 0;
      try {
        existingTokenId = await this.focusSBT.userTokenId(userAddress);
        console.log(`Current SBT token ID for user: ${existingTokenId}`);
      } catch (tokenError) {
        console.log(`User ${userAddress} has no existing SBT token (this is expected for new users)`);
        existingTokenId = 0;
      }
      
      if (existingTokenId > 0) {
        console.log(`User ${userAddress} already has SBT token ID: ${existingTokenId}`);
        
        // Update user record with existing SBT token ID
        await this.prisma.user.update({
          where: { id: userId },
          data: { soulboundToken: existingTokenId.toString() }
        });
        return;
      }

      // Mint initial SBT with level 1 stats
      console.log(`Minting new SBT for user ${userAddress}...`);
      const tx = await this.focusSBT.updateFocusRecord(userAddress, 0, 0);
      console.log(`SBT mint transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`SBT mint transaction confirmed in block ${receipt.blockNumber}`);
      
      // Get the new token ID
      const tokenId = await this.focusSBT.userTokenId(userAddress);
      console.log(`New SBT token ID: ${tokenId}`);
      
      // Update user record with SBT token ID
      await this.prisma.user.update({
        where: { id: userId },
        data: { soulboundToken: tokenId.toString() }
      });

      console.log(`✅ Successfully minted SBT token ID ${tokenId} for user ${userAddress}`);
    } catch (error) {
      console.error(`❌ Error minting SBT for user ${userAddress}:`, error);
      
      // Log more details about the error
      if (error.code === 'BAD_DATA') {
        console.error(`Contract interaction failed - possible causes:`);
        console.error(`1. Contract not deployed at ${this.focusSBT.target}`);
        console.error(`2. ABI mismatch - function signature incorrect`);
        console.error(`3. Network/RPC issues`);
      }
      
      // Don't throw error to avoid blocking user creation
    }
  }

  /**
   * Complete a quest and award rewards
   */
  async completeQuest(questId: string, userId: string, userAddress: string): Promise<QuestCompletion> {
    console.log("Completing quest:", questId, userId, userAddress);
    const quest = await this.prisma.quests.findUnique({
      where: { id: questId },
      include: { user: true }
    });

    if (!quest || quest.userId !== userId) {
      throw new Error("Quest not found or unauthorized");
    }

    if (quest.isCompleted === "true") {
      throw new Error("Quest already completed");
    }

    // Calculate rewards
    const reward: QuestReward = {
      xp: quest.rewardXp || 0,
      tokens: this.calculateTokenReward(quest),
      badgeId: quest.badgeReward || undefined
    };

    // Mint QuestNFT if quest has NFT reward and blockchain is enabled
    if (this.blockchainEnabled && quest.nftContractAddress && this.questNFT && quest.nftContractAddress === this.questNFT.target) {
      try {
        const tx = await this.questNFT.mintQuest(
          userAddress,
          quest.name,
          quest.description || "",
          quest.rewardXp || 0
        );
        const receipt = await tx.wait();
        
        // Extract token ID from event
                 // For now, we'll skip NFT token ID extraction since we don't have the full ABI
         // This can be implemented once the full contract ABIs are available
         console.log("QuestNFT minted successfully, token ID extraction skipped");
      } catch (error) {
        console.error("Error minting QuestNFT:", error);
      }
    }

    // Mint tokens if reward includes tokens and blockchain is enabled
    if (this.blockchainEnabled && reward.tokens > 0 && this.focusToken) {
      try {
        const tx = await this.focusToken.mintFocusReward(
          userAddress,
          reward.tokens,
          0 // No streak bonus for quest completion
        );
        await tx.wait();
      } catch (error) {
        console.error("Error minting tokens:", error);
      }
    }

    // Update quest completion status
    await this.prisma.quests.update({
      where: { id: questId },
      data: { 
        isCompleted: "true",
        nftTokenId: reward.nftTokenId || undefined,
        meta: {
          ...(quest.meta as any || {}),
          completedAt: new Date().toISOString(),
          rewards: reward as any
        }
      }
    });

    // Create badge if quest awards one
    if (reward.badgeId) {
      await this.prisma.badge.create({
        data: {
          userId,
          type: "quest_reward",
          name: quest.name,
          description: quest.description,
          icon: quest.icon,
          nftContractAddress: quest.nftContractAddress,
          nftTokenId: reward.nftTokenId || undefined,
          requirements: quest.requirements,
          meta: {
            questId,
            reward: reward as any
          }
        }
      });
    }

    return {
      questId,
      userId,
      userAddress,
      reward,
      completedAt: new Date()
    };
  }

  /**
   * Update user's focus stats and potentially mint tokens
   */
  async updateFocusStats(
    userAddress: string, 
    sessionMinutes: number, 
    streak: number
  ): Promise<void> {
    if (!this.blockchainEnabled || !this.focusSBT || !this.focusToken) {
      console.log(`⚠️ Blockchain services not available, skipping focus stats update for user: ${userAddress}`);
      return;
    }
    
    try {
      // Update SBT stats
      console.log("Updating focus stats:", userAddress, sessionMinutes, streak);
      const tx = await this.focusSBT.updateFocusRecord(userAddress, sessionMinutes, streak);
      await tx.wait();

      // Mint tokens for focus session
      const baseReward = BigInt(sessionMinutes) * 10n ** 16n; // 0.01 tokens per minute
      const streakBonus = BigInt(streak) * 10n ** 16n; // 0.01 tokens per streak day
      const totalReward = baseReward + streakBonus;

      if (totalReward > 0) {
        const tokenTx = await this.focusToken.mintFocusReward(userAddress, sessionMinutes, streak);
        await tokenTx.wait();
      }
    } catch (error) {
      console.error("Error updating focus stats:", error);
    }
  }

  /**
   * Generate quests for a user based on their activity
   */
  async generateQuestsForUser(userId: string): Promise<void> {
    console.log("Generating quests for user:", userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        timerSessions: true,
        tasks: true,
        goals: true,
        quests: true
      }
    });

    if (!user) return;

    const existingQuestIds = user.quests.map(q => q.type);
    const focusSessions = user.timerSessions.filter(s => s.type === "focus");
    const completedTasks = user.tasks.filter(t => t.completed);
    const completedGoals = user.goals.filter(g => g.completed);

    // Daily quests
    const dailyQuests = [
      {
        type: "daily_focus_30",
        name: "Daily Focus",
        description: "Complete 30 minutes of focused work today",
        requirements: ["focus_30_min"],
        rewardXp: 100,
        difficulty: 1
      },
      {
        type: "daily_tasks_3",
        name: "Task Master",
        description: "Complete 3 tasks today",
        requirements: ["complete_3_tasks"],
        rewardXp: 150,
        difficulty: 2
      }
    ];

    // Weekly quests
    const weeklyQuests = [
      {
        type: "weekly_focus_300",
        name: "Focus Warrior",
        description: "Complete 5 hours of focused work this week",
        requirements: ["focus_300_min"],
        rewardXp: 500,
        difficulty: 3
      },
      {
        type: "weekly_goals_2",
        name: "Goal Achiever",
        description: "Complete 2 goals this week",
        requirements: ["complete_2_goals"],
        rewardXp: 300,
        difficulty: 3
      }
    ];

    // Special quests
    const specialQuests = [
      {
        type: "special_streak_7",
        name: "Week Warrior",
        description: "Maintain a 7-day focus streak",
        requirements: ["streak_7_days"],
        rewardXp: 1000,
        difficulty: 4,
        nftContractAddress: this.questNFT?.target || undefined
      }
    ];

    const allQuests = [...dailyQuests, ...weeklyQuests, ...specialQuests];

    for (const quest of allQuests) {
      if (!existingQuestIds.includes(quest.type)) {
        await this.prisma.quests.create({
          data: {
            userId,
            type: quest.type,
            name: quest.name,
            description: quest.description,
            requirements: quest.requirements,
            rewardXp: quest.rewardXp,
            difficulty: quest.difficulty,
            nftContractAddress: (quest as any).nftContractAddress,
            progress: 0,
            isCompleted: "false"
          }
        });
      }
    }
  }

  /**
   * Check and update quest progress
   */
  async updateQuestProgress(userId: string): Promise<void> {
    console.log("Updating quest progress for user:", userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        timerSessions: true,
        tasks: true,
        goals: true,
        quests: {
          where: { isCompleted: "false" }
        }
      }
    });

    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Calculate current stats
    const todayFocusMinutes = user.timerSessions
      .filter(s => s.type === "focus" && s.startTime >= today)
      .reduce((sum, s) => sum + s.duration / 60, 0);

    const weekFocusMinutes = user.timerSessions
      .filter(s => s.type === "focus" && s.startTime >= weekStart)
      .reduce((sum, s) => sum + s.duration / 60, 0);

    const todayCompletedTasks = user.tasks
      .filter(t => t.completed && t.updatedAt >= today).length;

    const weekCompletedGoals = user.goals
      .filter(g => g.completed && g.updatedAt >= weekStart).length;

    // Update quest progress
    for (const quest of user.quests) {
      let progress = 0;
      let shouldComplete = false;

      switch (quest.type) {
        case "daily_focus_30":
          progress = Math.min(100, (todayFocusMinutes / 30) * 100);
          shouldComplete = todayFocusMinutes >= 30;
          break;
        case "daily_tasks_3":
          progress = Math.min(100, (todayCompletedTasks / 3) * 100);
          shouldComplete = todayCompletedTasks >= 3;
          break;
        case "weekly_focus_300":
          progress = Math.min(100, (weekFocusMinutes / 300) * 100);
          shouldComplete = weekFocusMinutes >= 300;
          break;
        case "weekly_goals_2":
          progress = Math.min(100, (weekCompletedGoals / 2) * 100);
          shouldComplete = weekCompletedGoals >= 2;
          break;
      }

      await this.prisma.quests.update({
        where: { id: quest.id },
        data: { progress }
      });

      if (shouldComplete && quest.isCompleted !== "true") {
        // Auto-complete quest
        await this.completeQuest(quest.id, userId, user.userAddress);
      }
    }
  }

  private calculateTokenReward(quest: any): number {
    console.log("Calculating token reward for quest:", quest);
    // Base token reward based on quest difficulty and XP
    const baseTokens = (quest.rewardXp || 0) * 0.01; // 0.01 tokens per XP
    const difficultyMultiplier = (quest.difficulty || 1) * 0.5;
    return Math.floor(baseTokens * (1 + difficultyMultiplier));
  }

  /**
   * Check if the gamification service is properly configured
   */
  async checkServiceHealth(): Promise<{
    isHealthy: boolean;
    contracts: {
      focusToken: boolean;
      questNFT: boolean;
      focusSBT: boolean;
    };
    errors: string[];
  }> {
    const result = {
      isHealthy: true,
      contracts: {
        focusToken: false,
        questNFT: false,
        focusSBT: false
      },
      errors: [] as string[]
    };

    if (!this.blockchainEnabled || !this.provider || !this.wallet || !this.focusToken || !this.questNFT || !this.focusSBT) {
      result.isHealthy = false;
      result.errors.push('Blockchain services not initialized - private key or RPC URL may be missing');
      return result;
    }

    console.log("Checking service health:", this.focusToken.target, this.questNFT.target, this.focusSBT.target);
    try {
      // Check FocusToken contract
      try {
        const focusTokenCode = await this.provider.getCode(this.focusToken.target);
        result.contracts.focusToken = focusTokenCode !== '0x';
        if (!result.contracts.focusToken) {
          result.errors.push(`FocusToken contract not found at ${this.focusToken.target}`);
        }
      } catch (error) {
        result.errors.push(`Error checking FocusToken: ${error.message}`);
      }

      // Check QuestNFT contract
      try {
        const questNFTCode = await this.provider.getCode(this.questNFT.target);
        result.contracts.questNFT = questNFTCode !== '0x';
        if (!result.contracts.questNFT) {
          result.errors.push(`QuestNFT contract not found at ${this.questNFT.target}`);
        }
      } catch (error) {
        result.errors.push(`Error checking QuestNFT: ${error.message}`);
      }

      // Check FocusSBT contract
      try {
        const focusSBTCode = await this.provider.getCode(this.focusSBT.target);
        result.contracts.focusSBT = focusSBTCode !== '0x';
        if (!result.contracts.focusSBT) {
          result.errors.push(`FocusSBT contract not found at ${this.focusSBT.target}`);
        }
      } catch (error) {
        result.errors.push(`Error checking FocusSBT: ${error.message}`);
      }

      // Check wallet balance
      try {
        const balance = await this.provider.getBalance(this.wallet.address);
        console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
        if (balance === 0n) {
          result.errors.push('Wallet has no ETH balance for gas fees');
        }
      } catch (error) {
        result.errors.push(`Error checking wallet balance: ${error.message}`);
      }

      result.isHealthy = result.errors.length === 0;
      
      console.log('🔍 Gamification service health check:', {
        contracts: result.contracts,
        errors: result.errors,
        isHealthy: result.isHealthy
      });

    } catch (error) {
      result.isHealthy = false;
      result.errors.push(`Health check failed: ${error.message}`);
    }

    return result;
  }
} 