'use client';
import React from "react";
import { useFocusAFKStore } from "../../store/store";
import styles from "../../styles/components/navigation.module.scss";
import { useUIStore } from "../../store/uiStore";
import { useEvmLogin } from "../../hooks/useEvmLogin";
import ProfileUser from "../profile/ProfileUser";
import { Icon } from "../small/icons";
import { useRouter } from "next/navigation";
import ToggleTheme from "./ToggleTheme";

const LeftSidebar = () => {
  const { ui, setCurrentModule, setTheme } = useFocusAFKStore();

  const router = useRouter();
  const { showModal } = useUIStore();
  const evmLogin = useEvmLogin();
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
    { id: 'goals', label: 'Goals', icon: '🎯' },
    // { id: 'learning', label: 'Learning', icon: '🎓' },
    { id: 'mentor', label: 'AI Mentor', icon: '🤖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
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
              onClick={() => {
                // setCurrentModule(item.id as any)
                router.push(`/${item.id}`)
              }}
              className={`${styles.navItem} ${ui.currentModule === item.id ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className={styles.sidebarFooter}>

          <ToggleTheme
          />
          <div >
            <button 
            
            className="px-4"onClick={() => {
              showModal(<ProfileUser />);
            }}>  <Icon name="user" /></button>

          </div>
        </div>

      </div>


    </aside>
  );
};

export default LeftSidebar; 