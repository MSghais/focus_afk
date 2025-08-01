import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useWebSocket } from '../../../providers/WebSocketProvider';
import styles from './QuestCreator.module.scss';

interface QuestCreatorProps {
  userId: string;
  userAddress: string;
  onQuestCreated?: (quest: any) => void;
  onClose?: () => void;
}

interface QuestSuggestion {
  type: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedReward: {
    xp: number;
    tokens: number;
  };
  confidence: number;
}

export default function QuestCreator({ userId, userAddress, onQuestCreated, onClose }: QuestCreatorProps) {
  const [questType, setQuestType] = useState<'generic' | 'suggestion' | 'priority' | 'task' | 'focus' | 'goal' | 'quick_win' | 'learning' | 'wellness' | 'social' | 'streak' | 'note' | 'goal_task_suggestions'>('priority');
  const [suggestions, setSuggestions] = useState<QuestSuggestion[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    requestGoalTaskSuggestions
  } = useWebSocket();

  // Generic quest form state
  const [genericQuest, setGenericQuest] = useState({
    name: '',
    description: '',
    category: 'focus' as const,
    difficulty: 2 as const,
    rewardXp: 100,
    rewardTokens: 10,
    completionCriteria: {
      type: 'count' as const,
      target: 1,
      unit: ''
    },
    expiresAt: '',
    tags: [] as string[],
    priority: 'medium' as const
  });

  // Suggestion quest form state
  const [suggestionQuest, setSuggestionQuest] = useState({
    suggestionType: 'productivity' as const,
    context: [] as any[],
    aiReasoning: '',
    difficulty: 2 as const,
    expiresAt: ''
  });

  useEffect(() => {
    if (questType === 'suggestion') {
      loadSuggestions();
    } else if (questType === 'priority') {
      loadTaskSummary();
    }
  }, [questType]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.getQuestSuggestions(userId, 5);
      if (response.success && response.data) {
        setSuggestions(response.data.suggestions || []);
      }
    } catch (err) {
      setError('Failed to load quest suggestions');
      console.error('Error loading suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskSummary = async () => {
    try {
      setLoading(true);
      const response = await api.getTaskSummary();
      if (response.success && response.data) {
        setTaskSummary(response.data);
      }
    } catch (err) {
      setError('Failed to load task summary');
      console.error('Error loading task summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePriorityQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.generatePriorityQuestSuggestions(userAddress);
      if (response.success && response.data) {
        onQuestCreated?.(response.data.quests);
        onClose?.();
      }
    } catch (err) {
      setError('Failed to generate priority quests');
      console.error('Error generating priority quests:', err);
    } finally {
      setLoading(false);
    }
  };

  const testPersonalization = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.testQuestPersonalization(userAddress);
      if (response.success && response.data) {
        console.log('Personalization Test Results:', response.data);
        alert(`Personalization Test Results:\n\n${response.data.message}\n\nCheck console for detailed results.`);
      }
    } catch (err) {
      setError('Failed to test personalization');
      console.error('Error testing personalization:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenericQuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await api.createGenericQuest({
        userId,
        userAddress,
        ...genericQuest,
        expiresAt: genericQuest.expiresAt || undefined
      });

      if (response.success && response.data) {
        onQuestCreated?.(response.data.quest);
        onClose?.();
      }
    } catch (err) {
      setError('Failed to create generic quest');
      console.error('Error creating generic quest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionQuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await api.createSuggestionQuest({
        userId,
        userAddress,
        ...suggestionQuest,
        expiresAt: suggestionQuest.expiresAt || undefined
      });

      if (response.success && response.data) {
        onQuestCreated?.(response.data.quest);
        onClose?.();
      }
    } catch (err) {
      setError('Failed to create suggestion quest');
      console.error('Error creating suggestion quest:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFromSuggestion = async (suggestion: QuestSuggestion) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.createSuggestionQuest({
        userId,
        userAddress,
        suggestionType: suggestion.type as any,
        context: [],
        aiReasoning: suggestion.description,
        difficulty: suggestion.difficulty as any,
        expiresAt: undefined
      });

      if (response.success && response.data) {
        onQuestCreated?.(response.data.quest);
        onClose?.();
      }
    } catch (err) {
      setError('Failed to create quest from suggestion');
      console.error('Error creating quest from suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.sendConnectionQuests(userId, userAddress);
      if (response.success && response.data) {
        onQuestCreated?.(response.data.quests);
        onClose?.();
      }
    } catch (err) {
      setError('Failed to send connection quests');
      console.error('Error sending connection quests:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendContextualQuests = async (triggerPoint: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.sendContextualQuests(userId, userAddress, triggerPoint as any);
      if (response.success && response.data) {
        onQuestCreated?.(response.data.quests);
        onClose?.();
      }
    } catch (err) {
      setError('Failed to send contextual quests');
      console.error('Error sending contextual quests:', err);
    } finally {
      setLoading(false);
    }
  };

  // New quest generation functions for different types
  const generateTaskQuests = () => {
    setLoading(true);
    setError(null);
    requestTaskQuests();
    setTimeout(() => setLoading(false), 2000); // Give time for socket response
  };

  const generateFocusQuests = () => {
    setLoading(true);
    setError(null);
    requestFocusQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateGoalQuests = () => {
    setLoading(true);
    setError(null);
    requestGoalQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateQuickWinQuests = () => {
    setLoading(true);
    setError(null);
    requestQuickWinQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateLearningQuests = () => {
    setLoading(true);
    setError(null);
    requestLearningQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateWellnessQuests = () => {
    setLoading(true);
    setError(null);
    requestWellnessQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateSocialQuests = () => {
    setLoading(true);
    setError(null);
    requestSocialQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateStreakQuests = () => {
    setLoading(true);
    setError(null);
    requestStreakQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateNoteQuests = () => {
    setLoading(true);
    setError(null);
    requestNoteQuests();
    setTimeout(() => setLoading(false), 2000);
  };

  const generateGoalTaskSuggestions = () => {
    setLoading(true);
    setError(null);
    requestGoalTaskSuggestions();
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🎯 Quest Creator</h2>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Quest Type Selector */}
      <div className={styles.typeSelector}>
        <button
          className={`${styles.typeButton} ${questType === 'priority' ? styles.active : ''}`}
          onClick={() => setQuestType('priority')}
        >
          🏆 Generate Priority Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'task' ? styles.active : ''}`}
          onClick={() => setQuestType('task')}
        >
          📋 Task Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'focus' ? styles.active : ''}`}
          onClick={() => setQuestType('focus')}
        >
          🎯 Focus Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'goal' ? styles.active : ''}`}
          onClick={() => setQuestType('goal')}
        >
          🎯 Goal Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'quick_win' ? styles.active : ''}`}
          onClick={() => setQuestType('quick_win')}
        >
          ⚡ Quick Win Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'learning' ? styles.active : ''}`}
          onClick={() => setQuestType('learning')}
        >
          📚 Learning Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'wellness' ? styles.active : ''}`}
          onClick={() => setQuestType('wellness')}
        >
          🧘 Wellness Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'social' ? styles.active : ''}`}
          onClick={() => setQuestType('social')}
        >
          🤝 Social Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'streak' ? styles.active : ''}`}
          onClick={() => setQuestType('streak')}
        >
          🔥 Streak Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'note' ? styles.active : ''}`}
          onClick={() => setQuestType('note')}
        >
          📝 Note Quests
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'goal_task_suggestions' ? styles.active : ''}`}
          onClick={() => setQuestType('goal_task_suggestions')}
        >
          🎯 Goal-Based Task Suggestions
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'generic' ? styles.active : ''}`}
          onClick={() => setQuestType('generic')}
        >
          🎲 Create Generic Quest
        </button>
        <button
          className={`${styles.typeButton} ${questType === 'suggestion' ? styles.active : ''}`}
          onClick={() => setQuestType('suggestion')}
        >
          🧠 Create Suggestion Quest
        </button>
      </div>

      {/* Priority Quest Generation */}
      {questType === 'priority' && (
        <div className={styles.prioritySection}>
          <h3>🏆 Priority-Based Quest Generation</h3>
          <p className={styles.description}>
            Generate quests based on your current tasks and priorities. The system will analyze your tasks and create personalized quests to help you stay focused and productive.
          </p>

          {loading ? (
            <div className={styles.loading}>Analyzing your tasks...</div>
          ) : taskSummary ? (
            <div className={styles.taskSummary}>
              <h4>📊 Your Task Summary</h4>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Tasks:</span>
                  <span className={styles.summaryValue}>{taskSummary.totalTasks}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>High Priority:</span>
                  <span className={`${styles.summaryValue} ${styles.highPriority}`}>
                    {taskSummary.highPriority}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Medium Priority:</span>
                  <span className={`${styles.summaryValue} ${styles.mediumPriority}`}>
                    {taskSummary.mediumPriority}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Low Priority:</span>
                  <span className={`${styles.summaryValue} ${styles.lowPriority}`}>
                    {taskSummary.lowPriority}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Overdue:</span>
                  <span className={`${styles.summaryValue} ${styles.overdue}`}>
                    {taskSummary.overdue}
                  </span>
                </div>
              </div>

              {taskSummary.recentTasks.length > 0 && (
                <div className={styles.recentTasks}>
                  <h5>📝 Recent Tasks</h5>
                  <div className={styles.taskList}>
                    {taskSummary.recentTasks.map((task: any, index: number) => (
                      <div key={index} className={styles.taskItem}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <span className={`${styles.taskPriority} ${styles[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={styles.taskDueDate}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noData}>
              <p>📋 No task data available. Create some tasks first to get personalized quest suggestions!</p>
            </div>
          )}

          <div className={styles.priorityActions}>
            <button
              className={styles.generatePriorityButton}
              onClick={generatePriorityQuests}
              disabled={loading}
            >
              {loading ? '🎯 Generating Priority Quests...' : '🎯 Generate Priority Quests'}
            </button>
            
            <button
              className={styles.testButton}
              onClick={testPersonalization}
              disabled={loading}
            >
              🧪 Test Personalization
            </button>
            
            <div className={styles.priorityInfo}>
              <h5>✨ What you'll get:</h5>
              <ul>
                <li>🔥 High Priority Sprint - Focus on your most important tasks</li>
                <li>⏰ Catch Up Quest - Complete overdue tasks</li>
                <li>📋 Steady Progress - Work on medium priority tasks</li>
                <li>🗂️ Task Organization - Organize your task system</li>
                <li>🎯 Focus Sessions - Dedicated time for priority work</li>
                {(!taskSummary || taskSummary.totalTasks < 2) && (
                  <li>👋 Welcome Quests - Get started with basic activities</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Task Quest Generation */}
      {questType === 'task' && (
        <div className={styles.questSection}>
          <h3>📋 Task-Based Quest Generation</h3>
          <p className={styles.description}>
            Generate quests specifically focused on your current tasks. These quests will help you tackle your task list more effectively.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateTaskQuests}
            disabled={loading}
          >
            {loading ? '📋 Generating Task Quests...' : '📋 Generate Task Quests'}
          </button>
        </div>
      )}

      {/* Focus Quest Generation */}
      {questType === 'focus' && (
        <div className={styles.questSection}>
          <h3>🎯 Focus-Based Quest Generation</h3>
          <p className={styles.description}>
            Generate quests designed to improve your focus and concentration. These quests will help you build better focus habits.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateFocusQuests}
            disabled={loading}
          >
            {loading ? '🎯 Generating Focus Quests...' : '🎯 Generate Focus Quests'}
          </button>
        </div>
      )}

      {/* Goal Quest Generation */}
      {questType === 'goal' && (
        <div className={styles.questSection}>
          <h3>🎯 Goal-Based Quest Generation</h3>
          <p className={styles.description}>
            Generate quests aligned with your current goals. These quests will help you make progress toward your objectives.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateGoalQuests}
            disabled={loading}
          >
            {loading ? '🎯 Generating Goal Quests...' : '🎯 Generate Goal Quests'}
          </button>
        </div>
      )}

      {/* Quick Win Quest Generation */}
      {questType === 'quick_win' && (
        <div className={styles.questSection}>
          <h3>⚡ Quick Win Quest Generation</h3>
          <p className={styles.description}>
            Generate short, achievable quests that you can complete quickly. These are perfect for building momentum and motivation.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateQuickWinQuests}
            disabled={loading}
          >
            {loading ? '⚡ Generating Quick Win Quests...' : '⚡ Generate Quick Win Quests'}
          </button>
        </div>
      )}

      {/* Learning Quest Generation */}
      {questType === 'learning' && (
        <div className={styles.questSection}>
          <h3>📚 Learning Quest Generation</h3>
          <p className={styles.description}>
            Generate quests focused on learning and skill development. These quests will help you grow and expand your knowledge.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateLearningQuests}
            disabled={loading}
          >
            {loading ? '📚 Generating Learning Quests...' : '📚 Generate Learning Quests'}
          </button>
        </div>
      )}

      {/* Wellness Quest Generation */}
      {questType === 'wellness' && (
        <div className={styles.questSection}>
          <h3>🧘 Wellness Quest Generation</h3>
          <p className={styles.description}>
            Generate quests focused on your well-being and self-care. These quests will help you maintain a healthy work-life balance.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateWellnessQuests}
            disabled={loading}
          >
            {loading ? '🧘 Generating Wellness Quests...' : '🧘 Generate Wellness Quests'}
          </button>
        </div>
      )}

      {/* Social Quest Generation */}
      {questType === 'social' && (
        <div className={styles.questSection}>
          <h3>🤝 Social Quest Generation</h3>
          <p className={styles.description}>
            Generate quests focused on social connections and networking. These quests will help you build relationships and collaborate.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateSocialQuests}
            disabled={loading}
          >
            {loading ? '🤝 Generating Social Quests...' : '🤝 Generate Social Quests'}
          </button>
        </div>
      )}

      {/* Streak Quest Generation */}
      {questType === 'streak' && (
        <div className={styles.questSection}>
          <h3>🔥 Streak-Based Quest Generation</h3>
          <p className={styles.description}>
            Generate quests based on your current streaks and milestones. These quests will help you maintain momentum and build consistency.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateStreakQuests}
            disabled={loading}
          >
            {loading ? '🔥 Generating Streak Quests...' : '🔥 Generate Streak Quests'}
          </button>
        </div>
      )}

      {/* Note Quest Generation */}
      {questType === 'note' && (
        <div className={styles.questSection}>
          <h3>📝 Note-Based Quest Generation</h3>
          <p className={styles.description}>
            Generate quests focused on note-taking and knowledge management. These quests will help you organize and review your notes effectively.
          </p>
          <button
            className={styles.generateButton}
            onClick={generateNoteQuests}
            disabled={loading}
          >
            {loading ? '📝 Generating Note Quests...' : '📝 Generate Note Quests'}
          </button>
        </div>
      )}

      {/* Goal-Based Task Suggestions Generation */}
      {questType === 'goal_task_suggestions' && (
        <div className={styles.questSection}>
          <h3>🎯 Goal-Based Task Suggestions</h3>
          <p className={styles.description}>
            Generate interesting task suggestions based on your current goals. The system will analyze your goals and create actionable quests to help you achieve them.
          </p>
          <div className={styles.goalSuggestionsInfo}>
            <h4>What you'll get:</h4>
            <ul>
              <li>📋 <strong>Goal Breakdown Quests:</strong> Break down your goals into actionable subtasks</li>
              <li>🔍 <strong>Research Quests:</strong> Find resources and best practices for your goals</li>
              <li>🚀 <strong>First Step Quests:</strong> Take concrete actions toward your goals</li>
              <li>📊 <strong>Progress Tracking Quests:</strong> Monitor and reflect on your progress</li>
            </ul>
          </div>
          <button
            className={styles.generateButton}
            onClick={generateGoalTaskSuggestions}
            disabled={loading}
          >
            {loading ? '🎯 Generating Goal-Based Task Suggestions...' : '🎯 Generate Goal-Based Task Suggestions'}
          </button>
        </div>
      )}

      {/* Generic Quest Creation */}
      {questType === 'generic' && (
        <form onSubmit={handleGenericQuestSubmit} className={styles.form}>
          <h3>🎲 Create Custom Quest</h3>
          
          <div className={styles.formGroup}>
            <label>Quest Name</label>
            <input
              type="text"
              value={genericQuest.name}
              onChange={(e) => setGenericQuest({ ...genericQuest, name: e.target.value })}
              placeholder="Enter quest name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={genericQuest.description}
              onChange={(e) => setGenericQuest({ ...genericQuest, description: e.target.value })}
              placeholder="Describe what the user needs to do"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                value={genericQuest.category}
                onChange={(e) => setGenericQuest({ ...genericQuest, category: e.target.value as any })}
              >
                <option value="focus">Focus</option>
                <option value="tasks">Tasks</option>
                <option value="goals">Goals</option>
                <option value="notes">Notes</option>
                <option value="learning">Learning</option>
                <option value="social">Social</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Difficulty</label>
              <select
                value={genericQuest.difficulty}
                onChange={(e) => setGenericQuest({ ...genericQuest, difficulty: parseInt(e.target.value) as any })}
              >
                <option value={1}>⭐ Easy</option>
                <option value={2}>⭐⭐ Medium</option>
                <option value={3}>⭐⭐⭐ Hard</option>
                <option value={4}>⭐⭐⭐⭐ Expert</option>
                <option value={5}>⭐⭐⭐⭐⭐ Master</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Reward XP</label>
              <input
                type="number"
                value={genericQuest.rewardXp}
                onChange={(e) => setGenericQuest({ ...genericQuest, rewardXp: parseInt(e.target.value) })}
                min="1"
                max="1000"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Reward Tokens</label>
              <input
                type="number"
                value={genericQuest.rewardTokens}
                onChange={(e) => setGenericQuest({ ...genericQuest, rewardTokens: parseInt(e.target.value) })}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Completion Type</label>
              <select
                value={genericQuest.completionCriteria.type}
                onChange={(e) => setGenericQuest({
                  ...genericQuest,
                  completionCriteria: { ...genericQuest.completionCriteria, type: e.target.value as any }
                })}
              >
                <option value="count">Count</option>
                <option value="duration">Duration</option>
                <option value="streak">Streak</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Target</label>
              <input
                type="number"
                value={genericQuest.completionCriteria.target}
                onChange={(e) => setGenericQuest({
                  ...genericQuest,
                  completionCriteria: { ...genericQuest.completionCriteria, target: parseInt(e.target.value) }
                })}
                min="1"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={genericQuest.expiresAt}
              onChange={(e) => setGenericQuest({ ...genericQuest, expiresAt: e.target.value })}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Creating...' : 'Create Quest'}
          </button>
        </form>
      )}

      {/* Suggestion Quest Form */}
      {questType === 'suggestion' && (
        <div className={styles.suggestionSection}>
          <h3>🧠 AI-Powered Quest Suggestions</h3>
          
          {loading ? (
            <div className={styles.loading}>Loading suggestions...</div>
          ) : (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion, index) => (
                <div key={index} className={styles.suggestionCard}>
                  <div className={styles.suggestionHeader}>
                    <h4>{suggestion.title}</h4>
                    <div className={styles.suggestionMeta}>
                      <span className={styles.difficulty}>
                        {'⭐'.repeat(suggestion.difficulty)}
                      </span>
                      <span className={styles.confidence}>
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  
                  <p className={styles.suggestionDescription}>{suggestion.description}</p>
                  
                  <div className={styles.suggestionRewards}>
                    <span>⭐ {suggestion.estimatedReward.xp} XP</span>
                    <span>🪙 {suggestion.estimatedReward.tokens} Tokens</span>
                  </div>
                  
                  <button
                    className={styles.createFromSuggestionButton}
                    onClick={() => createFromSuggestion(suggestion)}
                    disabled={loading}
                  >
                    Create Quest from Suggestion
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSuggestionQuestSubmit} className={styles.form}>
            <h3>🧠 Create Custom Suggestion Quest</h3>
            
            <div className={styles.formGroup}>
              <label>Suggestion Type</label>
              <select
                value={suggestionQuest.suggestionType}
                onChange={(e) => setSuggestionQuest({ ...suggestionQuest, suggestionType: e.target.value as any })}
              >
                <option value="productivity">Productivity</option>
                <option value="wellness">Wellness</option>
                <option value="learning">Learning</option>
                <option value="social">Social</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>AI Reasoning</label>
              <textarea
                value={suggestionQuest.aiReasoning}
                onChange={(e) => setSuggestionQuest({ ...suggestionQuest, aiReasoning: e.target.value })}
                placeholder="Explain why this quest would be beneficial for the user"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Difficulty</label>
              <select
                value={suggestionQuest.difficulty}
                onChange={(e) => setSuggestionQuest({ ...suggestionQuest, difficulty: parseInt(e.target.value) as any })}
              >
                <option value={1}>⭐ Easy</option>
                <option value={2}>⭐⭐ Medium</option>
                <option value={3}>⭐⭐⭐ Hard</option>
                <option value={4}>⭐⭐⭐⭐ Expert</option>
                <option value={5}>⭐⭐⭐⭐⭐ Master</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={suggestionQuest.expiresAt}
                onChange={(e) => setSuggestionQuest({ ...suggestionQuest, expiresAt: e.target.value })}
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Suggestion Quest'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 