import { Task, TimerSession } from "../types";
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  dateAwarded: string;
  type: string;
}

// Helper to check if a badge is already awarded
function hasBadge(badges: Badge[], type: string) {
  return badges.some(b => b.type === type);
}

export function getAwardedBadges({
  timerSessions,
  tasks,
  mentorChats,
  streak,
  goals,
  badges,
}: {
  timerSessions: TimerSession[];
  tasks: Task[];
  mentorChats: number;
  streak: number;
  goals: { completed: boolean }[];
  badges: Badge[];
}): Badge[] {
  const newBadges: Badge[] = [];
  const now = new Date().toISOString();
  // First Focus Session
  if (timerSessions.length > 0 && !hasBadge(badges, 'first-focus')) {
    newBadges.push({
      id: 'first-focus',
      type: 'first-focus',
      name: 'First Focus',
      description: 'Completed your first focus session!',
      icon: '🏅',
      dateAwarded: now,
    });
  }
  // 7 Day Streak
  if (streak >= 7 && !hasBadge(badges, '7-day-streak')) {
    newBadges.push({
      id: '7-day-streak',
      type: '7-day-streak',
      name: '7 Day Streak',
      description: 'Focused for 7 days in a row!',
      icon: '🔥',
      dateAwarded: now,
    });
  }
  // First Mentor Chat
  if (mentorChats > 0 && !hasBadge(badges, 'mentor-buddy')) {
    newBadges.push({
      id: 'mentor-buddy',
      type: 'mentor-buddy',
      name: 'Mentor Buddy',
      description: 'Chatted with the AI mentor!',
      icon: '🤖',
      dateAwarded: now,
    });
  }
  // Pomodoro Pro: 20+ sessions in a week
  if (timerSessions.length >= 20 && !hasBadge(badges, 'pomodoro-pro')) {
    newBadges.push({
      id: 'pomodoro-pro',
      type: 'pomodoro-pro',
      name: 'Pomodoro Pro',
      description: 'Completed 20 Pomodoros in a week!',
      icon: '⏲️',
      dateAwarded: now,
    });
  }
  // Task Slayer: 10+ tasks completed in a week
  const completedTasks = tasks.filter(t => t.completed).length;
  if (completedTasks >= 10 && !hasBadge(badges, 'task-slayer')) {
    newBadges.push({
      id: 'task-slayer',
      type: 'task-slayer',
      name: 'Task Slayer',
      description: 'Completed 10 tasks in a week!',
      icon: '🗡️',
      dateAwarded: now,
    });
  }
  // Goal Getter: completed a goal
  if (goals.some(g => g.completed) && !hasBadge(badges, 'goal-getter')) {
    newBadges.push({
      id: 'goal-getter',
      type: 'goal-getter',
      name: 'Goal Getter',
      description: 'Completed a goal!',
      icon: '🎯',
      dateAwarded: now,
    });
  }
  // Deep Diver: 50+ min session
  if (timerSessions.some(s => s.duration >= 50 * 60) && !hasBadge(badges, 'deep-diver')) {
    newBadges.push({
      id: 'deep-diver',
      type: 'deep-diver',
      name: 'Deep Diver',
      description: 'Completed a 50+ minute deep focus session!',
      icon: '🌊',
      dateAwarded: now,
    });
  }
  // Early Bird: session before 8am
  if (timerSessions.some(s => new Date(s.startTime).getHours() < 8) && !hasBadge(badges, 'early-bird')) {
    newBadges.push({
      id: 'early-bird',
      type: 'early-bird',
      name: 'Early Bird',
      description: 'Focused before 8am!',
      icon: '🐦',
      dateAwarded: now,
    });
  }
  // Mentor Streak: 5+ mentor chats
  if (mentorChats >= 5 && !hasBadge(badges, 'mentor-streak')) {
    newBadges.push({
      id: 'mentor-streak',
      type: 'mentor-streak',
      name: 'Mentor Streak',
      description: 'Chatted with the AI mentor 5 times!',
      icon: '💬',
      dateAwarded: now,
    });
  }
  return newBadges;
}

