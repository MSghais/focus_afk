'use client';
import React from "react";
import { useFocusAFKStore } from "../../store/store";
import styles from "../../styles/components/navigation.module.scss";
import { useRouter } from "next/navigation";

const BottomBar = () => {
  const router = useRouter();
  const { ui, setCurrentModule } = useFocusAFKStore();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'journal', label: 'Journal', icon: '📝' },
    // { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'timer', label: 'Timer', icon: '⏱️' },
    { id: 'calendar/manager', label: 'Calendar', icon: '📅' },
    { id: 'mentor', label: 'AI Mentor', icon: '🤖' },
    // { id: 'goals', label: 'Goals', icon: '🎯' },
    // { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className={styles.bottomBar}>
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setCurrentModule(item.id as any)
            router.push(`/${item.id}`)
          }}
          className={`${styles.bottomNavItem} ${ ui.currentModule === item.id ? styles.active : ''}`}
        >
          <span className={styles.bottomNavIcon}>{item.icon}</span>
          {/* <span className={styles.bottomNavLabel}>{item.label}</span> */}
        </button>
      ))}
    </nav>
  );
};

export default BottomBar; 