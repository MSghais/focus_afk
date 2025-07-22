'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/mentor.module.scss';
import ChatAi from '../ChatAi';
import { apiService, Message } from '../../../lib/api';
import type { Mentor } from '../../../lib/api';
import { useUIStore } from '../../../store/uiStore';

interface MentorFeedback {
  sessionId: string;
  rating: number;
  message: string;
  tips: string[];
  nextSteps: string[];
}

export default function Mentor() {
  const { timerSessions, tasks, goals } = useFocusAFKStore();
  const { showToast } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recentFeedback, setRecentFeedback] = useState<MentorFeedback | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  useEffect(() => {
    loadMessages();
    loadMentors();
    
    // Load recent session feedback
    if (timerSessions.length > 0) {
      const latestSession = timerSessions[0];
      generateSessionFeedback(latestSession);
    }
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const response = await apiService.getMessages({ limit: 20 });
      
      if (response.success && response.data) {
        // Sort messages by creation date (oldest first for chat display)
        const sortedMessages = response.data.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
      } else {
        console.error('Failed to load messages:', response.error);
        showToast({
          message: 'Failed to load chat history',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showToast({
        message: 'Error loading chat history',
        type: 'error',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMentors = async () => {
    try {
      const response = await apiService.getMentors();
      if (response.success && response.data) {
        setMentors(response.data);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const generateSessionFeedback = async (session: any) => {
    // Simulate AI feedback generation
    const feedback: MentorFeedback = {
      sessionId: session.id,
      rating: session.duration > 25 * 60 ? 5 : 4,
      message: session.duration > 25 * 60
        ? "Excellent focus session! You maintained concentration for a full Pomodoro cycle."
        : "Good work! You're building consistent focus habits.",
      tips: [
        "Try breaking complex tasks into smaller chunks",
        "Take regular breaks to maintain mental clarity",
        "Set specific goals for each session"
      ],
      nextSteps: [
        "Schedule your next focus session",
        "Review and update your task priorities",
        "Set a new learning goal"
      ]
    };
    setRecentFeedback(feedback);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send message to backend
      const response = await apiService.sendChatMessage({
        prompt: userMessage,
        mentorId: mentors[0]?.id, // Use first mentor if available
      });

      if (response.success) {
        // Reload messages to get the updated conversation
        await loadMessages();
      } else {
        showToast({
          message: response.error || 'Failed to send message',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast({
        message: 'Error sending message',
        type: 'error',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getProductivityInsights = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalFocusTime = timerSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionLength = timerSessions.length > 0 ? totalFocusTime / timerSessions.length : 0;

    return {
      taskCompletion: Math.round((completedTasks / tasks.length) * 100) || 0,
      totalFocusHours: Math.round(totalFocusTime / 3600 * 10) / 10,
      averageSessionMinutes: Math.round(averageSessionLength / 60),
      streak: timerSessions.filter(s =>
        new Date(s.startTime).toDateString() === new Date().toDateString()
      ).length
    };
  };

  const insights = getProductivityInsights();

  return (
    <div className={styles.mentor}>
      <h1 className={styles.title}>AI Mentor</h1>

      <div className={styles.mentorGrid}>
        {/* Productivity Insights */}
        <div className={styles.insightsCard}>
          <h2 className={styles.cardTitle}>Your Progress</h2>
          <div className={styles.insightsGrid}>
            <div className={styles.insight}>
              <span className={styles.insightValue}>{insights.taskCompletion}%</span>
              <span className={styles.insightLabel}>Task Completion</span>
            </div>
            <div className={styles.insight}>
              <span className={styles.insightValue}>{insights.totalFocusHours}h</span>
              <span className={styles.insightLabel}>Total Focus Time</span>
            </div>
            <div className={styles.insight}>
              <span className={styles.insightValue}>{insights.averageSessionMinutes}m</span>
              <span className={styles.insightLabel}>Avg Session</span>
            </div>
            <div className={styles.insight}>
              <span className={styles.insightValue}>{insights.streak}</span>
              <span className={styles.insightLabel}>Today's Sessions</span>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className={styles.chatCard}>
          <h2 className={styles.cardTitle}>Chat with AI Mentor</h2>
          <div className={styles.chatMessages}>
            {isLoadingMessages ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                <p>Loading chat history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Start a conversation with your AI mentor!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
                  <div className={styles.messageContent}>{message.content}</div>
                  <div className={styles.messageTime}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className={`${styles.message} ${styles.ai}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything about productivity, focus, or your goals..."
              className={styles.input}
              disabled={isTyping}
            />
            <button 
              onClick={sendMessage} 
              className={styles.sendButton}
              disabled={isTyping || !inputMessage.trim()}
            >
              ➤
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.actionsCard}>
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <button className={styles.actionButton}>
              📊 Get Weekly Report
            </button>
            <button className={styles.actionButton}>
              🎯 Set New Goal
            </button>
            <button className={styles.actionButton}>
              ⏱️ Start Focus Session
            </button>
            <button className={styles.actionButton}>
              📚 Learning Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      {recentFeedback && (
        <div className={styles.feedbackCard}>
          <h2 className={styles.cardTitle}>Latest Session Feedback</h2>
          <div className={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`${styles.star} ${i < recentFeedback.rating ? styles.filled : ''}`}>
                ⭐
              </span>
            ))}
          </div>
          <p className={styles.feedbackMessage}>{recentFeedback.message}</p>
          <div className={styles.tips}>
            <h3>Quick Tips:</h3>
            <ul>
              {recentFeedback.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 