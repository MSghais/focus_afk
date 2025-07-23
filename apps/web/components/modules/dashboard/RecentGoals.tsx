'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';

export default function RecentGoals() {
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
        setCurrentModule
    } = useFocusAFKStore();

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
            console.log("breakStatsData", breakStatsData);
            setBreakStats(breakStatsData);
            setDeepFocusStats(deepFocusStatsData);
        };

        loadStats();
    }, [tasks, goals, timerSessions, getTaskStats, getFocusStats, getBreakStats, getDeepFocusStats]);

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



    const recentGoals = goals.slice(0, 3);

    return (

        <div >
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Active Goals</h2>
                <button
                    onClick={() => {
                        setCurrentModule('goals');
                        router.push('/goals');
                    }}
                    className={styles.viewAllButton}
                >
                    View All
                </button>
            </div>
            {recentGoals.length === 0 ? (
                <p className={styles.emptyState}>No goals yet</p>
            ) : (
                <div className={styles.itemList}>
                    {recentGoals.map((goal) => (
                        <div key={goal.id} className={styles.listItem}>
                            <div className={styles.itemContent}>
                                <div className={styles.itemInfo}>
                                    <h3 className={styles.itemTitle}>{goal.title}</h3>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${goal.progress}%` }}
                                        ></div>
                                    </div>
                                    {goal.targetDate && (
                                        <p className={styles.itemSubtitle}>
                                            Target: {formatDate(goal.targetDate)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className={styles.itemBadge} style={{
                                backgroundColor: '#D1FAE5',
                                color: '#059669'
                            }}>
                                {goal.progress}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>


    );
}