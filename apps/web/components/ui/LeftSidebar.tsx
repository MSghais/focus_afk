'use client';
import React from "react";
import { useFocusAFKStore } from "../../store/store";
import styles from "../../styles/components/navigation.module.scss";

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
    { id: 'learning', label: 'Learning', icon: '🎓' },
    { id: 'mentor', label: 'AI Mentor', icon: '🤖' },
    { id: 'console', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* Brand */}
        <div className={styles.sidebarBrand}>
          <h1 className={styles.sidebarTitle}>
            Focus AFK
          </h1>
          <p className={styles.sidebarSubtitle}>Productivity & Focus</p>
        </div>
        
        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentModule(item.id as any)}
              className={`${styles.navItem} ${ui.currentModule === item.id ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className={styles.sidebarFooter}>
          <button
            className={styles.navItem}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className={styles.navIcon}>
              {ui.theme === 'dark' ? '☀️' : '🌙'}
            </span>
            <span className={styles.navLabel}>
              {ui.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar; 