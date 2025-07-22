'use client';
import React from "react";
import { useFocusAFKStore } from "../../store/store";
import styles from "../../styles/components/navigation.module.scss";

const BottomBar = () => {
  const { ui, setCurrentModule } = useFocusAFKStore();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'timer', label: 'Timer', icon: '⏱️' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className={styles.bottomBar}>
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setCurrentModule(item.id as any)}
          className={`${styles.bottomNavItem} ${ui.currentModule === item.id ? styles.active : ''}`}
        >
          <span className={styles.bottomNavIcon}>{item.icon}</span>
          <span className={styles.bottomNavLabel}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomBar; 