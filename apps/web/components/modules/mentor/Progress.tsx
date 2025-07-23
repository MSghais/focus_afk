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



export default function ProgressMentor() {
  const { timerSessions, tasks, goals } = useFocusAFKStore();
  const { showToast } = useUIStore();
  const apiService = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recentFeedback, setRecentFeedback] = useState<MentorFeedback | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const { getTaskStats, getFocusStats, getBreakStats, getDeepFocusStats } = useFocusAFKStore();
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });

  const [focusStats, setFocusStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
  });

  const [breakStats, setBreakStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
  });

  const [deepFocusStats, setDeepFocusStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
  });

  useEffect(() => {
    const loadStats = async () => {
      const [taskStatsData, focusStatsData, breakStatsData, deepFocusStatsData] = await Promise.all([
        getTaskStats(),
        getFocusStats(7),
        getBreakStats(7),
        getDeepFocusStats(7)
      ]);
      setTaskStats(taskStatsData);
      setFocusStats(focusStatsData);
      setBreakStats(breakStatsData);
      setDeepFocusStats(deepFocusStatsData);
    }
    loadStats();
  }, [tasks, goals, timerSessions, getTaskStats, getFocusStats, getBreakStats, getDeepFocusStats]);
  // Use real data from Zustand store (already in useFocusAFKStore)
  // This version is adapted to match the dashboard stats calculation style from @file_context_0

  const getProductivityInsights = () => {
    // Task completion
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Focus time
    const totalFocusTime = timerSessions.reduce((acc, session) => acc + (session.duration || 0), 0);
    const totalFocusMinutes = Math.floor(totalFocusTime / 60);
    const totalFocusHours = Math.floor(totalFocusMinutes / 60);

    // Average session length (in minutes)
    const averageSessionLength = timerSessions.length > 0 ? totalFocusTime / timerSessions.length : 0;
    const averageSessionMinutes = Math.round(averageSessionLength / 60);

    // Today's streak (sessions started today)
    const todayStr = new Date().toDateString();
    const streak = timerSessions.filter(session => {
      if (!session.startTime) return false;
      return new Date(session.startTime).toDateString() === todayStr;
    }).length;

    return {
      taskCompletion,
      totalFocusHours,
      totalFocusMinutes,
      averageSessionMinutes,
      streak
    };
  };


  return (

    <div className={styles.mentorGrid}>
      {/* Productivity Insights */}
      <div className={styles.insightsCard}>
        <h2 className={styles.cardTitle}>Your Progress</h2>
        <div className={styles.insightsGrid}>
          <div className={styles.insight}>
            <span className={styles.insightValue}>{taskStats.completed}%</span>
            <span className={styles.insightLabel}>Task Completion</span>
          </div>
          <div className={styles.insight}>
            <span className={styles.insightValue}>{focusStats.totalMinutes?.toFixed(2)} min</span>
            <span className={styles.insightLabel}>Total Focus Time</span>
          </div>
          <div className={styles.insight}>
            <span className={styles.insightValue}>{focusStats.averageSessionLength?.toFixed(2)}m</span>
            <span className={styles.insightLabel}>Avg Session</span>
          </div>
          <div className={styles.insight}>
            <span className={styles.insightValue}>{focusStats.sessionsByDay.length}</span>
            <span className={styles.insightLabel}>Today's Sessions</span>
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      {/* <div className={styles.actionsCard}>
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
      </div> */}
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