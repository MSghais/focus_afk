'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../lib/store';

export default function Dashboard() {
    const { 
        tasks, 
        goals, 
        timerSessions, 
        settings,
        getTaskStats, 
        getFocusStats,
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

    useEffect(() => {
        const loadStats = async () => {
            const [taskStatsData, focusStatsData] = await Promise.all([
                getTaskStats(),
                getFocusStats(7)
            ]);
            setTaskStats(taskStatsData);
            setFocusStats(focusStatsData);
        };
        
        loadStats();
    }, [tasks, goals, timerSessions, getTaskStats, getFocusStats]);

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
        return Math.round((taskScore + focusScore) / 2);
    };

    const recentTasks = tasks.slice(0, 5);
    const recentGoals = goals.slice(0, 3);
    const recentSessions = timerSessions.slice(0, 5);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-y-auto fade-in">
            <h1 className="text-3xl font-bold mb-6 gradient-text">Dashboard</h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--foreground)] opacity-70">Total Tasks</p>
                            <p className="text-2xl font-bold">{taskStats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl">📋</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--foreground)] opacity-70">Completed</p>
                            <p className="text-2xl font-bold text-green-500">{taskStats.completed}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--foreground)] opacity-70">Focus Time</p>
                            <p className="text-2xl font-bold text-purple-500">{formatTime(focusStats.totalMinutes)}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl">⏱️</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--foreground)] opacity-70">Productivity</p>
                            <p className="text-2xl font-bold text-orange-500">{getProductivityScore()}%</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl">📈</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                    onClick={() => setCurrentModule('tasks')}
                    className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg">Add Task</p>
                            <p className="text-sm opacity-90">Create a new task</p>
                        </div>
                        <span className="text-3xl">➕</span>
                    </div>
                </button>

                <button
                    onClick={() => setCurrentModule('timer')}
                    className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg">Start Focus</p>
                            <p className="text-sm opacity-90">Begin a focus session</p>
                        </div>
                        <span className="text-3xl">🎯</span>
                    </div>
                </button>

                <button
                    onClick={() => setCurrentModule('learning')}
                    className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg">Set Goal</p>
                            <p className="text-sm opacity-90">Create a new goal</p>
                        </div>
                        <span className="text-3xl">🎯</span>
                    </div>
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tasks */}
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Tasks</h2>
                        <button
                            onClick={() => setCurrentModule('tasks')}
                            className="text-[var(--brand-primary)] hover:text-[var(--brand-secondary)] text-sm font-medium transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    {recentTasks.length === 0 ? (
                        <p className="text-[var(--foreground)] opacity-50 text-center py-8">No tasks yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-[var(--hover-bg)] rounded-lg hover:bg-[var(--border)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            readOnly
                                            className="w-4 h-4 text-[var(--brand-primary)] rounded focus:ring-[var(--brand-primary)]"
                                        />
                                        <div>
                                            <p className={`font-medium ${task.completed ? 'line-through text-[var(--foreground)] opacity-50' : ''}`}>
                                                {task.title}
                                            </p>
                                            {task.category && (
                                                <p className="text-xs text-[var(--foreground)] opacity-60">{task.category}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        task.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                                        'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Goals */}
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Active Goals</h2>
                        <button
                            onClick={() => setCurrentModule('learning')}
                            className="text-[var(--brand-primary)] hover:text-[var(--brand-secondary)] text-sm font-medium transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    {recentGoals.length === 0 ? (
                        <p className="text-[var(--foreground)] opacity-50 text-center py-8">No goals yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentGoals.map((goal) => (
                                <div key={goal.id} className="p-4 bg-[var(--hover-bg)] rounded-lg hover:bg-[var(--border)] transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium">{goal.title}</h3>
                                        <span className="text-sm text-[var(--foreground)] opacity-70">{goal.progress}%</span>
                                    </div>
                                    <div className="w-full bg-[var(--border)] rounded-full h-2 mb-2">
                                        <div
                                            className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${goal.progress}%` }}
                                        ></div>
                                    </div>
                                    {goal.targetDate && (
                                        <p className="text-xs text-[var(--foreground)] opacity-60">
                                            Target: {formatDate(goal.targetDate)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Focus Sessions */}
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Focus Sessions</h2>
                        <button
                            onClick={() => setCurrentModule('timer')}
                            className="text-[var(--brand-primary)] hover:text-[var(--brand-secondary)] text-sm font-medium transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    {recentSessions.length === 0 ? (
                        <p className="text-[var(--foreground)] opacity-50 text-center py-8">No focus sessions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentSessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 bg-[var(--hover-bg)] rounded-lg hover:bg-[var(--border)] transition-colors">
                                    <div>
                                        <p className="font-medium">{formatTime(session.duration / 60)}</p>
                                        <p className="text-xs text-[var(--foreground)] opacity-60">
                                            {formatDate(session.startTime)}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        session.completed ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
                                    }`}>
                                        {session.completed ? 'Completed' : 'In Progress'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weekly Focus Chart */}
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] shadow-[var(--shadow)]">
                    <h2 className="text-xl font-semibold mb-4">This Week's Focus</h2>
                    {focusStats.sessionsByDay.length === 0 ? (
                        <p className="text-[var(--foreground)] opacity-50 text-center py-8">No focus data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {focusStats.sessionsByDay.slice(0, 7).map((day) => (
                                <div key={day.date} className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--foreground)] opacity-70">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 bg-[var(--border)] rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full transition-all duration-300"
                                                style={{ 
                                                    width: `${Math.min(100, (day.minutes / 60) * 20)}%` 
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-[var(--foreground)] opacity-60 w-12 text-right">
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