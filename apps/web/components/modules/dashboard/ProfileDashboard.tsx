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
   

      <div className="flex flex-row gap-4 justify-center my-4 shadow-md rounded-lg p-2">


        <Link href="/settings" className="">
          <Icon name="settings" size={24} />
        </Link>

        <Link href="/lfg_session" className="flex items-center justify-center">
          <Icon name="lfg" size={24} />
        </Link>



      </div>


      <div>


      </div>

      <DashboardQuests />
      <Badges />
    </div>
  );
}