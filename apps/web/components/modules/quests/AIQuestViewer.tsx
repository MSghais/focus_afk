"use client";

import React, { useState, useEffect } from 'react';
import { Quest } from '../../../lib/gamification';
import styles from './QuestCreator.module.scss';

interface AIQuestViewerProps {
  quests: Quest[];
  onClose?: () => void;
}

export default function AIQuestViewer({ quests, onClose }: AIQuestViewerProps) {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'ai_enhanced' | 'fallback'>('all');

  // Filter quests based on type
  const filteredQuests = quests.filter(quest => {
    if (filterType === 'all') return true;
    if (filterType === 'ai_enhanced') return quest.type === 'ai_enhanced';
    if (filterType === 'fallback') return quest.type === 'fallback';
    return true;
  });

  // Get AI-generated quests
  const aiQuests = quests.filter(quest => quest.type === 'ai_enhanced');
  const fallbackQuests = quests.filter(quest => quest.type === 'fallback');

  const getQuestTypeIcon = (quest: Quest) => {
    if (quest.type === 'ai_enhanced') return '🤖';
    if (quest.type === 'fallback') return '🔄';
    return '🎯';
  };

  const getQuestTypeLabel = (quest: Quest) => {
    if (quest.type === 'ai_enhanced') return 'AI Generated';
    if (quest.type === 'fallback') return 'Fallback';
    return 'Standard';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return '#10b981'; // Green
    if (difficulty <= 3) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🤖 AI-Generated Quest Viewer</h2>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Statistics */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <h3>📊 Quest Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Quests:</span>
              <span className={styles.statValue}>{quests.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>AI Generated:</span>
              <span className={styles.statValue}>{aiQuests.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Fallback:</span>
              <span className={styles.statValue}>{fallbackQuests.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className={styles.filterSection}>
        <h3>🔍 Filter Quests</h3>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Quests ({quests.length})
          </button>
          <button
            className={`${styles.filterButton} ${filterType === 'ai_enhanced' ? styles.active : ''}`}
            onClick={() => setFilterType('ai_enhanced')}
          >
            🤖 AI Generated ({aiQuests.length})
          </button>
          <button
            className={`${styles.filterButton} ${filterType === 'fallback' ? styles.active : ''}`}
            onClick={() => setFilterType('fallback')}
          >
            🔄 Fallback ({fallbackQuests.length})
          </button>
        </div>
      </div>

      {/* Quest List */}
      <div className={styles.questListSection}>
        <h3>📋 Quest List</h3>
        {filteredQuests.length === 0 ? (
          <div className={styles.noQuests}>
            <p>No quests found with the current filter.</p>
          </div>
        ) : (
          <div className={styles.questGrid}>
            {filteredQuests.map((quest) => (
              <div
                key={quest.id}
                className={`${styles.questCard} ${selectedQuest?.id === quest.id ? styles.selected : ''}`}
                onClick={() => setSelectedQuest(quest)}
              >
                <div className={styles.questHeader}>
                  <div className={styles.questIcon}>{getQuestTypeIcon(quest)}</div>
                  <div className={styles.questType}>
                    <span className={styles.typeLabel}>{getQuestTypeLabel(quest)}</span>
                  </div>
                </div>
                <h4>{quest.name}</h4>
                <p className={styles.questDescription}>
                  {quest.description?.substring(0, 100)}...
                </p>
                <div className={styles.questMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Difficulty:</span>
                    <span 
                      className={styles.metaValue}
                      style={{ color: getDifficultyColor(quest.difficulty || 2) }}
                    >
                      {quest.difficulty || 2}/5
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Reward:</span>
                    <span className={styles.metaValue}>{quest.rewardXp} XP</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Progress:</span>
                    <span className={styles.metaValue}>{quest.progress || 0}/{quest.goal || 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quest Details */}
      {selectedQuest && (
        <div className={styles.questDetailsSection}>
          <h3>📖 Quest Details</h3>
          <div className={styles.questDetails}>
            <div className={styles.detailHeader}>
              <h4>{selectedQuest.name}</h4>
              <div className={styles.detailMeta}>
                <span className={styles.typeBadge}>
                  {getQuestTypeIcon(selectedQuest)} {getQuestTypeLabel(selectedQuest)}
                </span>
                <span 
                  className={styles.difficultyBadge}
                  style={{ backgroundColor: getDifficultyColor(selectedQuest.difficulty || 2) }}
                >
                  Difficulty: {selectedQuest.difficulty || 2}/5
                </span>
              </div>
            </div>
            
            <div className={styles.detailContent}>
              <div className={styles.detailSection}>
                <h5>📝 Description</h5>
                <p>{selectedQuest.description}</p>
              </div>

              <div className={styles.detailSection}>
                <h5>🎯 Progress</h5>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${Math.min(100, ((selectedQuest.progress || 0) / (selectedQuest.goal || 1)) * 100)}%` }}
                  ></div>
                </div>
                <p>{selectedQuest.progress || 0} / {selectedQuest.goal || 1} completed</p>
              </div>

              <div className={styles.detailSection}>
                <h5>🏆 Rewards</h5>
                <div className={styles.rewardsGrid}>
                  <div className={styles.rewardItem}>
                    <span className={styles.rewardIcon}>⭐</span>
                    <span className={styles.rewardValue}>{selectedQuest.rewardXp} XP</span>
                  </div>
                  <div className={styles.rewardItem}>
                    <span className={styles.rewardIcon}>🪙</span>
                    <span className={styles.rewardValue}>{selectedQuest.rewardTokens || 0} Tokens</span>
                  </div>
                </div>
              </div>

              {/* AI-specific details */}
              {selectedQuest.type === 'ai_enhanced' && selectedQuest.meta && (
                <div className={styles.detailSection}>
                  <h5>🤖 AI Details</h5>
                  <div className={styles.aiDetails}>
                    {selectedQuest.meta.timeEstimate && (
                      <div className={styles.aiDetailItem}>
                        <span className={styles.aiLabel}>⏱️ Time Estimate:</span>
                        <span className={styles.aiValue}>{selectedQuest.meta.timeEstimate}</span>
                      </div>
                    )}
                    {selectedQuest.meta.actionSteps && selectedQuest.meta.actionSteps.length > 0 && (
                      <div className={styles.aiDetailItem}>
                        <span className={styles.aiLabel}>📋 Action Steps:</span>
                        <ul className={styles.actionSteps}>
                          {selectedQuest.meta.actionSteps.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedQuest.meta.questType && (
                      <div className={styles.aiDetailItem}>
                        <span className={styles.aiLabel}>🎯 Quest Type:</span>
                        <span className={styles.aiValue}>{selectedQuest.meta.questType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 