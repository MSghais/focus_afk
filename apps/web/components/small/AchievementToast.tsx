'use client';

import { useState, useEffect } from 'react';
import { useGamificationStore } from '../../store/gamification';

interface AchievementToastProps {
  achievementId: string;
  onClose: () => void;
}

export default function AchievementToast({ achievementId, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { achievements } = useGamificationStore();
  
  const achievement = achievements.find(a => a.id === achievementId);
  
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  if (!achievement) return null;
  
  return (
    <div className={`
      fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="bg-gradient-to-r from-yellow-900/90 to-orange-900/90 backdrop-blur-sm border border-yellow-500/50 rounded-xl p-4 shadow-2xl shadow-yellow-500/25 max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="text-3xl animate-bounce">{achievement.icon}</div>
          <div className="flex-1">
            <div className="text-yellow-400 font-bold text-sm">🏆 Achievement Unlocked!</div>
            <div className="text-white font-semibold">{achievement.name}</div>
            <div className="text-gray-300 text-xs mt-1">{achievement.description}</div>
            <div className="text-yellow-300 text-xs mt-1">+{achievement.xpReward} XP</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage achievement notifications
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<string[]>([]);
  const { unlockedAchievements } = useGamificationStore();
  
  useEffect(() => {
    // Check for newly unlocked achievements
    const newAchievements = unlockedAchievements.filter(
      id => !notifications.includes(id)
    );
    
    if (newAchievements.length > 0) {
      setNotifications(prev => [...prev, ...newAchievements]);
    }
  }, [unlockedAchievements, notifications]);
  
  const removeNotification = (achievementId: string) => {
    setNotifications(prev => prev.filter(id => id !== achievementId));
  };
  
  return { notifications, removeNotification };
} 