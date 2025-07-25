import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  xpReward: number;
  category: 'focus' | 'break' | 'deep' | 'streak' | 'special';
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  icon: string;
  description: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  progress: number;
  target: number;
  reward: {
    xp: number;
    items?: string[];
  };
  completed: boolean;
  expiresAt?: Date;
}

export interface GamificationState {
  // Core stats
  level: number;
  xp: number;
  totalXp: number;
  focusPoints: number;
  energy: number;
  maxEnergy: number;
  
  // Skills
  skills: Skill[];
  
  // Achievements
  achievements: Achievement[];
  unlockedAchievements: string[];
  
  // Quests
  quests: Quest[];
  activeQuests: string[];
  
  // Streaks
  focusStreak: number;
  longestFocusStreak: number;
  dailyStreak: number;
  longestDailyStreak: number;
  
  // Session stats
  totalSessions: number;
  totalFocusTime: number; // in minutes
  totalBreakTime: number; // in minutes
  totalDeepTime: number; // in minutes
  
  // Actions
  addXp: (amount: number, source: string) => void;
  addFocusPoints: (amount: number) => void;
  restoreEnergy: (amount: number) => void;
  consumeEnergy: (amount: number) => void;
  unlockAchievement: (achievementId: string) => void;
  updateSkill: (skillId: string, xpGained: number) => void;
  completeQuest: (questId: string) => void;
  updateFocusStreak: (increment: boolean) => void;
  updateDailyStreak: (increment: boolean) => void;
  recordSession: (type: 'focus' | 'break' | 'deep', duration: number) => void;
  resetDailyStats: () => void;
}

const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 1000) + 1;
};

const calculateXpToNextLevel = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  return xp - xpForCurrentLevel;
};

const defaultSkills: Skill[] = [
  {
    id: 'focus',
    name: 'Focus Mastery',
    level: 1,
    xp: 0,
    maxXp: 100,
    icon: '🎯',
    description: 'Your ability to maintain concentration and complete tasks efficiently'
  },
  {
    id: 'deep_work',
    name: 'Deep Work',
    level: 1,
    xp: 0,
    maxXp: 100,
    icon: '⚔️',
    description: 'Your capacity for intense, uninterrupted work sessions'
  },
  {
    id: 'restoration',
    name: 'Restoration',
    level: 1,
    xp: 0,
    maxXp: 100,
    icon: '🛡️',
    description: 'Your ability to recover energy and maintain well-being'
  },
  {
    id: 'consistency',
    name: 'Consistency',
    level: 1,
    xp: 0,
    maxXp: 100,
    icon: '📈',
    description: 'Your dedication to maintaining daily habits and routines'
  }
];

const defaultAchievements: Achievement[] = [
  // Focus achievements
  {
    id: 'first_focus',
    name: 'First Steps',
    description: 'Complete your first focus session',
    icon: '🚀',
    xpReward: 50,
    category: 'focus'
  },
  {
    id: 'focus_5min',
    name: 'Focused Beginner',
    description: 'Complete 5 minutes of focused work',
    icon: '🎯',
    xpReward: 25,
    category: 'focus'
  },
  {
    id: 'focus_15min',
    name: 'Focused Warrior',
    description: 'Complete 15 minutes of focused work',
    icon: '⚔️',
    xpReward: 50,
    category: 'focus'
  },
  {
    id: 'focus_30min',
    name: 'Deep Diver',
    description: 'Complete 30 minutes of focused work',
    icon: '🌊',
    xpReward: 100,
    category: 'focus'
  },
  {
    id: 'focus_1hour',
    name: 'Legendary Focus',
    description: 'Complete 1 hour of focused work',
    icon: '👑',
    xpReward: 200,
    category: 'focus'
  },
  
  // Deep work achievements
  {
    id: 'deep_5min',
    name: 'Deep Initiate',
    description: 'Complete 5 minutes of deep work',
    icon: '🔮',
    xpReward: 75,
    category: 'deep'
  },
  {
    id: 'deep_15min',
    name: 'Deep Explorer',
    description: 'Complete 15 minutes of deep work',
    icon: '⚡',
    xpReward: 150,
    category: 'deep'
  },
  {
    id: 'deep_30min',
    name: 'Deep Master',
    description: 'Complete 30 minutes of deep work',
    icon: '🌟',
    xpReward: 300,
    category: 'deep'
  },
  {
    id: 'deep_1hour',
    name: 'Deep Legend',
    description: 'Complete 1 hour of deep work',
    icon: '💎',
    xpReward: 500,
    category: 'deep'
  },
  
  // Break achievements
  {
    id: 'break_5min',
    name: 'Restful Soul',
    description: 'Take a 5-minute restorative break',
    icon: '🛡️',
    xpReward: 25,
    category: 'break'
  },
  {
    id: 'break_15min',
    name: 'Wellness Warrior',
    description: 'Take a 15-minute restorative break',
    icon: '🧘',
    xpReward: 50,
    category: 'break'
  },
  
  // Streak achievements
  {
    id: 'streak_3',
    name: 'Consistent',
    description: 'Maintain a 3-day focus streak',
    icon: '🔥',
    xpReward: 100,
    category: 'streak'
  },
  {
    id: 'streak_7',
    name: 'Dedicated',
    description: 'Maintain a 7-day focus streak',
    icon: '🔥🔥',
    xpReward: 250,
    category: 'streak'
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day focus streak',
    icon: '🔥🔥🔥',
    xpReward: 1000,
    category: 'streak'
  }
];

