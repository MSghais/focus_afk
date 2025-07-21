'use client';
import React from "react";
import { useFocusAFKStore } from "../../lib/store";

const LeftSidebar = () => {
  const { ui, setCurrentModule, setTheme } = useFocusAFKStore();

  const toggleTheme = () => {
    const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (typeof window !== "undefined") {
      const body = document.body;
      body.setAttribute("data-theme", newTheme);
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'timer', label: 'Timer', icon: '⏱️' },
    { id: 'learning', label: 'Goals', icon: '🎯' },
    { id: 'console', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="hidden md:fixed md:top-0 md:left-0 md:h-full md:w-64 bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] md:flex md:flex-col md:items-center md:justify-start md:shadow z-40">
      <div className="w-full p-4">
        <h1 className="text-xl font-bold text-center mb-8">Focus AFK</h1>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentModule(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                ui.currentModule === item.id
                  ? 'bg-[var(--brand-accent)] text-white'
                  : 'hover:bg-[var(--border)]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--border)] transition-colors"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="text-lg">
              {ui.theme === 'dark' ? '☀️' : '🌙'}
            </span>
            <span className="font-medium">
              {ui.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar; 