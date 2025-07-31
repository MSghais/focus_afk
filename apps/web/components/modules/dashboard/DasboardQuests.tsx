'use client'

import { useEffect, useState } from 'react';
import styles from '../../../styles/components/dashboard.module.scss';
import { useFocusAFKStore } from '../../../store/store';
import { useAuthStore } from '../../../store/auth';
import { formatTime } from '../../../lib/format';
import { useUIStore } from '../../../store/uiStore';
import Link from 'next/link';
import { Icon } from '../../small/icons';
import { ButtonSecondary } from '../../small/buttons';
import QuestList from '../quests/QuestList';
import Badges from '../../profile/Badges';
import EnhancedQuestList from '../quests/EnhancedQuestList';

export default function DashboardQuests() {

  const { showToast, showModal } = useUIStore();
  const {
    tasks,
    goals,
    timerSessions,
    settings,
    getTaskStats,
    getFocusStats,
    getBreakStats,
    setCurrentModule
  } = useFocusAFKStore();
  const { userConnected } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'main' | 'quests' | 'badges' | "lfg_session">('main');


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

  useEffect(() => {
    const loadStats = async () => {
      const [taskStatsData, focusStatsData, breakStatsData] = await Promise.all([
        getTaskStats(),
        getFocusStats(7),
        getBreakStats(7)
      ]);
      // setTaskStats(taskStatsData);
      setFocusStats(focusStatsData);
      setBreakStats(breakStatsData);
    };

    loadStats();
  }, [tasks, goals, timerSessions, getTaskStats, getFocusStats]);


  const [breakStats, setBreakStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
  });

  useEffect(() => {
    const loadStats = async () => {
      const [taskStatsData, focusStatsData, breakStatsData] = await Promise.all([
        getTaskStats(),
        getFocusStats(7),
        getBreakStats(7)
      ]);
      setTaskStats(taskStatsData);
      setFocusStats(focusStatsData);
      setBreakStats(breakStatsData);
    };

    loadStats();
  }, [tasks, goals, timerSessions, getTaskStats, getFocusStats]);

  // TODO proof submission

  // TODO quests

  // TODO daily streak

  // Calculate daily streak
  const calculateStreak = (sessionsByDay: { date: string; sessions: number; minutes: number }[]) => {
    if (!sessionsByDay || sessionsByDay.length === 0) return 0;
    // Sort by date descending
    const sorted = [...sessionsByDay].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    let current = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const day = new Date(sorted[i]?.date || new Date().toISOString());
      // If first day, check if today or yesterday
      if (i === 0) {
        const diff = Math.floor((current.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 1) break; // streak broken
        streak++;
        current = day;
      } else {
        // Check if previous day
        const diff = Math.floor((current.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
        if (diff !== 1) break;
        streak++;
        current = day;
      }
    }
    return streak;
  };

  const streak = calculateStreak(focusStats.sessionsByDay || []);

  return (
    <div className={styles.dashboardContainer}>
      {/* <div className={styles.dashboardHeader}>FOCUSFI</div> */}
      {/* <div style={{ color: 'var(--foreground)', fontWeight: 500, textAlign: 'center', marginBottom: '2rem', width: '100%' }}>
        Bet. Focus. Prove. Earn.
      </div> */}

      <div className={styles.dashboardContent} style={{ width: '100%' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>Proof of Focus</div>
        {/* <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>AI-Verified Proof of Focus</div> */}
        <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 8 }}>
              <svg width="64" height="64">
                <circle cx="32" cy="32" r="28" stroke="#333" strokeWidth="6" fill="none" />
                <circle cx="32" cy="32" r="28" stroke="var(--brand-accent)" strokeWidth="6" fill="none" strokeDasharray="176" strokeDashoffset="44" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--foreground)' }}>{formatTime(focusStats.totalMinutes)}</div>
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Focus Session</div>
            <div style={{ color: 'var(--brand-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* <span style={{ fontSize: '1.1rem' }}>✔️</span> Proof submitted */}
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>🔥</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Daily Streak</div>
            <div style={{ color: 'var(--feed-text, var(--foreground))', fontSize: '0.95rem', fontWeight: 700 }}>
              {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
            </div>
          </div>
        </div>


      </div>

      <Badges isEnabledRefreshButton={false} />

      <QuestList quests={[]} isEnabledRefreshButton={false} />

      {/* <EnhancedQuestList userId={userConnected?.id || ''} userAddress={userConnected?.userAddress || ''} /> */}

      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Set a Goal & Stake</div>
        <div style={{ fontSize: '1.1rem', marginBottom: 8 }}>Complete 20 Pomodoros<br />in a week</div>
        <div style={{ color: 'var(--feed-text, var(--foreground))', fontWeight: 500, fontSize: '1rem' }}>
          Tokens <span style={{ fontSize: '1.2rem' }}>🪙</span> 20
        </div>
      </div>

      {/* <div className={styles.dashboardContent} style={{ width: '100%' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>Social & Viral Mechanics</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--foreground)', background: 'rgba(255,255,255,0.01)' }}>
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Join Guild</span>
        </div>
      </div> */}
    </div>
  );
}