const defaultQuests: Quest[] = [
  {
    id: 'daily_focus',
    title: 'Daily Focus',
    description: 'Complete 30 minutes of focused work today',
    type: 'daily',
    progress: 0,
    target: 30,
    reward: { xp: 100 },
    completed: false
  },
  {
    id: 'daily_deep',
    title: 'Deep Dive',
    description: 'Complete 15 minutes of deep work today',
    type: 'daily',
    progress: 0,
    target: 15,
    reward: { xp: 150 },
    completed: false
  },
  {
    id: 'daily_break',
    title: 'Rest & Recharge',
    description: 'Take 10 minutes of restorative breaks today',
    type: 'daily',
    progress: 0,
    target: 10,
    reward: { xp: 50 },
    completed: false
  }
];

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      level: 1,
      xp: 0,
      totalXp: 0,
      focusPoints: 0,
      energy: 100,
      maxEnergy: 100,
      
      skills: defaultSkills,
      achievements: defaultAchievements,
      unlockedAchievements: [],
      
      quests: defaultQuests,
      activeQuests: defaultQuests.map(q => q.id),
      
      focusStreak: 0,
      longestFocusStreak: 0,
      dailyStreak: 0,
      longestDailyStreak: 0,
      
      totalSessions: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
      totalDeepTime: 0,
      
      // Actions
      addXp: (amount: number, source: string) => {
        set((state) => {
          const newXp = state.xp + amount;
          const newTotalXp = state.totalXp + amount;
          const newLevel = calculateLevel(newXp);
          const oldLevel = state.level;
          
          return {
            xp: newXp,
            totalXp: newTotalXp,
            level: newLevel,
            ...(newLevel > oldLevel && {
              // Level up bonus
              focusPoints: state.focusPoints + (newLevel - oldLevel) * 10,
              energy: state.maxEnergy
            })
          };
        });
      },
      
      addFocusPoints: (amount: number) => {
        set((state) => ({
          focusPoints: state.focusPoints + amount
        }));
      },
      
      restoreEnergy: (amount: number) => {
        set((state) => ({
          energy: Math.min(state.energy + amount, state.maxEnergy)
        }));
      },
      
      consumeEnergy: (amount: number) => {
        set((state) => ({
          energy: Math.max(state.energy - amount, 0)
        }));
      },
      
      unlockAchievement: (achievementId: string) => {
        set((state) => {
          const achievement = state.achievements.find(a => a.id === achievementId);
          if (!achievement || state.unlockedAchievements.includes(achievementId)) {
            return state;
          }
          
          return {
            unlockedAchievements: [...state.unlockedAchievements, achievementId],
            achievements: state.achievements.map(a => 
              a.id === achievementId 
                ? { ...a, unlockedAt: new Date() }
                : a
            )
          };
        });
        
        // Award XP for achievement
        const achievement = get().achievements.find(a => a.id === achievementId);
        if (achievement) {
          get().addXp(achievement.xpReward, `achievement:${achievementId}`);
        }
      },
      
      updateSkill: (skillId: string, xpGained: number) => {
        set((state) => ({
          skills: state.skills.map(skill => {
            if (skill.id === skillId) {
              const newXp = skill.xp + xpGained;
              const newLevel = Math.floor(newXp / skill.maxXp) + 1;
              const newMaxXp = skill.maxXp * newLevel;
              
              return {
                ...skill,
                xp: newXp,
                level: newLevel,
                maxXp: newMaxXp
              };
            }
            return skill;
          })
        }));
      },
      
      completeQuest: (questId: string) => {
        set((state) => ({
          quests: state.quests.map(quest => 
            quest.id === questId 
              ? { ...quest, completed: true }
              : quest
          )
        }));
        
        // Award quest rewards
        const quest = get().quests.find(q => q.id === questId);
        if (quest) {
          get().addXp(quest.reward.xp, `quest:${questId}`);
        }
      },
      
      updateFocusStreak: (increment: boolean) => {
        set((state) => {
          const newStreak = increment ? state.focusStreak + 1 : 0;
          return {
            focusStreak: newStreak,
            longestFocusStreak: Math.max(newStreak, state.longestFocusStreak)
          };
        });
      },
      
      updateDailyStreak: (increment: boolean) => {
        set((state) => {
          const newStreak = increment ? state.dailyStreak + 1 : 0;
          return {
            dailyStreak: newStreak,
            longestDailyStreak: Math.max(newStreak, state.longestDailyStreak)
          };
        });
      },
      
      recordSession: (type: 'focus' | 'break' | 'deep', duration: number) => {
        set((state) => ({
          totalSessions: state.totalSessions + 1,
          totalFocusTime: type === 'focus' ? state.totalFocusTime + duration : state.totalFocusTime,
          totalBreakTime: type === 'break' ? state.totalBreakTime + duration : state.totalBreakTime,
          totalDeepTime: type === 'deep' ? state.totalDeepTime + duration : state.totalDeepTime
        }));
      },
      
      resetDailyStats: () => {
        set((state) => ({
          quests: state.quests.map(quest => 
            quest.type === 'daily' 
              ? { ...quest, progress: 0, completed: false }
              : quest
          )
        }));
      }
    }),
    {
      name: 'focus-afk-gamification',
      partialize: (state) => ({
        level: state.level,
        xp: state.xp,
        totalXp: state.totalXp,
        focusPoints: state.focusPoints,
        energy: state.energy,
        maxEnergy: state.maxEnergy,
        skills: state.skills,
        unlockedAchievements: state.unlockedAchievements,
        focusStreak: state.focusStreak,
        longestFocusStreak: state.longestFocusStreak,
        dailyStreak: state.dailyStreak,
        longestDailyStreak: state.longestDailyStreak,
        totalSessions: state.totalSessions,
        totalFocusTime: state.totalFocusTime,
        totalBreakTime: state.totalBreakTime,
        totalDeepTime: state.totalDeepTime
      })
    }
  )
); 