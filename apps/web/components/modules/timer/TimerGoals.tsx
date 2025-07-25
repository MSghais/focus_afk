'use client';

import { useState, useEffect } from "react";
import { useFocusAFKStore } from '../../../store/store';
import { logClickedEvent } from "../../../lib/analytics";
import { Task, Goal } from "../../../types";
import { syncTimerSessionsToBackend } from "../../../lib/timerSync";

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TimerProps {
    isSetupEnabled?: boolean;
    taskId?: string | number;
    goalId?: string;
    task?: Task;
    goal?: Goal;
}

export default function TimerGoal({
    isSetupEnabled = true,
    taskId,
    goalId,
}:TimerProps) {
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
        loadSettings
    } = useFocusAFKStore();

    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
    const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
    const [customDuration, setCustomDuration] = useState(settings?.defaultFocusDuration || 25);
    const [goal, setGoal] = useState("");

    // Load settings on mount
    useEffect(() => {
        loadSettings();

        if (settings?.defaultFocusDuration) {
            setCustomDuration(settings.defaultFocusDuration);
            setTimerDuration(settings.defaultFocusDuration * 60);
        }
    }, [loadSettings]);

    // Update custom duration when settings change
    useEffect(() => {
        if (settings?.defaultFocusDuration) {
            setCustomDuration(settings.defaultFocusDuration);
        }
    }, [settings]);

    const handleStart = async () => {
        logClickedEvent('timer_goals_start');
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
        logClickedEvent('timer_goals_end');
        await stopTimer();
        
        // Sync to backend
        try {
            await syncTimerSessionsToBackend();
        } catch (error) {
            console.error('Failed to sync timer session to backend:', error);
        }
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
        <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold mb-2">
                {timer.isBreak ? 'Break Timer' : 'Focus Timer'}
            </div>
            
            <div className="text-sm mb-6 text-center">
                {timer.isBreak 
                    ? `Take a ${settings?.defaultBreakDuration || 5} minute break. You deserve it!`
                    : `Stay focused for ${customDuration} minutes. You got this!`
                }
            </div>

            {/* Task/Goal Selection */}
            {!timer.isRunning && !timer.isBreak && isSetupEnabled && (
                <div className="w-full max-w-md mb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Task (Optional)</label>
                        <select
                            value={selectedTaskId || ''}
                            onChange={(e) => setSelectedTaskId(e.target.value ? e.target.value : undefined)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">No specific task</option>
                            {pendingTasks.map(task => (
                                <option key={task.id} value={task.id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Goal (Optional)</label>
                        <select
                            value={selectedGoalId || ''}
                            onChange={(e) => setSelectedGoalId(e.target.value ? e.target.value : undefined)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">No specific goal</option>
                            {pendingGoals.map(goal => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Duration Input */}
            {!timer.isRunning && (
                <div className="w-full max-w-md mb-6">
                    <label className="block text-sm font-medium mb-2">Timer Duration (minutes)</label>
                    <input 
                        type="number" 
                        placeholder="Enter your timer in minutes" 
                        className="w-full p-2 rounded-md border border-gray-300"
                        value={customDuration}
                        onChange={handleTimerChange}
                        min="1"
                        max="120"
                    />
                </div>
            )}

            {/* Timer Display */}
            <div className="relative flex items-center justify-center mb-6" style={{ width: 140, height: 140 }}>
                <svg width={radius * 2} height={radius * 2}>
                    <circle
                        stroke="var(--border)"
                        fill="none"
                        strokeWidth={stroke}
                        cx={radius}
                        cy={radius}
                        r={normalizedRadius}
                    />
                    <circle
                        stroke={timer.isBreak ? "var(--brand-accent, #10b981)" : "var(--brand-accent, #4f46e5)"}
                        fill="none"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        cx={radius}
                        cy={radius}
                        r={normalizedRadius}
                        style={{
                            transition: "stroke-dashoffset 1s linear"
                        }}
                    />
                </svg>
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ fontSize: "2.2rem", fontWeight: 700, color: "var(--foreground)" }}
                >
                    {formatTime(timer.secondsLeft)}
                </div>
            </div>

            {/* Goal Input */}
            {/* <div className="w-full max-w-md mb-6">
                <label className="block text-sm font-medium mb-2">What are you working on?</label>
                <input 
                    type="text" 
                    placeholder="Write your goals or what you're focusing on" 
                    className="w-full p-2 rounded-md border border-gray-300"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                />
            </div> */}

            {/* Timer Controls */}
            <div className="flex gap-4 mb-6">
                {!timer.isRunning && timer.secondsLeft > 0 && (
                    <button
                        className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                        onClick={handleStart}
                    >
                        Start
                    </button>
                )}
                
                {timer.isRunning && (
                    <button
                        className="px-6 py-3 rounded-lg bg-yellow-500 text-white font-semibold shadow hover:bg-yellow-600 transition"
                        onClick={handlePause}
                    >
                        Pause
                    </button>
                )}
                
                {!timer.isRunning && timer.secondsLeft < timer.totalSeconds && timer.secondsLeft > 0 && (
                    <button
                        className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
                        onClick={handleResume}
                    >
                        Resume
                    </button>
                )}
                
                <button
                    className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
                    onClick={handleReset}
                >
                    Reset
                </button>
                
                {timer.isRunning && (
                    <button
                        className="px-6 py-3 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition"
                        onClick={handleStop}
                    >
                        Stop
                    </button>
                )}
            </div>


            {/* Session Complete Message */}
            {timer.secondsLeft === 0 && (
                <div className="mt-6 text-green-600 font-bold text-lg animate-bounce">
                    🎉 {timer.isBreak ? 'Break time is over!' : 'Focus session complete!'}
                </div>
            )}

            {/* Selected Task/Goal Info */}
            {(selectedTaskId || selectedGoalId) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-md">
                    <p className="text-sm text-blue-800">
                        {selectedTaskId && (
                            <span>Working on: <strong>{tasks.find(t => t.id?.toString() === selectedTaskId?.toString())?.title}</strong></span>
                        )}
                        {selectedGoalId && (
                            <span>Goal: <strong>{goals.find(g => g.id?.toString() === selectedGoalId?.toString())?.title}</strong></span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}