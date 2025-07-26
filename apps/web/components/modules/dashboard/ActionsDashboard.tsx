'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';
import { logClickedEvent } from '../../../lib/analytics';

export default function ActionsDashboard() {
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

    return (
        <div className={styles.actionsGrid}>

            <button
                onClick={() => {
                    logClickedEvent('open_timer_from_dashboard');
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
                    <span className={styles.actionIcon}>⏱️</span>
                </div>
            </button>


            <button
                onClick={() => {
                    logClickedEvent('open_journal_dashboard');
                    setCurrentModule('journal');
                    router.push('/journal');
                }}
                className={styles.actionButton}
                style={{ background: 'linear-gradient(to right,rgb(87, 53, 8), rgb(190, 120, 14))', color: 'white' }}
            >
                <div className={styles.actionContent}>
                    <div className={styles.actionInfo}>
                        <p className={styles.actionTitle}>Journal</p>
                        <p className={styles.actionDescription}>Write in your journal</p>
                    </div>
                    <span className={styles.actionIcon}>📝</span>
                </div>
            </button>


            <button
                onClick={() => {
                    logClickedEvent('open_goal_list_from_dashboard');
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
            <button
                onClick={() => {
                    setCurrentModule('tasks');
                    logClickedEvent('open_task_list_from_dashboard');
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


        </div>

    );
}