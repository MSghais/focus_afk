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

// Mock user/session/quest data
const mockUser = {
  name: 'FocusHero',
  level: 5,
  xp: 320,
  maxXp: 500,
  streak: 7,
  avatar: '🦸',
  badges: [
    { icon: '🏅', name: 'First Focus' },
    { icon: '🔥', name: '7 Day Streak' },
  ],
};

const mockQuest = {
  title: 'Deep Work Sprint',
  description: 'Focus for 50 minutes without distractions.',
  difficulty: 4,
  status: 'active',
  xpReward: 50,
  badgeReward: 'Deep Diver',
};

export default function LfgSession() {
  // Session state
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

  // Adaptive logic: if session completed, increase difficulty (mock)
  useEffect(() => {
    if (sessionCompleted) {
      // Here you would update quest difficulty, XP, etc.
    }
  }, [sessionCompleted]);

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: 24 }}>
      {/* Top: XP, Level, Streak, Avatar, Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <AvatarIcon avatar={mockUser.avatar} />
        <LevelIcon level={mockUser.level} />
        <XPBar xp={mockUser.xp} maxXp={mockUser.maxXp} />
        <StreakCounter streak={mockUser.streak} />
        {mockUser.badges.map((b) => (
          <BadgeIcon key={b.name} icon={b.icon} label={b.name} />
        ))}
      </div>

      {/* Current Quest */}
      <div style={{ marginBottom: 24 }}>
        <QuestDetail
          title={mockQuest.title}
          description={mockQuest.description}
          difficulty={mockQuest.difficulty}
          status={mockQuest.status as any}
          xpReward={mockQuest.xpReward}
          badgeReward={mockQuest.badgeReward}
          onAction={!sessionStarted ? () => setSessionStarted(true) : undefined}
          actionLabel={!sessionStarted ? 'Start Focus Session' : undefined}
        />
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
          <div>+{mockQuest.xpReward} XP, Badge: {mockQuest.badgeReward}</div>
          <Badges />
        </div>
      )}
    </div>
  );
}