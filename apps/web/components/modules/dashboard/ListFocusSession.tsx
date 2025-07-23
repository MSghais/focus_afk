'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';
import { formatDate, formatTime } from '../../../lib/format';

export default function ListFocusSession() {
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



    const recentSessions = timerSessions.slice(0, 5);

    return (

        <div >
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


    );
}