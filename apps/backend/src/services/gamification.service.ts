import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { FocusToken__factory, QuestNFT__factory, FocusSBT__factory } from "../../../contracts/solidity/out";

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
  private focusToken: ethers.Contract;
  private questNFT: ethers.Contract;
  private focusSBT: ethers.Contract;
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly rpcUrl: string,
    private readonly privateKey: string,
    private readonly focusTokenAddress: string,
    private readonly questNFTAddress: string,
    private readonly focusSBTAddress: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    this.focusToken = FocusToken__factory.connect(focusTokenAddress, this.wallet);
    this.questNFT = QuestNFT__factory.connect(questNFTAddress, this.wallet);
    this.focusSBT = FocusSBT__factory.connect(focusSBTAddress, this.wallet);
  }

  /**
   * Mint SBT for new user (called in background thread)
   */
  async mintSBTForNewUser(userAddress: string, userId: string): Promise<void> {
    try {
      console.log(`Minting SBT for new user: ${userAddress}`);
      
      // Check if user already has SBT
      const existingTokenId = await this.focusSBT.userTokenId(userAddress);
      if (existingTokenId > 0) {
        console.log(`User ${userAddress} already has SBT token ID: ${existingTokenId}`);
        return;
      }

      // Mint initial SBT with level 1 stats
      const tx = await this.focusSBT.updateFocusRecord(userAddress, 0, 0);
      await tx.wait();
      
      const tokenId = await this.focusSBT.userTokenId(userAddress);
      
      // Update user record with SBT token ID
      await this.prisma.user.update({
        where: { id: userId },
        data: { soulboundToken: tokenId.toString() }
      });

      console.log(`Successfully minted SBT token ID ${tokenId} for user ${userAddress}`);
    } catch (error) {
      console.error(`Error minting SBT for user ${userAddress}:`, error);
      // Don't throw error to avoid blocking user creation
    }
  }

  /**
   * Complete a quest and award rewards
   */
  async completeQuest(questId: string, userId: string, userAddress: string): Promise<QuestCompletion> {
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
      badgeId: quest.badgeReward
    };

    // Mint QuestNFT if quest has NFT reward
    if (quest.nftContractAddress && quest.nftContractAddress === this.questNFT.target) {
      try {
        const tx = await this.questNFT.mintQuest(
          userAddress,
          quest.name,
          quest.description || "",
          quest.rewardXp || 0
        );
        const receipt = await tx.wait();
        
        // Extract token ID from event
        const event = receipt?.logs.find(log => 
          log.topics[0] === this.questNFT.interface.getEventTopic('QuestMinted')
        );
        if (event) {
          const decoded = this.questNFT.interface.parseLog(event);
          reward.nftTokenId = decoded?.args?.tokenId?.toString();
        }
      } catch (error) {
        console.error("Error minting QuestNFT:", error);
      }
    }

    // Mint tokens if reward includes tokens
    if (reward.tokens > 0) {
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
        nftTokenId: reward.nftTokenId,
        meta: {
          ...quest.meta,
          completedAt: new Date().toISOString(),
          rewards: reward
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
          nftTokenId: reward.nftTokenId,
          requirements: quest.requirements,
          meta: {
            questId,
            reward
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
    try {
      // Update SBT stats
      const tx = await this.focusSBT.updateFocusRecord(userAddress, sessionMinutes, streak);
      await tx.wait();

      // Mint tokens for focus session
      const baseReward = sessionMinutes * 10n ** 16n; // 0.01 tokens per minute
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
        nftContractAddress: this.questNFT.target
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
            nftContractAddress: quest.nftContractAddress,
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
    // Base token reward based on quest difficulty and XP
    const baseTokens = (quest.rewardXp || 0) * 0.01; // 0.01 tokens per XP
    const difficultyMultiplier = (quest.difficulty || 1) * 0.5;
    return Math.floor(baseTokens * (1 + difficultyMultiplier));
  }
} 