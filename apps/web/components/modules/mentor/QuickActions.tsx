'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/mentor.module.scss';
import ChatAi from '../ChatAi';
import { useUIStore } from '../../../store/uiStore';
import { useApi } from '../../../hooks/useApi';
import { Message, Mentor } from '../../../types';

interface MentorFeedback {
  sessionId: string;
  rating: number;
  message: string;
  tips: string[];
  nextSteps: string[];
}



export default function QuickActionsMentor() {
  const { timerSessions, tasks, goals } = useFocusAFKStore();
  const { showToast } = useUIStore();
  const apiService = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recentFeedback, setRecentFeedback] = useState<MentorFeedback | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);



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