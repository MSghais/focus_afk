'use client'

import { useEffect, useState } from 'react';
import styles from '../../../styles/components/dashboard.module.scss';
import { useFocusAFKStore } from '../../../store/store';
import { useAuthStore } from '../../../store/auth';
import { formatTime } from '../../../lib/format';
import { useUIStore } from '../../../store/uiStore';
import Link from 'next/link';
import { Icon } from '../../small/icons';
import { ButtonSecondary } from '../../small/buttons';
import DashboardQuests from './DasboardQuests';
import Badges from '../../profile/Badges';
import { logClickedEvent } from '../../../lib/analytics';
import QuestList from '../quests/QuestList';
import LfgSession from '../LfgSession';
import Settings from '../settings';
import { ButtonSimple } from '../../small/buttons';

export default function ProfileDashboard() {

  const { showToast, showModal } = useUIStore();
  const {
    tasks,
    goals,
    timerSessions,
    settings,
    getTaskStats,
    getFocusStats,
    getBreakStats,
    setCurrentModule
  } = useFocusAFKStore();
  const { userConnected } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'main' | "settings" | 'quests' | 'badges' | "lfg_session">('main');

  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });

  const [focusStats, setFocusStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
  });

  useEffect(() => {
    const loadStats = async () => {
      const [taskStatsData, focusStatsData, breakStatsData] = await Promise.all([
        getTaskStats(),
        getFocusStats(7),
        getBreakStats(7)
      ]);
      // setTaskStats(taskStatsData);
      setFocusStats(focusStatsData);
      console.log("breakStatsData", breakStatsData);
      setBreakStats(breakStatsData);
    };

    loadStats();
  }, [tasks, goals, timerSessions, getTaskStats, getFocusStats]);


  const [breakStats, setBreakStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
  });

  useEffect(() => {
    const loadStats = async () => {
      const [taskStatsData, focusStatsData, breakStatsData] = await Promise.all([
        getTaskStats(),
        getFocusStats(7),
        getBreakStats(7)
      ]);
      setTaskStats(taskStatsData);
      setFocusStats(focusStatsData);
      console.log("breakStatsData", breakStatsData);
      setBreakStats(breakStatsData);
    };

    loadStats();
  }, [tasks, goals, timerSessions, getTaskStats, getFocusStats]);

  // TODO proof submission

  // TODO quests

  // TODO daily streak

  return (
    <div className={styles.dashboardContainer}>
      {/* <div className={styles.dashboardHeader}>FOCUSFI</div> */}


      <div className="flex flex-row gap-4 justify-center space-x-8 my-4 shadow-md rounded-lg p-2 w-full">


        <ButtonSimple
          className={activeTab === 'main' ? 'bg-[var(--brand-primary)] text-white' : ''}
        onClick={() => { setActiveTab('main'); logClickedEvent("main_button_clicked ") }}>


          <Icon name="home" size={24} />

        </ButtonSimple>

        <ButtonSimple
          className={activeTab === 'settings' ? 'bg-[var(--brand-primary)] text-white' : ''}
          onClick={() => { setActiveTab('settings'); logClickedEvent("settings_button_clicked ") }}>


          {/* 
        <Link
          title="Settings"
          href="/settings"
          className=""
          onClick={() => {
            logClickedEvent("settings_button_clicked ");
          }}
        >
        </Link> */}
          <Icon name="settings" size={24} />

        </ButtonSimple>

        <ButtonSimple
          className={activeTab === 'quests' ? 'bg-[var(--brand-primary)] text-white' : ''}
          onClick={() => { setActiveTab('quests'); logClickedEvent("quests_button_clicked ") }}>

          {/* 
          <Link title="Lfg Session"
            onClick={() => {
              logClickedEvent("lfg_session_button_clicked ");
            }}
            href="/lfg_session" className="flex items-center justify-center">
          </Link> */}
          <Icon name="lfg" size={24} />

        </ButtonSimple>


      </div>


      <div>


      </div>

      {activeTab === 'main' && <DashboardQuests />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'quests' && <QuestList quests={[]} />}
      {activeTab === 'badges' && <Badges />}
      {activeTab === 'lfg_session' && <LfgSession />}
    </div>
  );
}