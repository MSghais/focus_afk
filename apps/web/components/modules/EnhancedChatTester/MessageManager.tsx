'use client';

import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { useUIStore } from '../../../store/uiStore';
import { Message, Chat } from '../../../types';
import styles from './EnhancedChatTester.module.scss';

interface MessageManagerProps {
  onMessageSelect?: (message: Message) => void;
}

interface MessageFilters {
  limit: number;
  offset: number;
  chatId?: string;
  mentorId?: string;
  useCase?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

interface MessageStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalChats: number;
  useCaseStats: Record<string, number>;
  recentActivity: number;
  averageMessagesPerChat: number;
}

export default function MessageManager({ onMessageSelect }: MessageManagerProps) {
  const apiService = useApi();
  const { showToast } = useUIStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [filters, setFilters] = useState<MessageFilters>({
    limit: 20,
    offset: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  // Load chats for filter dropdown
  useEffect(() => {
    loadChats();
  }, []);

  // Load message statistics
  useEffect(() => {
    loadStats();
  }, []);

  // Load messages when filters change
  useEffect(() => {
    loadMessages();
  }, [filters]);

  const loadChats = async () => {
    try {
      const response = await apiService.getChats({ limit: 100 });
      if (response.success && response.data) {
        setChats(response.data);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getEnhancedChatMessageStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getEnhancedChatMessages(filters);
      if (response.success && response.data) {
        setMessages(response.data.messages);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showToast({
        message: 'Failed to load messages',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.getEnhancedChatMessagesByChat(chatId, {
        limit: filters.limit,
        offset: filters.offset,
      });
      if (response.success && response.data) {
        setMessages(response.data.messages);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      showToast({
        message: 'Failed to load chat messages',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await apiService.deleteEnhancedChatMessage(messageId);
      if (response.success) {
        showToast({
          message: 'Message deleted successfully',
          type: 'success',
        });
        loadMessages(); // Reload messages
        loadStats(); // Reload stats
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast({
        message: 'Failed to delete message',
        type: 'error',
      });
    }
  };

  const deleteMessages = async (deleteFilters?: {
    chatId?: string;
    mentorId?: string;
    useCase?: string;
    beforeDate?: string;
  }) => {
    try {
      const response = await apiService.deleteEnhancedChatMessages(deleteFilters);
      if (response.success) {
        showToast({
          message: `Deleted ${response.data?.deletedCount || 0} messages successfully`,
          type: 'success',
        });
        loadMessages(); // Reload messages
        loadStats(); // Reload stats
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
      showToast({
        message: 'Failed to delete messages',
        type: 'error',
      });
    }
  };

  const updateEmbeddings = async (dataTypes?: string[]) => {
    try {
      const response = await apiService.updateEnhancedChatEmbeddings(dataTypes);
      if (response.success) {
        showToast({
          message: 'Embeddings updated successfully',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error updating embeddings:', error);
      showToast({
        message: 'Failed to update embeddings',
        type: 'error',
      });
    }
  };

  const handleFilterChange = (key: keyof MessageFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset offset when filters change
    }));
  };

  const handleChatChange = (chatId: string) => {
    setSelectedChatId(chatId);
    if (chatId) {
      loadChatMessages(chatId);
    } else {
      handleFilterChange('chatId', undefined);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore) {
      setFilters(prev => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUseCaseLabel = (useCase: string) => {
    const useCaseMap: Record<string, string> = {
      general_chat: 'General Chat',
      task_planning: 'Task Planning',
      goal_tracking: 'Goal Tracking',
      focus_sessions: 'Focus Sessions',
      note_analysis: 'Note Analysis',
      mentor_specific: 'Mentor Specific',
      quick_question: 'Quick Question',
      deep_analysis: 'Deep Analysis',
    };
    return useCaseMap[useCase] || useCase;
  };

  return (
    <div className={styles.messageManager}>
      <div className={styles.messageManagerHeader}>
        <h3>Message Management</h3>
        <div className={styles.messageManagerActions}>
          <button
            onClick={() => updateEmbeddings()}
            className={styles.actionButton}
          >
            Update Embeddings
          </button>
          <button
            onClick={() => deleteMessages()}
            className={`${styles.actionButton} ${styles.dangerButton}`}
          >
            Clear All Messages
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className={styles.statsSection}>
          <h4>Message Statistics</h4>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Messages:</span>
              <span className={styles.statValue}>{stats.totalMessages}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>User Messages:</span>
              <span className={styles.statValue}>{stats.userMessages}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Assistant Messages:</span>
              <span className={styles.statValue}>{stats.assistantMessages}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Chats:</span>
              <span className={styles.statValue}>{stats.totalChats}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Recent Activity (7d):</span>
              <span className={styles.statValue}>{stats.recentActivity}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Avg Messages/Chat:</span>
              <span className={styles.statValue}>{stats.averageMessagesPerChat}</span>
            </div>
          </div>

          {/* Use Case Statistics */}
          <div className={styles.useCaseStats}>
            <h5>Messages by Use Case</h5>
            <div className={styles.useCaseStatsGrid}>
              {Object.entries(stats.useCaseStats).map(([useCase, count]) => (
                <div key={useCase} className={styles.useCaseStatItem}>
                  <span className={styles.useCaseLabel}>{getUseCaseLabel(useCase)}:</span>
                  <span className={styles.useCaseCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersSection}>
        <h4>Filters</h4>
        <div className={styles.filtersGrid}>
          <div className={styles.filterItem}>
            <label>Chat:</label>
            <select
              value={selectedChatId}
              onChange={(e) => handleChatChange(e.target.value)}
              className={styles.select}
            >
              <option value="">All Chats</option>
              {chats.map(chat => (
                <option key={chat.id} value={chat.id}>
                  {chat.title || `Chat ${chat?.id?.substring(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>Use Case:</label>
            <select
              value={filters.useCase || ''}
              onChange={(e) => handleFilterChange('useCase', e.target.value || undefined)}
              className={styles.select}
            >
              <option value="">All Use Cases</option>
              <option value="general_chat">General Chat</option>
              <option value="task_planning">Task Planning</option>
              <option value="goal_tracking">Goal Tracking</option>
              <option value="focus_sessions">Focus Sessions</option>
              <option value="note_analysis">Note Analysis</option>
              <option value="mentor_specific">Mentor Specific</option>
              <option value="quick_question">Quick Question</option>
              <option value="deep_analysis">Deep Analysis</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>Role:</label>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              className={styles.select}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>Limit:</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className={styles.select}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className={styles.messagesSection}>
        <h4>Messages ({pagination.total})</h4>
        
        {isLoading ? (
          <div className={styles.loading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>No messages found</div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message) => (
              <div key={message.id} className={styles.messageItem}>
                <div className={styles.messageHeader}>
                  <span className={`${styles.messageRole} ${styles[`role${message.role}`]}`}>
                    {message.role}
                  </span>
                  <span className={styles.messageDate}>
                    {formatDate(message.createdAt || '')}
                  </span>
                  {message.metadata?.useCase && (
                    <span className={styles.messageUseCase}>
                      {getUseCaseLabel(message.metadata.useCase)}
                    </span>
                  )}
                  <div className={styles.messageActions}>
                    {onMessageSelect && (
                      <button
                        onClick={() => onMessageSelect(message)}
                        className={styles.actionButton}
                      >
                        View
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(message.id || '')}
                      className={`${styles.actionButton} ${styles.dangerButton}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className={styles.messageContent}>
                  {message.content.length > 200
                    ? `${message.content.substring(0, 200)}...`
                    : message.content
                  }
                </div>
                {message.metadata && (
                  <div className={styles.messageMetadata}>
                    <small>
                      Model: {message.model || 'Unknown'} | 
                      Tokens: {message.tokens || 'N/A'} |
                      Vector Search: {message.metadata.vectorSearchUsed ? 'Yes' : 'No'} |
                      Context Size: {message.metadata.totalContextSize || 'N/A'}
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.hasMore && (
          <div className={styles.pagination}>
            <button
              onClick={loadMore}
              className={styles.loadMoreButton}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 