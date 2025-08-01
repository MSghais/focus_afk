"use client";

import React, { useState } from 'react';
import { useWebSocket } from '../../../providers/WebSocketProvider';
import { useWebSocketStore } from '../../../store/websocket';
import AIQuestViewer from './AIQuestViewer';
import styles from './QuestCreator.module.scss';

export default function QuestGenerationDemo() {
  const [showAIViewer, setShowAIViewer] = useState(false);
  const { questSuggestions } = useWebSocketStore();
  
  const {
    requestTaskQuests,
    requestFocusQuests,
    requestGoalQuests,
    requestQuickWinQuests,
    requestLearningQuests,
    requestWellnessQuests,
    requestSocialQuests,
    requestStreakQuests,
    requestNoteQuests,
    requestEnhancedQuests,
    requestContextualQuests,
    requestGoalTaskSuggestions
  } = useWebSocket();

  const questTypes = [
    {
      name: 'Task Quests',
      description: 'Generate quests based on your current tasks',
      icon: '📋',
      action: requestTaskQuests,
      color: 'blue'
    },
    {
      name: 'Focus Quests',
      description: 'Generate quests to improve focus and concentration',
      icon: '🎯',
      action: requestFocusQuests,
      color: 'green'
    },
    {
      name: 'Goal Quests',
      description: 'Generate quests aligned with your goals',
      icon: '🎯',
      action: requestGoalQuests,
      color: 'purple'
    },
    {
      name: 'Quick Win Quests',
      description: 'Generate short, achievable quests for momentum',
      icon: '⚡',
      action: requestQuickWinQuests,
      color: 'yellow'
    },
    {
      name: 'Learning Quests',
      description: 'Generate quests for skill development',
      icon: '📚',
      action: requestLearningQuests,
      color: 'indigo'
    },
    {
      name: 'Wellness Quests',
      description: 'Generate quests for well-being and self-care',
      icon: '🧘',
      action: requestWellnessQuests,
      color: 'pink'
    },
    {
      name: 'Social Quests',
      description: 'Generate quests for social connections',
      icon: '🤝',
      action: requestSocialQuests,
      color: 'teal'
    },
    {
      name: 'Streak Quests',
      description: 'Generate quests based on your streaks',
      icon: '🔥',
      action: requestStreakQuests,
      color: 'red'
    },
    {
      name: 'Note Quests',
      description: 'Generate quests for note-taking and organization',
      icon: '📝',
      action: requestNoteQuests,
      color: 'gray'
    },
    {
      name: 'Goal-Based Task Suggestions',
      description: 'Generate interesting tasks based on your goals',
      icon: '🎯',
      action: requestGoalTaskSuggestions,
      color: 'orange'
    },
    {
      name: 'Enhanced Quests',
      description: 'Generate advanced AI-powered quests',
      icon: '🤖',
      action: requestEnhancedQuests,
      color: 'cyan'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🎯 Quest Generation Demo</h2>
        <p>Click any button below to generate different types of quests via WebSocket</p>
        
        {/* AI Quest Viewer Button */}
        {questSuggestions && questSuggestions.length > 0 && (
          <button
            className={styles.aiViewerButton}
            onClick={() => setShowAIViewer(true)}
          >
            🤖 View AI-Generated Quests ({questSuggestions.length})
          </button>
        )}
      </div>

      <div className={styles.questGrid}>
        {questTypes.map((questType, index) => (
          <div key={index} className={`${styles.questCard} ${styles[questType.color]}`}>
            <div className={styles.questIcon}>{questType.icon}</div>
            <h3>{questType.name}</h3>
            <p>{questType.description}</p>
            <button
              className={styles.generateButton}
              onClick={questType.action}
            >
              Generate {questType.name}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.contextualSection}>
        <h3>🎯 Contextual Quest Generation</h3>
        <p>Generate quests based on specific triggers:</p>
        <div className={styles.contextualButtons}>
          <button
            className={styles.contextualButton}
            onClick={() => requestContextualQuests('task_completion')}
          >
            🎯 Task Completion
          </button>
          <button
            className={styles.contextualButton}
            onClick={() => requestContextualQuests('goal_progress')}
          >
            🎯 Goal Progress
          </button>
          <button
            className={styles.contextualButton}
            onClick={() => requestContextualQuests('focus_session')}
          >
            🎯 Focus Session
          </button>
          <button
            className={styles.contextualButton}
            onClick={() => requestContextualQuests('note_creation')}
          >
            🎯 Note Creation
          </button>
          <button
            className={styles.contextualButton}
            onClick={() => requestContextualQuests('streak_milestone')}
          >
            🎯 Streak Milestone
          </button>
          <button
            className={styles.contextualButton}
            onClick={() => requestContextualQuests('level_up')}
          >
            🎯 Level Up
          </button>
        </div>
      </div>

      {/* AI Quest Viewer Modal */}
      {showAIViewer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AIQuestViewer 
              quests={questSuggestions || []} 
              onClose={() => setShowAIViewer(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 