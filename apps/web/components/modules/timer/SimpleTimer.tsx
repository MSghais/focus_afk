'use client';

import { useState, useEffect } from "react";
import { useFocusAFKStore } from '../../../lib/store';
import { Task, Goal } from '../../../lib/database';

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TimerProps {
    isSetupEnabled: boolean;
}

export default function SimpleTimer({
    isSetupEnabled = true,
}) {
    const {
        timer,
        tasks,
        goals,
        settings,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        setTimerDuration,
        startBreak,
        loadSettings
    } = useFocusAFKStore();

    const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
    const [selectedGoalId, setSelectedGoalId] = useState<number | undefined>();
    const [customDuration, setCustomDuration] = useState(25);
    const [goal, setGoal] = useState("");

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Update custom duration when settings change
    useEffect(() => {
        if (settings?.defaultFocusDuration) {
            setCustomDuration(settings.defaultFocusDuration);
        }
    }, [settings]);

    const handleStart = async () => {
        const duration = customDuration * 60; // Convert to seconds
        await startTimer(duration, selectedTaskId, selectedGoalId);
    };

    const handlePause = () => {
        pauseTimer();
    };

    const handleResume = () => {
        resumeTimer();
    };

    const handleReset = () => {
        resetTimer();
    };

    const handleStop = async () => {
        await stopTimer();
    };

    const handleBreak = async () => {
        const breakDuration = (settings?.defaultBreakDuration || 5) * 60;
        await startBreak(breakDuration);
    };

    const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 25;
        setCustomDuration(value);
        setTimerDuration(value * 60);
    };

    // For smooth UI countdown, animate the progress circle
    const progress = timer.totalSeconds > 0 ? 1 - timer.secondsLeft / timer.totalSeconds : 0;
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference * (1 - progress);

    const pendingTasks = tasks.filter(task => !task.completed);
    const pendingGoals = goals.filter(goal => !goal.completed);

    return (
        <div className="w-full flex flex-col items-center justify-center p-6">
            {/* Session Complete Message */}
            {timer.secondsLeft === 0 && (
                <div className="mt-6 text-green-600 font-bold text-lg animate-bounce">
                    🎉 {timer.isBreak ? 'Break time is over!' : 'Focus session complete!'}
                </div>
            )}

            <div className="rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-[var(--gray-500)]">Focus Timer</h3>
                <div className="text-center mb-4">
                    <div className="text-4xl font-mono font-bold text-[var(--brand-primary)] mb-2">
                        {formatTime(timer.secondsLeft)}
                    </div>
                    <div className="text-sm text-gray-600">Time in DEEP mode</div>
                </div>
                <div className="flex gap-2">
                    {!timer.isRunning ? (
                        <button
                            onClick={handleStart}
                            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                            Start Focus Session
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                            End Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}