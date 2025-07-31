'use client'
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import QuestCreator from './QuestCreator';
import styles from './EnhancedQuestList.module.scss';
import { Icon } from '../../small/icons';

interface EnhancedQuestListProps {
  userId: string;
  userAddress: string;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  type: string;
  category?: string;
  status: string;
  progress: number;
  goal: number;
  rewardXp: number;
  rewardTokens: number;
  difficulty: number;
  createdAt: string;
  expiresAt?: string;
  meta?: any;
}

interface UserStats {
  level: number;
  totalXp: number;
  streak: number;
  totalTokens: number;
  completedQuests: number;
  earnedBadges: number;
  totalFocusMinutes: number;
}

export default function EnhancedQuestList({ userId, userAddress }: EnhancedQuestListProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestCreator, setShowQuestCreator] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, questsResponse] = await Promise.all([
        api.getEnhancedQuestStats(userId),
        api.getEnhancedUserQuests(userId)
      ]);

      if (statsResponse.success && statsResponse.data) {
        setUserStats(statsResponse.data);
      }

      if (questsResponse.success && questsResponse.data) {
        setActiveQuests(questsResponse.data.activeQuests || []);
      }
    } catch (err) {
      setError('Failed to fetch quest data');
      console.error('Error fetching quest data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestAction = async (questId: string, action: 'complete' | 'abandon') => {
    try {
      if (action === 'complete') {
        await api.completeEnhancedQuest(questId, userId, userAddress);
      }
      // Refresh data after action
      await fetchUserData();
    } catch (err) {
      setError(`Failed to ${action} quest`);
      console.error(`Error ${action}ing quest:`, err);
    }
  };

  const handleQuestCreated = async (quests: any) => {
    setShowQuestCreator(false);
    await fetchUserData(); // Refresh the quest list
  };

  const filteredActiveQuests = activeQuests.filter(quest => 
    selectedCategory === 'all' || (quest.category && quest.category === selectedCategory)
  );

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      focus: '⏲️',
      tasks: '📋',
      goals: '🎯',
      notes: '📝',
      learning: '📚',
      social: '👥',
      custom: '🎲',
      priority: '🏆',
      adaptive: '🧠'
    };
    return icons[category] || '🎲';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      focus: '#3b82f6',
      tasks: '#10b981',
      goals: '#f59e0b',
      notes: '#8b5cf6',
      learning: '#06b6d4',
      social: '#ec4899',
      custom: '#6b7280',
      priority: '#dc2626',
      adaptive: '#7c3aed'
    };
    return colors[category] || '#6b7280';
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626'];
    return colors[Math.min(difficulty - 1, 4)];
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#6b7280',
      uncommon: '#10b981',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    };
    return colors[rarity] || '#6b7280';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading quests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Quest Creator Modal */}
      {showQuestCreator && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <QuestCreator
              userId={userId}
              userAddress={userAddress}
              onQuestCreated={handleQuestCreated}
              onClose={() => setShowQuestCreator(false)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <h1>🎯 Enhanced Quest System</h1>
        <button 
          className={styles.createQuestButton}
          onClick={() => setShowQuestCreator(true)}
        >
          🏆 Generate Priority Quests
        </button>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className={styles.userStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Level</span>
            <span className={styles.statValue}>{userStats.level}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total XP</span>
            <span className={styles.statValue}>{userStats.totalXp.toLocaleString()}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Streak</span>
            <span className={styles.statValue}>{userStats.streak} days</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Tokens</span>
            <span className={styles.statValue}>{userStats.totalTokens}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statValue}>{userStats.completedQuests}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Badges</span>
            <span className={styles.statValue}>{userStats.earnedBadges}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Focus Time</span>
            <span className={styles.statValue}>{formatTime(userStats.totalFocusMinutes)}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
                 <button 
           className={styles.actionButton}
           onClick={async () => {
             try {
               await api.generateEnhancedQuests(userId, userAddress);
               await fetchUserData();
             } catch (err) {
               setError('Failed to generate quests');
             }
           }}
         >
           🎲 Generate New Quests
         </button>
        <button 
          className={styles.actionButton}
          onClick={() => api.updateEnhancedQuestProgress(userId)}
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
        {['focus', 'tasks', 'goals', 'notes', 'learning', 'social', 'custom', 'priority', 'adaptive'].map(category => (
          <button
            key={category}
            className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Active Quests */}
      <div className={styles.questsSection}>
        <h2>Active Quests ({filteredActiveQuests.length})</h2>
        
        {filteredActiveQuests.length === 0 ? (
          <div className={styles.noQuests}>
            <p>No active quests found. Generate some quests to get started!</p>
            <button 
              className={styles.generateButton}
              onClick={() => setShowQuestCreator(true)}
            >
              🏆 Generate Priority Quests
            </button>
          </div>
        ) : (
          <div className={styles.questsGrid}>
            {filteredActiveQuests.map(quest => (
              <div key={quest.id} className={styles.questCard}>
                <div className={styles.questHeader}>
                  <div className={styles.questIcon} style={{ backgroundColor: getCategoryColor(quest.category || 'adaptive') }}>
                    {getCategoryIcon(quest.category || 'adaptive')}
                  </div>
                  <div className={styles.questInfo}>
                    <h3 className={styles.questName}>{quest.name}</h3>
                    <p className={styles.questDescription}>{quest.description}</p>
                  </div>
                  <div className={styles.questMeta}>
                    <span 
                      className={styles.difficulty}
                      style={{ backgroundColor: getDifficultyColor(quest.difficulty) }}
                    >
                      {'⭐'.repeat(quest.difficulty)}
                    </span>
                    {quest.meta?.priority && (
                      <span className={`${styles.priority} ${styles[quest.meta.priority]}`}>
                        {quest.meta.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.questProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${quest.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {Math.round(quest.progress)}% ({quest.progress}/{quest.goal})
                  </span>
                </div>

                <div className={styles.questRewards}>
                  <span className={styles.reward}>⭐ {quest.rewardXp} XP</span>
                  <span className={styles.reward}>🪙 {quest.rewardTokens} Tokens</span>
                </div>

                {quest.expiresAt && (
                  <div className={styles.questExpiry}>
                    <span>⏰ Expires: {new Date(quest.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}

                <div className={styles.questActions}>
                  <button
                    className={styles.completeButton}
                    onClick={() => handleQuestAction(quest.id, 'complete')}
                    disabled={quest.progress < 100}
                  >
                    {quest.progress >= 100 ? '🎉 Complete!' : 'Complete'}
                  </button>
                  <button
                    className={styles.abandonButton}
                    onClick={() => handleQuestAction(quest.id, 'abandon')}
                  >
                    Abandon
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 