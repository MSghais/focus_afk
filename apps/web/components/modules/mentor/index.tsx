'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/mentor.module.scss';

interface MentorMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface MentorFeedback {
  sessionId: number;
  rating: number;
  message: string;
  tips: string[];
  nextSteps: string[];
}

export default function Mentor() {
  const { timerSessions, tasks, goals } = useFocusAFKStore();
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recentFeedback, setRecentFeedback] = useState<MentorFeedback | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: '1',
        type: 'ai',
        content: "Hi! I'm your AI mentor. I'm here to help you stay focused and productive. How can I assist you today?",
        timestamp: new Date()
      }
    ]);

    // Load recent session feedback
    if (timerSessions.length > 0) {
      const latestSession = timerSessions[0];
      generateSessionFeedback(latestSession);
    }
  }, []);

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

    const userMessage: MentorMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: MentorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('focus') || lowerMessage.includes('concentrate')) {
      return "Focus is like a muscle - it gets stronger with practice! Try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break. What specific task are you working on?";
    }

    if (lowerMessage.includes('procrastinate') || lowerMessage.includes('motivation')) {
      return "Procrastination often comes from feeling overwhelmed. Break your task into tiny, manageable steps. Start with just 5 minutes - you'll often find yourself wanting to continue!";
    }

    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm')) {
      return "It's normal to feel overwhelmed. Let's take a step back. What's the most important thing you need to accomplish today? Sometimes focusing on just one priority can reduce stress significantly.";
    }

    return "That's a great question! I'd love to help you with that. Could you tell me more about your specific situation or what you're trying to achieve?";
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
            {messages.map((message) => (
              <div key={message.id} className={`${styles.message} ${styles[message.type]}`}>
                <div className={styles.messageContent}>{message.content}</div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
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
            />
            <button onClick={sendMessage} className={styles.sendButton}>
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