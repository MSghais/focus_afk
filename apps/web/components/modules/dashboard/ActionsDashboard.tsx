'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/dashboard.module.scss';
import { useRouter } from 'next/navigation';

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

    );
}