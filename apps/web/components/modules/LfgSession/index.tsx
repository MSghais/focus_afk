"use client"

import React, { useState, useEffect } from 'react';
import XPBar from '../../small/XPBar';
import LevelIcon from '../../small/LevelIcon';
import StreakCounter from '../../small/StreakCounter';
import BadgeIcon from '../../small/BadgeIcon';
import AvatarIcon from '../../small/AvatarIcon';
import QuestDetail from '../quests/QuestDetail';
import TimerMain from '../timer/index';
import ChatAi from '../ChatAi/index';
import Badges from '../../profile/Badges';
import { useFocusAFKStore } from '../../../store/store';
import { Badge, Quest } from '../../../lib/gamification';
import { getAwardedBadges, generateQuests, saveBadgesToBackend } from '../../../lib/gamification';
import { useApi } from '../../../hooks/useApi';

const LOCAL_COMPLETED_QUESTS_KEY = 'completedQuests';

function getCompletedQuestsFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_COMPLETED_QUESTS_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveCompletedQuestsToStorage(quests: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_COMPLETED_QUESTS_KEY, JSON.stringify(quests));
}

export default function LfgSession() {
  const api = useApi();
  const {
    timerSessions,
    tasks,
    goals,
    // Add more as needed
  } = useFocusAFKStore();
  // For demo, use mock user data for level, streak, mentorChats
  const [level, setLevel] = useState(5);
  const [streak, setStreak] = useState(7);
  const [mentorChats, setMentorChats] = useState(2);
  const [userId, setUserId] = useState('demo-user'); // Replace with real user id
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>(getCompletedQuestsFromStorage());
  const [quests, setQuests] = useState<Quest[]>([]);

  // Update quests on activity change
  useEffect(() => {
    const newQuests = generateQuests({
      timerSessions,
      tasks,
      goals,
      mentorChats,
      streak,
      level,
      completedQuests,
    });
    setQuests(newQuests);
  }, [timerSessions, tasks, goals, mentorChats, streak, level, completedQuests]);

  // Award badges and mark quests as completed
  useEffect(() => {
    const completed = [...completedQuests];
    let changed = false;
    quests.forEach((q) => {
      if (q.status === 'completed' && !completed.includes(q.id)) {
        completed.push(q.id);
        changed = true;
      }
    });
    if (changed) {
      setCompletedQuests(completed);
      saveCompletedQuestsToStorage(completed);
    }
  }, [quests]);

  // Award badges for new activity
  useEffect(() => {
    async function checkBadges() {
      const newBadges = getAwardedBadges({
        timerSessions,
        tasks,
        mentorChats,
        streak,
        goals,
        badges,
      });
      if (newBadges.length > 0) {
        setBadges([...badges, ...newBadges]);
        await saveBadgesToBackend(api, userId, newBadges);
      }
    }
    checkBadges();
    // eslint-disable-next-line
  }, [timerSessions, tasks, mentorChats, streak, goals]);

  // Session state (for demo)
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0); // 0-100
  const [mentorCheckin, setMentorCheckin] = useState<'none' | 'midway' | 'end'>('none');
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Simulate session progress and mentor check-ins
  useEffect(() => {
    if (!sessionStarted || sessionCompleted) return;
    if (sessionProgress < 100) {
      const timer = setTimeout(() => {
        setSessionProgress((p) => {
          const next = Math.min(100, p + 10);
          // Midway check-in at 50%
          if (next === 50) setMentorCheckin('midway');
          // End check-in at 100%
          if (next === 100) setMentorCheckin('end');
          return next;
        });
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setSessionCompleted(true);
    }
  }, [sessionStarted, sessionProgress, sessionCompleted]);

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: 24 }}>
      {/* Top: XP, Level, Streak, Avatar, Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <AvatarIcon avatar={'🦸'} />
        <LevelIcon level={level} />
        <XPBar xp={320} maxXp={500} />
        <StreakCounter streak={streak} />
        {badges.map((b) => (
          <BadgeIcon key={b.id} icon={b.icon} label={b.name} />
        ))}
      </div>

      {/* Live Quests */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: 8 }}>Your Quests</h2>
        {quests.length === 0 && <div>No quests right now. Keep focusing!</div>}
        {quests.map((q) => (
          <div key={q.id} style={{ marginBottom: 12, border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fafbfc' }}>
            <div style={{ fontWeight: 600 }}>{q.title}</div>
            <div style={{ fontSize: '0.95em', color: '#555' }}>{q.description}</div>
            <div style={{ margin: '6px 0' }}>
              Progress: {Math.round(q.progress)}% {q.status === 'completed' && <span style={{ color: '#10B981', fontWeight: 600 }}>✓</span>}
            </div>
            <div style={{ fontSize: '0.95em', color: '#888' }}>Reward: +{q.rewardXp} XP{q.rewardBadge && `, Badge: ${q.rewardBadge}`}</div>
          </div>
        ))}
      </div>

      {/* Current Quest (first active) */}
      <div style={{ marginBottom: 24 }}>
        {quests.find(q => q.status === 'active') && (
          <QuestDetail
            title={quests.find(q => q.status === 'active')?.title || ''}
            description={quests.find(q => q.status === 'active')?.description || ''}
            difficulty={1}
            status={quests.find(q => q.status === 'active')?.status as any}
            xpReward={quests.find(q => q.status === 'active')?.rewardXp || 0}
            badgeReward={quests.find(q => q.status === 'active')?.rewardBadge}
            onAction={!sessionStarted ? () => setSessionStarted(true) : undefined}
            actionLabel={!sessionStarted ? 'Start Focus Session' : undefined}
          />
        )}
      </div>

      {/* Focus Session Timer & Progress */}
      {sessionStarted && !sessionCompleted && (
        <div style={{ marginBottom: 24 }}>
          <TimerMain timerTypeProps="deep" isSetupEnabled={false} />
          <div style={{ marginTop: 12, fontWeight: 500 }}>
            Progress: {sessionProgress}%
          </div>
        </div>
      )}

      {/* AI Mentor Check-in */}
      {mentorCheckin === 'midway' && !sessionCompleted && (
        <div style={{ marginBottom: 24 }}>
          <ChatAi />
          <div style={{ color: '#8B5CF6', fontWeight: 600, marginTop: 8 }}>
            Mentor: "Still focused? Need help?"
          </div>
        </div>
      )}
      {mentorCheckin === 'end' && sessionCompleted && (
        <div style={{ marginBottom: 24 }}>
          <ChatAi />
          <div style={{ color: '#10B981', fontWeight: 600, marginTop: 8 }}>
            Mentor: "Great job! Here’s your feedback and encouragement."
          </div>
        </div>
      )}

      {/* Rewards at end */}
      {sessionCompleted && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: 8 }}>Session Complete!</div>
          <div>+50 XP, Badge: Deep Diver</div>
          <Badges />
        </div>
      )}
    </div>
  );
}