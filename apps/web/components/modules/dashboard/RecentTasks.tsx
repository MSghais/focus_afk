'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';

export default function RecentTasks() {
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



    const recentTasks = tasks.slice(0, 5);
    const recentGoals = goals.slice(0, 3);
    const recentSessions = timerSessions.slice(0, 5);

    return (
        <div >
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Tasks</h2>
                <button
                    onClick={() => {
                        setCurrentModule('tasks');
                        router.push('/tasks');
                    }}
                    className={styles.viewAllButton}
                >
                    View All
                </button>
            </div>
            {recentTasks.length === 0 ? (
                <p className={styles.emptyState}>No tasks yet</p>
            ) : (
                <div className={styles.itemList}>
                    {recentTasks.map((task) => (
                        <div key={task.id} className={styles.listItem}>
                            <div className={styles.itemContent}>
                                {/* <input
                                    type="checkbox"
                                    checked={task.completed}
                                    readOnly
                                    className={styles.itemCheckbox}
                                /> */}
                                <div className={styles.itemInfo}>
                                    <p className={`${styles.itemTitle} ${task.completed ? styles.completed : ''}`}>
                                        {task.title}
                                    </p>
                                    {task.category && (
                                        <p className={styles.itemSubtitle}>{task.category}</p>
                                    )}
                                </div>
                            </div>
                            <span className={styles.itemBadge} style={{
                                backgroundColor: task.priority === 'high' ? '#FEE2E2' :
                                    task.priority === 'medium' ? '#FEF3C7' : '#D1FAE5',
                                color: task.priority === 'high' ? '#DC2626' :
                                    task.priority === 'medium' ? '#D97706' : '#059669'
                            }}>
                                {task.priority}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}