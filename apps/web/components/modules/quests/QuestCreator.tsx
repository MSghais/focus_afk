import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
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
  const [questType, setQuestType] = useState<'generic' | 'suggestion'>('generic');
  const [suggestions, setSuggestions] = useState<QuestSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>⚡ Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button
            className={styles.actionButton}
            onClick={sendConnectionQuests}
            disabled={loading}
          >
            🔗 Send Connection Quests
          </button>
          <button
            className={styles.actionButton}
            onClick={() => sendContextualQuests('task_completion')}
            disabled={loading}
          >
            ✅ Task Completion Quests
          </button>
          <button
            className={styles.actionButton}
            onClick={() => sendContextualQuests('focus_session')}
            disabled={loading}
          >
            ⏲️ Focus Session Quests
          </button>
          <button
            className={styles.actionButton}
            onClick={() => sendContextualQuests('level_up')}
            disabled={loading}
          >
            ⭐ Level Up Quests
          </button>
        </div>
      </div>

      {/* Generic Quest Form */}
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