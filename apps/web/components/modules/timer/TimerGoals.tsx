'use client';

import { useState, useEffect } from "react";
import { useFocusAFKStore } from '../../../store/store';
import { useGamificationStore } from '../../../store/gamification';
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
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [skillLevel, setSkillLevel] = useState<'novice' | 'apprentice' | 'adept' | 'master'>('novice');
    const [focusStreak, setFocusStreak] = useState(0);

    // Gamification store
    const {
        level,
        xp,
        focusPoints,
        energy,
        maxEnergy,
        addXp,
        addFocusPoints,
        consumeEnergy,
        unlockAchievement,
        updateSkill,
        recordSession,
        updateFocusStreak: updateFocusStreakGlobal
    } = useGamificationStore();

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

    // Training progress tracking
    useEffect(() => {
        if (timer.isRunning && timer.totalSeconds > 0) {
            const progress = ((timer.totalSeconds - timer.secondsLeft) / timer.totalSeconds) * 100;
            setTrainingProgress(progress);
            
            // Update skill level based on progress
            if (progress >= 75) {
                setSkillLevel('master');
            } else if (progress >= 50) {
                setSkillLevel('adept');
            } else if (progress >= 25) {
                setSkillLevel('apprentice');
            }
        }
    }, [timer.secondsLeft, timer.totalSeconds, timer.isRunning]);

    const handleStart = async () => {
        logClickedEvent('timer_goals_start');
        const duration = customDuration * 60; // Convert to seconds
        setTrainingProgress(0);
        setSkillLevel('novice');
        
        // Consume energy for focus training
        consumeEnergy(5);
        
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
        setTrainingProgress(0);
        setSkillLevel('novice');
    };

    const handleStop = async () => {
        logClickedEvent('timer_goals_end');
        
        // Award XP and update stats
        const minutes = Math.floor((timer.totalSeconds - timer.secondsLeft) / 60);
        const xpEarned = minutes * 10; // 10 XP per minute for focus training
        const focusPointsEarned = minutes * 2; // 2 focus points per minute
        
        addXp(xpEarned, 'focus_training_session');
        addFocusPoints(focusPointsEarned);
        updateSkill('focus', minutes);
        recordSession('focus', minutes);
        updateFocusStreakGlobal(true);
        
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

    // Calculate training rewards
    const xpEarned = Math.floor((timer.totalSeconds - timer.secondsLeft) / 60) * 5; // 5 XP per minute
    const focusPointsEarned = Math.floor((timer.totalSeconds - timer.secondsLeft) / 60) * 2; // 2 focus points per minute

    return (
        <div className="w-full flex flex-col  space-y-6 justify-center items-center">
            {/* Training Header */}
            <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                    Focus Training Academy
                </h2>
                <p className="text-gray-400 text-sm">Sharpen your skills with structured productivity training</p>
            </div>

            {/* Skill Level Display */}
            <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-blue-400">⚔️</span>
                        <span className="text-gray-300 font-semibold">Skill Level</span>
                    </div>
                    <span className={`font-bold ${
                        skillLevel === 'master' ? 'text-purple-400' :
                        skillLevel === 'adept' ? 'text-blue-400' :
                        skillLevel === 'apprentice' ? 'text-green-400' :
                        'text-gray-400'
                    }`}>
                        {skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}
                    </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${trainingProgress}%` }}
                    ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">
                    Training Progress: {Math.round(trainingProgress)}%
                </div>
            </div>

            {/* Training Progress Bar */}
            <div className="w-full max-w-md  justify-center items-center">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Mission Progress</span>
                    <span>{Math.round(trainingProgress)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                    <div 
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${trainingProgress}%` }}
                    ></div>
                </div>
            </div>

            {/* Timer Display */}
            <div className="relative max-w-md  justify-center items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-xl"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-full p-8 border border-blue-500/30">
                    <div className="text-center">
                        <div className="text-6xl font-mono font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                            {formatTime(timer.secondsLeft)}
                        </div>
                        <div className="text-sm text-gray-400">Training time remaining</div>
                    </div>
                </div>
            </div>

            {/* Training Rewards */}
            <div className="w-full bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <div className="text-2xl mb-1">⚡</div>
                        <div className="text-yellow-400 font-bold">{xpEarned}</div>
                        <div className="text-xs text-gray-400">XP Earned</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-blue-400 font-bold">{focusPointsEarned}</div>
                        <div className="text-xs text-gray-400">Focus Points</div>
                    </div>
                </div>
            </div>

            {/* Task/Goal Selection */}
            {!timer.isRunning && !timer.isBreak && isSetupEnabled && (
                <div className="w-full max-w-md  space-y-4">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-gray-300">🎯 Mission Objectives</h3>
                        <p className="text-gray-400 text-sm">Choose your training targets</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Select Task (Optional)</label>
                        <select
                            value={selectedTaskId || ''}
                            onChange={(e) => setSelectedTaskId(e.target.value ? e.target.value : undefined)}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium mb-2 text-gray-300">Select Goal (Optional)</label>
                        <select
                            value={selectedGoalId || ''}
                            onChange={(e) => setSelectedGoalId(e.target.value ? e.target.value : undefined)}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                <div className="w-full  ">
                    <label className="block text-sm font-medium mb-2 text-gray-300">Training Duration (minutes)</label>
                    <input 
                        type="number" 
                        placeholder="Enter your training duration" 
                        className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={customDuration}
                        onChange={handleTimerChange}
                        min="1"
                        max="120"
                    />
                </div>
            )}

            {/* Timer Controls */}
            <div className="flex gap-4 w-full  ">
                {!timer.isRunning && timer.secondsLeft > 0 && (
                    <button
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                        onClick={handleStart}
                    >
                        🚀 Start Training
                    </button>
                )}
                
                {timer.isRunning && (
                    <button
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105"
                        onClick={handlePause}
                    >
                        ⏸️ Pause
                    </button>
                )}
                
                {!timer.isRunning && timer.secondsLeft < timer.totalSeconds && timer.secondsLeft > 0 && (
                    <button
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                        onClick={handleResume}
                    >
                        ▶️ Resume
                    </button>
                )}
                
                <button
                    className="py-4 px-6 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 font-bold text-lg"
                    onClick={handleReset}
                >
                    🔄 Reset
                </button>
                
                {timer.isRunning && (
                    <button
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                        onClick={handleStop}
                    >
                        🏁 End Training
                    </button>
                )}
            </div>

            {/* Session Complete Message */}
            {timer.secondsLeft === 0 && (
                <div className="w-full bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-6 text-center animate-pulse">
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="text-green-400 font-bold text-lg mb-2">
                        {timer.isBreak ? 'Break Complete!' : 'Training Session Complete!'}
                    </div>
                    <div className="text-gray-300 text-sm">
                        You've earned <span className="text-yellow-400 font-bold">{xpEarned} XP</span> and <span className="text-blue-400 font-bold">{focusPointsEarned} Focus Points</span>
                    </div>
                </div>
            )}

            {/* Selected Task/Goal Info */}
            {(selectedTaskId || selectedGoalId) && (
                <div className="w-full bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">📋 Current Mission</h4>
                    <div className="space-y-2 text-sm">
                        {selectedTaskId && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Task:</span>
                                <span className="text-blue-300 font-medium">
                                    {tasks.find(t => t.id?.toString() === selectedTaskId?.toString())?.title}
                                </span>
                            </div>
                        )}
                        {selectedGoalId && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Goal:</span>
                                <span className="text-blue-300 font-medium">
                                    {goals.find(g => g.id?.toString() === selectedGoalId?.toString())?.title}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Training Tips */}
            <div className="w-full bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                <h4 className="text-purple-400 font-semibold mb-2">💡 Training Tips</h4>
                <div className="space-y-2 text-sm text-gray-300">
                    <div>• Set clear objectives before starting</div>
                    <div>• Eliminate distractions during training</div>
                    <div>• Take short breaks between sessions</div>
                    <div>• Track your progress and celebrate wins</div>
                </div>
            </div>
        </div>
    );
}