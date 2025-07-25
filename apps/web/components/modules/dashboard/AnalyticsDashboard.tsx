'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';
import { isUserAuthenticated } from '../../../lib/auth';

export default function AnalyticsDashboard() {
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
        loadTimerSessionsFromBackend,
        mergeTimerSessionsFromLocalAndBackend
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
        syncError: null as string | null,
        mergeStats: null as {
            localCount: number;
            backendCount: number;
            mergedCount: number;
            duplicatesRemoved: number;
        } | null
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

    const handleMergeSessions = async () => {
        if (!syncStatus.isAuthenticated) return;

        setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));
        try {
            const result = await mergeTimerSessionsFromLocalAndBackend();
            setSyncStatus(prev => ({
                ...prev,
                isSyncing: false,
                lastSync: new Date(),
                syncError: null,
                mergeStats: {
                    localCount: result.localCount,
                    backendCount: result.backendCount,
                    mergedCount: result.mergedCount,
                    duplicatesRemoved: result.duplicatesRemoved
                }
            }));
        } catch (error) {
            setSyncStatus(prev => ({
                ...prev,
                isSyncing: false,
                syncError: error instanceof Error ? error.message : 'Merge failed'
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
        <div>

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
        </div>
    );
}