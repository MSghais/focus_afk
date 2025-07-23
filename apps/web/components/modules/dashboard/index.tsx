'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';

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
            <h1 className={styles.title}>Dashboard</h1>

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
            <div className={styles.actionsGrid}>
                <button
                    onClick={() => {
                        setCurrentModule('tasks');
                        router.push('/tasks');
                    }}
                    className={styles.actionButton}
                    style={{ background: 'linear-gradient(to right, #3B82F6, #1D4ED8)', color: 'white' }}
                >
                    <div className={styles.actionContent}>
                        <div className={styles.actionInfo}>
                            <p className={styles.actionTitle}>Add/Check Task</p>
                            <p className={styles.actionDescription}>Create a new task</p>
                        </div>
                        <span className={styles.actionIcon}>➕</span>
                    </div>
                </button>

                <button
                    onClick={() => {
                        setCurrentModule('timer');
                        router.push('/timer');
                    }}
                    className={styles.actionButton}
                    style={{ background: 'linear-gradient(to right, #10B981, #059669)', color: 'white' }}
                >
                    <div className={styles.actionContent}>
                        <div className={styles.actionInfo}>
                            <p className={styles.actionTitle}>Start Focus</p>
                            <p className={styles.actionDescription}>Begin a focus session</p>
                        </div>
                        <span className={styles.actionIcon}>🎯</span>
                    </div>
                </button>

                <button
                    onClick={() => {
                        setCurrentModule('goals');
                        router.push('/goals');
                    }}
                    className={styles.actionButton}
                    style={{ background: 'linear-gradient(to right, #8B5CF6, #7C3AED)', color: 'white' }}
                >
                    <div className={styles.actionContent}>
                        <div className={styles.actionInfo}>
                            <p className={styles.actionTitle}>Set Goal</p>
                            <p className={styles.actionDescription}>Create a new goal</p>
                        </div>
                        <span className={styles.actionIcon}>🎯</span>
                    </div>
                </button>
            </div>

            {/* Content Grid */}
            <div className={styles.contentGrid}>
                {/* Recent Tasks */}
                <div className={styles.contentCard}>
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
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            readOnly
                                            className={styles.itemCheckbox}
                                        />
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

                {/* Recent Goals */}
                <div className={styles.contentCard}>
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

                {/* Focus Sessions */}
                <div className={styles.contentCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Recent Focus Sessions</h2>
                        <button
                            onClick={() => setCurrentModule('timer')}
                            className={styles.viewAllButton}
                        >
                            View All
                        </button>
                    </div>
                    {recentSessions.length === 0 ? (
                        <p className={styles.emptyState}>No focus sessions yet</p>
                    ) : (
                        <div className={styles.itemList}>
                            {recentSessions.map((session) => (
                                <div key={session.id} className={styles.listItem}>
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemInfo}>
                                            <p className={styles.itemTitle}>{formatTime(session.duration / 60)}</p>
                                            <p className={styles.itemSubtitle}>
                                                {formatDate(new Date(session.startTime))}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={styles.itemBadge} style={{
                                        backgroundColor: session.completed ? '#D1FAE5' : '#FEF3C7',
                                        color: session.completed ? '#059669' : '#D97706'
                                    }}>
                                        {session.completed ? 'Completed' : 'In Progress'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weekly Focus Chart */}
                <div className={styles.contentCard}>
                    <h2 className={styles.cardTitle}>This Week's Focus</h2>
                    {focusStats.sessionsByDay.length === 0 ? (
                        <p className={styles.emptyState}>No focus data yet</p>
                    ) : (
                        <div className={styles.weeklyChart}>
                            {focusStats.sessionsByDay.slice(0, 7).map((day) => (
                                <div key={day.date} className={styles.chartRow}>
                                    <span className={styles.chartDay}>
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <div className={styles.chartBar}>
                                        <div className={styles.chartProgress}>
                                            <div
                                                className={styles.progressFill}
                                                style={{
                                                    width: `${Math.min(100, (day.minutes / 60) * 20)}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className={styles.chartTime}>
                                            {formatTime(day.minutes)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}