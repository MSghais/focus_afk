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
    <aside className="sidebar-fixed hidden md:flex md:fixed md:top-0 md:left-0 md:h-full md:w-64 bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex-col items-center justify-start shadow-lg transition-all duration-300 ease-in-out">
      <div className="w-full p-6">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-accent)] bg-clip-text text-transparent">
            Focus AFK
          </h1>
          <p className="text-xs text-[var(--foreground)] opacity-70 mt-1">Productivity & Focus</p>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentModule(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 ${
                ui.currentModule === item.id
                  ? 'bg-[var(--afk-bg-dark,#18181b)] text-[var(--foreground)] font-semibold shadow-lg border border-[var(--border)]'
                  : 'hover:bg-[var(--border)] hover:shadow-md'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--border)] transition-all duration-200 ease-in-out transform hover:scale-105"
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