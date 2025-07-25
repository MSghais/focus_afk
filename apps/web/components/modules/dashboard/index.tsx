'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';
import ActionsDashboard from './ActionsDashboard';
import ListFocusSession from './ListFocusSession';
import ChartFocus from './ChartFocus';
import RecentGoals from './RecentGoals';
import RecentTasks from './RecentTasks';
import AvatarIcon from '../../small/AvatarIcon';
import { isUserAuthenticated } from '../../../lib/auth';

export default function Dashboard() {
    const router = useRouter();
    const {
        tasks,
        goals,
        timerSessions,
        settings,
        getTaskStats,
        getFocusStats,
        getBreakStats,
        getDeepFocusStats,
        setCurrentModule,
        syncTimerSessionsToBackend,
        loadTimerSessionsFromBackend
    } = useFocusAFKStore();

    const [level, setLevel] = useState(1);
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

    const [breakStats, setBreakStats] = useState({
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
    });

    const [deepFocusStats, setDeepFocusStats] = useState({
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
    });

    const [syncStatus, setSyncStatus] = useState({
        isAuthenticated: false,
        isSyncing: false,
        lastSync: null as Date | null,
        syncError: null as string | null
    });

    useEffect(() => {
        const loadStats = async () => {
            const [taskStatsData, focusStatsData, breakStatsData, deepFocusStatsData] = await Promise.all([
                getTaskStats(),
                getFocusStats(7),
                getBreakStats(7),
                getDeepFocusStats(7)
            ]);
            setTaskStats(taskStatsData);
            setFocusStats(focusStatsData);
            setBreakStats(breakStatsData);
            setDeepFocusStats(deepFocusStatsData);
        };

        loadStats();
        
        // Check authentication status
        setSyncStatus(prev => ({
            ...prev,
            isAuthenticated: isUserAuthenticated()
        }));
    }, [tasks, goals, timerSessions, getTaskStats, getFocusStats, getBreakStats, getDeepFocusStats]);

    const handleSyncToBackend = async () => {
        if (!syncStatus.isAuthenticated) return;
        
        setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));
        try {
            const result = await syncTimerSessionsToBackend();
            setSyncStatus(prev => ({
                ...prev,
                isSyncing: false,
                lastSync: new Date(),
                syncError: result.success ? null : 'Sync completed with errors'
            }));
        } catch (error) {
            setSyncStatus(prev => ({
                ...prev,
                isSyncing: false,
                syncError: error instanceof Error ? error.message : 'Sync failed'
            }));
        }
    };

    const handleLoadFromBackend = async () => {
        if (!syncStatus.isAuthenticated) return;
        
        setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));
        try {
            const result = await loadTimerSessionsFromBackend();
            setSyncStatus(prev => ({
                ...prev,
                isSyncing: false,
                lastSync: new Date(),
                syncError: result.success ? null : 'Load completed with errors'
            }));
        } catch (error) {
            setSyncStatus(prev => ({
                ...prev,
                isSyncing: false,
                syncError: error instanceof Error ? error.message : 'Load failed'
            }));
        }
    };

    const formatTime = (minutes: number) => {
        if (minutes === 0) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes * 60) % 60);
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
        }
        return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString();
    };

    const getCompletionRate = () => {
        return taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
    };

    const getProductivityScore = () => {
        const taskScore = getCompletionRate();
        const focusScore = focusStats.totalSessions > 0 ? Math.min(100, (focusStats.totalMinutes / 60) * 2) : 0;
        const deepFocusScore = deepFocusStats.totalSessions > 0 ? Math.min(100, (deepFocusStats.totalMinutes / 60) * 3) : 0;
        return Math.round((taskScore + focusScore + deepFocusScore) / 3);
    };

    const recentTasks = tasks.slice(0, 5);
    const recentGoals = goals.slice(0, 3);
    const recentSessions = timerSessions.slice(0, 5);

    return (
        <div className={styles.dashboard}>

            <div className="flex justify-between items-center">  
                <h1 className={styles.title}>Dashboard</h1>
                <div className="flex items-center gap-2">
                    <AvatarIcon avatar={'🦸'} />
                    <p className="text-sm text-gray-500 italic">Level {level}</p>
                </div>
            </div>

            {/* Sync Status */}
            {syncStatus.isAuthenticated && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">Data Sync</h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className={`inline-flex items-center gap-1 ${syncStatus.isSyncing ? 'text-blue-600' : 'text-green-600'}`}>
                                    <span className={`w-2 h-2 rounded-full ${syncStatus.isSyncing ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`}></span>
                                    {syncStatus.isSyncing ? 'Syncing...' : 'Online'}
                                </span>
                                {syncStatus.lastSync && (
                                    <span>Last sync: {syncStatus.lastSync.toLocaleTimeString()}</span>
                                )}
                                {syncStatus.syncError && (
                                    <span className="text-red-600">Error: {syncStatus.syncError}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSyncToBackend}
                                disabled={syncStatus.isSyncing}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {syncStatus.isSyncing ? 'Syncing...' : 'Sync Up'}
                            </button>
                            <button
                                onClick={handleLoadFromBackend}
                                disabled={syncStatus.isSyncing}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {syncStatus.isSyncing ? 'Loading...' : 'Sync Down'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Overview */}


            <div className={styles.statsGrid}>

                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Focus Time</p>
                            <p className={styles.statValue} style={{ color: '#8B5CF6' }}>{formatTime(focusStats.totalMinutes + deepFocusStats.totalMinutes)}</p>
                            <p className={styles.statSubValue}>Deep: {formatTime(deepFocusStats.totalMinutes)}</p>
                        </div>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(to right, #8B5CF6, #7C3AED)' }}>
                            <span style={{ color: 'white', fontSize: '1.25rem' }}>⏱️</span>
                        </div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Total Tasks</p>
                            <p className={styles.statValue}>{taskStats.total}</p>

                            <div className={styles.statSubValue}>
                                <p className={styles.statValue + "text-xs italic font-bold text-gray-500"}>Completed: {taskStats.completed} / {taskStats.total} ✅</p>
                            </div>

                        </div>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(to right, #3B82F6, #1D4ED8)' }}>
                            <span style={{ color: 'white', fontSize: '1.25rem' }}>📋</span>
                        </div>
                        {/* <div className={styles.statSubValue}>
                            <p className={styles.statValue + "text-xs italic font-bold text-gray-500"}>Completed: {taskStats.completed} / {taskStats.total} ✅</p>
                        </div> */}
                    </div>

                </div>

                {/* 
                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Completed</p>
                            <p className={styles.statValue} style={{ color: '#10B981' }}>{taskStats.completed}</p>
                        </div>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(to right, #10B981, #059669)' }}>
                            <span style={{ color: 'white', fontSize: '1.25rem' }}>✅</span>
                        </div>
                    </div>
                </div> */}


                {/* 
                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Deep Focus</p>
                            <p className={styles.statValue} style={{ color: '#EC4899' }}>{formatTime(deepFocusStats.totalMinutes)}</p>
                            <p className={styles.statSubValue}>{deepFocusStats.totalSessions} sessions</p>
                        </div>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(to right, #EC4899, #BE185D)' }}>
                            <span style={{ color: 'white', fontSize: '1.25rem' }}>🎯</span>
                        </div>
                    </div>
                </div> */}

                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Break Time</p>
                            <p className={styles.statValue} style={{ color: '#10B981' }}>{formatTime(breakStats.totalMinutes)}</p>
                            <p className={styles.statSubValue}>{breakStats.totalSessions} sessions</p>
                        </div>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(to right, #10B981, #059669)' }}>
                            <span style={{ color: 'white', fontSize: '1.25rem' }}>☕</span>
                        </div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Productivity</p>
                            <p className={styles.statValue} style={{ color: '#F59E0B' }}>{getProductivityScore()}%</p>
                        </div>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(to right, #F59E0B, #D97706)' }}>
                            <span style={{ color: 'white', fontSize: '1.25rem' }}>📈</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <ActionsDashboard />

            {/* Content Grid */}
            <div className={styles.contentGrid}>
                {/* Recent Tasks */}
                <div className={styles.contentCard}>
                    <RecentTasks />
                </div>

                {/* Recent Goals */}
                <div className={styles.contentCard}>
                    <RecentGoals />
                </div>

                {/* Focus Sessions */}
                <div className={styles.contentCard}>

                    <ListFocusSession/>
                </div>

                {/* Weekly Focus Chart */}

                <div className={styles.contentCard}>
                    <ChartFocus />
                </div>
            </div>
        </div>
    );
}