// Save new badges to backend
export async function saveBadgesToBackend(api: any, userId: string, badges: Badge[]) {
  for (const badge of badges) {
    await api.awardBadge(userId, badge);
  }
}

export interface Quest {
  id: string;
  name?: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number; // 0-100
  goal: number;
  rewardXp: number;
  rewardBadge?: string;
  badgeReward?: string;
  levelRequired?: number;
}

// Generate basic RPG-style quests for a user
export function generateQuests({
  timerSessions,
  tasks,
  goals,
  mentorChats,
  streak,
  level,
  completedQuests,
}: {
  timerSessions: TimerSession[];
  tasks: Task[];
  goals: { completed: boolean }[];
  mentorChats: number;
  streak: number;
  level: number;
  completedQuests: string[];
}): Quest[] {
  const quests: Quest[] = [];
  // Quest: Complete 3 focus sessions
  if (!completedQuests.includes('focus-3')) {
    const count = timerSessions.length;
    quests.push({
      id: 'focus-3',
      title: 'Focus Novice',
      description: 'Complete 3 focus sessions',
      type: 'focus',
      status: count >= 3 ? 'completed' : 'active',
      progress: Math.min(100, (count / 3) * 100),
      goal: 3,
      rewardXp: 30,
      rewardBadge: 'first-focus',
    });
  }
  // Quest: Complete 10 tasks
  const completedTasks = tasks.filter(t => t.completed).length;
  if (!completedQuests.includes('tasks-10')) {
    quests.push({
      id: 'tasks-10',
      title: 'Task Initiate',
      description: 'Complete 10 tasks',
      type: 'tasks',
      status: completedTasks >= 10 ? 'completed' : 'active',
      progress: Math.min(100, (completedTasks / 10) * 100),
      goal: 10,
      rewardXp: 50,
      rewardBadge: 'task-slayer',
    });
  }
  // Quest: Reach level 5
  if (!completedQuests.includes('level-5')) {
    quests.push({
      id: 'level-5',
      title: 'Level Up!',
      description: 'Reach level 5',
      type: 'level',
      status: level >= 5 ? 'completed' : 'active',
      progress: Math.min(100, (level / 5) * 100),
      goal: 5,
      rewardXp: 100,
    });
  }
  // Quest: Use mentor 3 times
  if (!completedQuests.includes('mentor-3')) {
    quests.push({
      id: 'mentor-3',
      title: 'Mentor Seeker',
      description: 'Chat with the AI mentor 3 times',
      type: 'mentor',
      status: mentorChats >= 3 ? 'completed' : 'active',
      progress: Math.min(100, (mentorChats / 3) * 100),
      goal: 3,
      rewardXp: 20,
      rewardBadge: 'mentor-buddy',
    });
  }
  // Quest: 7-day streak
  if (!completedQuests.includes('streak-7')) {
    quests.push({
      id: 'streak-7',
      title: 'Streak Adventurer',
      description: 'Maintain a 7-day focus streak',
      type: 'streak',
      status: streak >= 7 ? 'completed' : 'active',
      progress: Math.min(100, (streak / 7) * 100),
      goal: 7,
      rewardXp: 70,
      rewardBadge: '7-day-streak',
    });
  }
  // Quest: Complete a goal
  if (!completedQuests.includes('goal-1')) {
    const completedGoals = goals.filter(g => g.completed).length;
    quests.push({
      id: 'goal-1',
      title: 'Goal Getter',
      description: 'Complete a goal',
      type: 'goal',
      status: completedGoals >= 1 ? 'completed' : 'active',
      progress: Math.min(100, (completedGoals / 1) * 100),
      goal: 1,
      rewardXp: 40,
      rewardBadge: 'goal-getter',
    });
  }
  // More RPG-style quests can be added here
  return quests;
} 