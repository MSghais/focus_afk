'use client';
import React from "react";
import { useFocusAFKStore } from "../../lib/store";

const BottomBar = () => {
  const { ui, setCurrentModule } = useFocusAFKStore();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'timer', label: 'Timer', icon: '⏱️' },
    // { id: 'learning', label: 'Goals', icon: '🎯' },
    { id: 'console', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="bottom-bar-fixed fixed bottom-0 left-0 w-full h-16 border-t border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] flex items-center justify-around shadow-lg md:hidden backdrop-blur-sm bg-opacity-95">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setCurrentModule(item.id as any)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-110 ${
            ui.currentModule === item.id
              ? 'bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-black shadow-lg'
              : 'hover:bg-[var(--border)]'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-xs font-medium mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomBar; 