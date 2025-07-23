'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';
import { formatTime } from '../../../lib/format';

export default function ChartFocus() {
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


    const [focusStats, setFocusStats] = useState({
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
    });


    useEffect(() => {
        const loadStats = async () => {
            const [focusStatsData] = await Promise.all([
                getFocusStats(7),
            ]);
            setFocusStats(focusStatsData);
        };

        loadStats();
    }, [timerSessions, getFocusStats]);



    return (
        <div >
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
    );
}