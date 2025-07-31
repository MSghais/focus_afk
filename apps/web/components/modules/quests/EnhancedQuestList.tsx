import React, { useState, useEffect } from 'react';
import { useStore } from '../../../store/store';
import { api } from '../../../lib/api';
import styles from './EnhancedQuestList.module.scss';

interface Quest {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  status: 'active' | 'completed' | 'failed' | 'expired';
  progress: number;
  goal: number;
  rewardXp: number;
  rewardTokens: number;
  difficulty: number;
  createdAt: string;
  expiresAt?: string;
  vectorContext?: any[];
  adaptiveDescription?: string;
  meta: Record<string, any>;
}

interface UserStats {
  userId: string;
  userAddress: string;
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  totalFocusMinutes: number;
  completedQuests: number;
  earnedBadges: number;
  totalTokens: number;
  achievements: Achievement[];
  recentActivity: RecentActivity[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  tokenReward: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  xpGained: number;
  tokensGained: number;
}

interface LevelProgress {
  currentLevel: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
}

export default function EnhancedQuestList() {
  const { user } = useStore();
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserQuests();
      loadUserStats();
      loadLevelProgress();
    }
  }, [user?.id]);

  const loadUserQuests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/enhanced-quests/user/${user?.id}`);
      if (response.data.success) {
        setActiveQuests(response.data.data.activeQuests);
        setCompletedQuests(response.data.data.completedQuests);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await api.get(`/enhanced-quests/stats/${user?.id}`);
      if (response.data.success) {
        setUserStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadLevelProgress = async () => {
    try {
      const response = await api.get(`/enhanced-quests/level-progress/${user?.id}`);
      if (response.data.success) {
        setLevelProgress(response.data.data);
      }
    } catch (error) {
      console.error('Error loading level progress:', error);
    }
  };

  const generateNewQuests = async () => {
    try {
      const response = await api.post(`/enhanced-quests/generate/${user?.id}`);
      if (response.data.success) {
        await loadUserQuests();
        // Show success message
        console.log('Generated new quests:', response.data.data.message);
      }
    } catch (error) {
      console.error('Error generating quests:', error);
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const response = await api.post(`/enhanced-quests/complete/${questId}`, {
        userId: user?.id,
        userAddress: user?.userAddress
      });
      
      if (response.data.success) {
        await loadUserQuests();
        await loadUserStats();
        await loadLevelProgress();
        
        // Show success message with rewards
        const rewards = response.data.data.rewards;
        console.log(`Quest completed! Earned ${rewards.xp} XP and ${rewards.tokens} tokens`);
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const updateQuestProgress = async () => {
    try {
      await api.post(`/enhanced-quests/update-progress/${user?.id}`);
      await loadUserQuests();
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  };

  const getQuestIcon = (category: string) => {
    const icons: Record<string, string> = {
      focus: '⏲️',
      tasks: '✅',
      goals: '🎯',
      mentor: '🤖',
      streak: '🔥',
      learning: '📚',
      social: '👥'
    };
    return icons[category] || '🏆';
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return '#4ade80'; // green
      case 2: return '#fbbf24'; // yellow
      case 3: return '#f97316'; // orange
      case 4: return '#ef4444'; // red
      case 5: return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6b7280';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const filteredQuests = selectedCategory === 'all' 
    ? activeQuests 
    : activeQuests.filter(quest => quest.category === selectedCategory);

  const categories = ['all', 'focus', 'tasks', 'goals', 'mentor', 'streak', 'learning', 'social'];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading quests...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* User Stats Header */}
      {userStats && (
        <div className={styles.userStats}>
          <div className={styles.levelSection}>
            <div className={styles.levelInfo}>
              <h3>Level {userStats.level}</h3>
              {levelProgress && (
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${levelProgress.progress}%` }}
                  />
                  <span className={styles.progressText}>
                    {levelProgress.currentXp} / {levelProgress.nextLevelXp} XP
                  </span>
                </div>
              )}
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{userStats.totalXp}</span>
                <span className={styles.statLabel}>Total XP</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{userStats.currentStreak}</span>
                <span className={styles.statLabel}>Day Streak</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{userStats.completedQuests}</span>
                <span className={styles.statLabel}>Quests Done</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{userStats.earnedBadges}</span>
                <span className={styles.statLabel}>Badges</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quest Controls */}
      <div className={styles.controls}>
        <div className={styles.categoryFilter}>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.actionButtons}>
          <button 
            className={styles.generateButton}
            onClick={generateNewQuests}
          >
            Generate Quests
          </button>
          <button 
            className={styles.updateButton}
            onClick={updateQuestProgress}
          >
            Update Progress
          </button>
          <button 
            className={styles.toggleButton}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? 'Hide' : 'Show'} Completed
          </button>
        </div>
      </div>

      {/* Active Quests */}
      <div className={styles.questSection}>
        <h2>Active Quests ({filteredQuests.length})</h2>
        {filteredQuests.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No active quests found. Generate some new quests to get started!</p>
          </div>
        ) : (
          <div className={styles.questGrid}>
            {filteredQuests.map(quest => (
              <div key={quest.id} className={styles.questCard}>
                <div className={styles.questHeader}>
                  <div className={styles.questIcon}>
                    {getQuestIcon(quest.category)}
                  </div>
                  <div className={styles.questInfo}>
                    <h3 className={styles.questTitle}>{quest.name}</h3>
                    <div className={styles.questMeta}>
                      <span 
                        className={styles.difficulty}
                        style={{ backgroundColor: getDifficultyColor(quest.difficulty) }}
                      >
                        {quest.difficulty}/5
                      </span>
                      <span className={styles.category}>{quest.category}</span>
                      <span className={styles.type}>{quest.type}</span>
                    </div>
                  </div>
                </div>
                
                <p className={styles.questDescription}>{quest.description}</p>
                
                <div className={styles.questProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${quest.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {Math.round(quest.progress)}% ({quest.goal - Math.round(quest.goal * quest.progress / 100)} remaining)
                  </span>
                </div>
                
                <div className={styles.questRewards}>
                  <div className={styles.reward}>
                    <span className={styles.rewardIcon}>⭐</span>
                    <span>{quest.rewardXp} XP</span>
                  </div>
                  <div className={styles.reward}>
                    <span className={styles.rewardIcon}>🪙</span>
                    <span>{quest.rewardTokens} Tokens</span>
                  </div>
                </div>
                
                {quest.progress >= 100 && (
                  <button 
                    className={styles.completeButton}
                    onClick={() => completeQuest(quest.id)}
                  >
                    Complete Quest
                  </button>
                )}
                
                {quest.vectorContext && quest.vectorContext.length > 0 && (
                  <div className={styles.contextInfo}>
                    <small>Personalized based on your recent activity</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Quests */}
      {showCompleted && completedQuests.length > 0 && (
        <div className={styles.questSection}>
          <h2>Recently Completed ({completedQuests.length})</h2>
          <div className={styles.completedQuests}>
            {completedQuests.slice(0, 5).map(quest => (
              <div key={quest.id} className={styles.completedQuest}>
                <div className={styles.completedQuestIcon}>
                  {getQuestIcon(quest.category)}
                </div>
                <div className={styles.completedQuestInfo}>
                  <h4>{quest.name}</h4>
                  <p>{quest.description}</p>
                  <div className={styles.completedRewards}>
                    <span>+{quest.rewardXp} XP</span>
                    <span>+{quest.rewardTokens} Tokens</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Achievements */}
      {userStats && userStats.achievements.length > 0 && (
        <div className={styles.achievementsSection}>
          <h2>Recent Achievements</h2>
          <div className={styles.achievementsGrid}>
            {userStats.achievements.slice(0, 6).map(achievement => (
              <div 
                key={achievement.id} 
                className={styles.achievementCard}
                style={{ borderColor: getRarityColor(achievement.rarity) }}
              >
                <div className={styles.achievementIcon}>
                  {achievement.icon}
                </div>
                <div className={styles.achievementInfo}>
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                  <div className={styles.achievementRewards}>
                    <span>+{achievement.xpReward} XP</span>
                    <span>+{achievement.tokenReward} Tokens</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {userStats && userStats.recentActivity.length > 0 && (
        <div className={styles.activitySection}>
          <h2>Recent Activity</h2>
          <div className={styles.activityList}>
            {userStats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.type === 'quest_completed' ? '🏆' :
                   activity.type === 'level_up' ? '⭐' :
                   activity.type === 'focus_session' ? '⏲️' :
                   activity.type === 'task_completed' ? '✅' :
                   activity.type === 'goal_completed' ? '🎯' : '📊'}
                </div>
                <div className={styles.activityInfo}>
                  <p>{activity.description}</p>
                  <small>{new Date(activity.timestamp).toLocaleDateString()}</small>
                </div>
                <div className={styles.activityRewards}>
                  {activity.xpGained > 0 && <span>+{activity.xpGained} XP</span>}
                  {activity.tokensGained > 0 && <span>+{activity.tokensGained} Tokens</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 