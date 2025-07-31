'use client'
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import styles from './EnhancedQuestList.module.scss';
import { Icon } from '../../small/icons';

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
  earnedAt: Date;
  rarity: string;
  xpReward: number;
  tokenReward: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: Date;
  xpGained: number;
  tokensGained: number;
}

interface Quest {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  description: string;
  type: string;
  category: string;
  status: string;
  progress: number;
  goal: number;
  rewardXp: number;
  rewardTokens: number;
  difficulty: number;
  createdAt: Date;
  expiresAt?: Date;
  vectorContext?: any[];
  meta?: {
    template?: string;
    recommendation?: string;
    similarityScore?: number;
    requirements?: string[];
    completionCriteria?: any;
  };
}

interface EnhancedQuestListProps {
  userId: string;
  userAddress: string;
}

export default function EnhancedQuestList({ userId, userAddress }: EnhancedQuestListProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [statsResponse, questsResponse] = await Promise.all([
        api.getEnhancedQuestStats(userId),
        api.getEnhancedUserQuests(userId)
      ]);

      console.log('statsResponse', statsResponse);
      console.log('questsResponse', questsResponse);
      if (statsResponse.success && statsResponse.data) {
        setUserStats(statsResponse.data);
      }

      if (questsResponse.success && questsResponse.data) {
        setActiveQuests(questsResponse.data.activeQuests || []);
        setCompletedQuests(questsResponse.data.completedQuests || []);
      }
    } catch (err) {
      setError('Failed to fetch quest data');
      console.error('Error fetching quest data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateNewQuests = async () => {
    try {
      setLoading(true);
      const response = await api.generateEnhancedQuests(userId, userAddress);

      if (response.success) {
        await fetchUserData(); // Refresh data
      }
    } catch (err) {
      setError('Failed to generate new quests');
      console.error('Error generating quests:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const response = await api.completeEnhancedQuest(questId, userId, userAddress);

      if (response.success) {
        await fetchUserData(); // Refresh data
      }
    } catch (err) {
      setError('Failed to complete quest');
      console.error('Error completing quest:', err);
    }
  };

  const updateQuestProgress = async () => {
    try {
      await api.updateEnhancedQuestProgress(userId);
      await fetchUserData(); // Refresh data
    } catch (err) {
      setError('Failed to update quest progress');
      console.error('Error updating quest progress:', err);
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      focus: '⏲️',
      tasks: '✅',
      goals: '🎯',
      mentor: '🤖',
      streak: '🔥',
      learning: '📚',
      social: '👥',
      notes: '📝',
      adaptive: '🧠'
    };
    return icons[category] || '🏆';
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      focus: '#3B82F6',
      tasks: '#10B981',
      goals: '#F59E0B',
      mentor: '#8B5CF6',
      streak: '#EF4444',
      learning: '#06B6D4',
      social: '#EC4899',
      notes: '#84CC16',
      adaptive: '#6366F1'
    };
    return colors[category] || '#6B7280';
  };

  const getDifficultyColor = (difficulty: number): string => {
    const colors = ['#10B981', '#F59E0B', '#F97316', '#EF4444', '#7C3AED'];
    return colors[Math.min(difficulty - 1, colors.length - 1)];
  };

  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: '#6B7280',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    };
    return colors[rarity] || '#6B7280';
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredActiveQuests = activeQuests.filter(quest =>
    selectedCategory === 'all' || (quest.category && quest.category === selectedCategory)
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading enhanced quests...</div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className={styles.container}>
  //       <div className={styles.error}>{error}</div>
  //     </div>
  //   );
  // }

  return (
    <div className={styles.container}>
      <div className={styles.error}>{error}</div>
      <button onClick={() => {
        fetchUserData()
      }}><Icon name="refresh" size={24} /></button>

      {/* User Stats Section */}
      {userStats && (
        <div className={styles.userStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>Level {userStats.level}</div>
              <div className={styles.statLabel}>{userStats.totalXp} XP</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{userStats.currentStreak}</div>
              <div className={styles.statLabel}>Day Streak</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏲️</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{userStats.totalFocusMinutes}</div>
              <div className={styles.statLabel}>Focus Minutes</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{userStats.completedQuests}</div>
              <div className={styles.statLabel}>Quests Completed</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎖️</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{userStats.earnedBadges}</div>
              <div className={styles.statLabel}>Badges Earned</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🪙</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{userStats.totalTokens}</div>
              <div className={styles.statLabel}>Total Tokens</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          className={styles.generateButton}
          onClick={generateNewQuests}
          disabled={loading}
        >
          🎲 Generate New Quests
        </button>

        <button
          className={styles.updateButton}
          onClick={updateQuestProgress}
          disabled={loading}
        >
          🔄 Update Progress
        </button>
      </div>

      {/* Category Filter */}
      <div className={styles.categoryFilter}>
        <button
          className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Categories
        </button>
        {['focus', 'tasks', 'goals', 'notes', 'adaptive'].map(category => (
          <button
            key={category}
            className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category)}
            style={{ borderColor: getCategoryColor(category) }}
          >
            {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Active Quests */}
      <div className={styles.questSection}>
        <h3 className={styles.sectionTitle}>
          🎯 Active Quests ({filteredActiveQuests.length})
        </h3>

        {filteredActiveQuests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎯</div>
            <div className={styles.emptyText}>No active quests found</div>
            <button
              className={styles.generateButton}
              onClick={generateNewQuests}
            >
              Generate Your First Quest
            </button>
          </div>
        ) : (
          <div className={styles.questGrid}>
            {filteredActiveQuests.map(quest => (
              <div key={quest.id} className={styles.questCard}>
                <div className={styles.questHeader}>
                  <div className={styles.questIcon} style={{ backgroundColor: getCategoryColor(quest.category || 'adaptive') }}>
                    {getCategoryIcon(quest.category || 'adaptive')}
                  </div>
                  <div className={styles.questInfo}>
                    <h4 className={styles.questName}>{quest.name}</h4>
                    <div className={styles.questMeta}>
                      <span className={styles.questType}>{quest.type}</span>
                      <span
                        className={styles.questDifficulty}
                        style={{ color: getDifficultyColor(quest.difficulty) }}
                      >
                        {'⭐'.repeat(quest.difficulty)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className={styles.questDescription}>{quest.description}</p>

                {/* Show recommendation for adaptive quests */}
                {quest.type === 'adaptive' && quest.meta?.recommendation && (
                  <div className={styles.recommendation}>
                    <div className={styles.recommendationIcon}>🧠</div>
                    <div className={styles.recommendationText}>
                      <strong>AI Recommendation:</strong> {quest.meta.recommendation}
                    </div>
                    {quest.meta.similarityScore && (
                      <div className={styles.similarityScore}>
                        Relevance: {Math.round(quest.meta.similarityScore * 100)}%
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div className={styles.progressSection}>
                  <div className={styles.progressInfo}>
                    <span>Progress: {quest.progress}/{quest.goal}</span>
                    <span>{Math.round((quest.progress / quest.goal) * 100)}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${Math.min((quest.progress / quest.goal) * 100, 100)}%`,
                        backgroundColor: getCategoryColor(quest.category || 'adaptive')
                      }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className={styles.rewards}>
                  <div className={styles.reward}>
                    <span className={styles.rewardIcon}>⭐</span>
                    <span>{quest.rewardXp} XP</span>
                  </div>
                  <div className={styles.reward}>
                    <span className={styles.rewardIcon}>🪙</span>
                    <span>{quest.rewardTokens} Tokens</span>
                  </div>
                </div>

                {/* Vector Context Info */}
                {quest.vectorContext && quest.vectorContext.length > 0 && (
                  <div className={styles.vectorContext}>
                    <div className={styles.vectorContextTitle}>📊 Based on your:</div>
                    <div className={styles.vectorContextItems}>
                      {quest.vectorContext.slice(0, 3).map((ctx, index) => (
                        <span key={index} className={styles.vectorContextItem}>
                          {ctx.type}: {ctx.name || ctx.description?.substring(0, 20)}...
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.questActions}>
                  {quest.progress >= quest.goal ? (
                    <button
                      className={styles.completeButton}
                      onClick={() => completeQuest(quest.id)}
                    >
                      🎉 Complete Quest
                    </button>
                  ) : (
                    <button
                      className={styles.progressButton}
                      onClick={updateQuestProgress}
                    >
                      🔄 Check Progress
                    </button>
                  )}
                </div>

                {/* Expiry Info */}
                {quest.expiresAt && (
                  <div className={styles.expiryInfo}>
                    Expires: {formatTime(quest.expiresAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      {userStats?.achievements && userStats.achievements.length > 0 && (
        <div className={styles.achievementsSection}>
          <h3 className={styles.sectionTitle}>
            🏆 Recent Achievements
          </h3>
          <div className={styles.achievementsGrid}>
            {userStats.achievements.slice(0, 6).map(achievement => (
              <div key={achievement.id} className={styles.achievementCard}>
                <div className={styles.achievementIcon}>{achievement.icon}</div>
                <div className={styles.achievementInfo}>
                  <h4 className={styles.achievementName}>{achievement.name}</h4>
                  <p className={styles.achievementDescription}>{achievement.description}</p>
                  <div className={styles.achievementMeta}>
                    <span
                      className={styles.achievementRarity}
                      style={{ color: getRarityColor(achievement.rarity) }}
                    >
                      {achievement.rarity.toUpperCase()}
                    </span>
                    <span className={styles.achievementRewards}>
                      +{achievement.xpReward} XP, +{achievement.tokenReward} Tokens
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {userStats?.recentActivity && userStats.recentActivity.length > 0 && (
        <div className={styles.activitySection}>
          <h3 className={styles.sectionTitle}>
            📈 Recent Activity
          </h3>
          <div className={styles.activityList}>
            {userStats.recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {activity.type === 'quest_completed' ? '🎯' :
                    activity.type === 'level_up' ? '⭐' :
                      activity.type === 'badge_earned' ? '🏆' :
                        activity.type === 'focus_session' ? '⏲️' :
                          activity.type === 'task_completed' ? '✅' :
                            activity.type === 'goal_completed' ? '🎯' : '📊'}
                </div>
                <div className={styles.activityInfo}>
                  <div className={styles.activityDescription}>{activity.description}</div>
                  <div className={styles.activityTime}>
                    {formatTime(activity.timestamp)}
                  </div>
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