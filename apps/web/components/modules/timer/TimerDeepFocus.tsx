'use client';

import { useState, useEffect, useRef } from "react";
import { useFocusAFKStore } from '../../../store/store';
import { useGamificationStore } from '../../../store/gamification';
import { logClickedEvent } from "../../../lib/analytics";
import { useUIStore } from "../../../store/uiStore";
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

export default function TimerDeepFocus({
    isSetupEnabled = true,
    taskId,
    goalId,
}: TimerProps) {
    // Local timer state: count up from 0
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [questProgress, setQuestProgress] = useState(0);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [currentPhase, setCurrentPhase] = useState<'preparation' | 'journey' | 'completion'>('preparation');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const {
        timer,
        tasks,
        goals,
        settings,
        startTimerFocus,
        pauseTimer,
        resumeTimer,
        stopTimer,
        stopTimeFocus,
        resetTimer,
        setTimerDuration,
        loadSettings
    } = useFocusAFKStore();

    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
    const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();

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
        updateFocusStreak
    } = useGamificationStore();

    // Reset timer when component unmounts
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Quest progress tracking
    useEffect(() => {
        if (isRunning && elapsedSeconds > 0) {
            const progress = Math.min((elapsedSeconds / 3600) * 100, 100); // 1 hour = 100%
            setQuestProgress(progress);
            
            // Achievement milestones
            if (elapsedSeconds === 300 && !achievements.includes('5min')) { // 5 minutes
                setAchievements(prev => [...prev, '5min']);
                unlockAchievement('deep_5min');
            }
            if (elapsedSeconds === 900 && !achievements.includes('15min')) { // 15 minutes
                setAchievements(prev => [...prev, '15min']);
                unlockAchievement('deep_15min');
            }
            if (elapsedSeconds === 1800 && !achievements.includes('30min')) { // 30 minutes
                setAchievements(prev => [...prev, '30min']);
                unlockAchievement('deep_30min');
            }
            if (elapsedSeconds === 3600 && !achievements.includes('1hour')) { // 1 hour
                setAchievements(prev => [...prev, '1hour']);
                unlockAchievement('deep_1hour');
            }
        }
    }, [elapsedSeconds, isRunning, achievements, unlockAchievement]);

    const { showModal } = useUIStore();

    // Start timer: count up from 0
    const handleStart = () => {
        logClickedEvent('timer_deep_focus_start');
        setElapsedSeconds(0);
        setIsRunning(true);
        setCurrentPhase('journey');
        setQuestProgress(0);
        setAchievements([]);
        
        // Consume energy for deep work
        consumeEnergy(10);
        
        startTimerFocus(taskId, Number(goalId));
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    };

    // Stop timer
    const handleStop = async () => {
        logClickedEvent('timer_deep_focus_end');
        setIsRunning(false);
        setCurrentPhase('completion');
        
        // Award XP and update stats
        const minutes = Math.floor(elapsedSeconds / 60);
        const xpEarned = minutes * 15; // 15 XP per minute for deep work
        const focusPointsEarned = minutes * 3; // 3 focus points per minute
        
        addXp(xpEarned, 'deep_work_session');
        addFocusPoints(focusPointsEarned);
        updateSkill('deep_work', minutes * 2);
        recordSession('deep', minutes);
        updateFocusStreak(true);
        
        await stopTimeFocus(true, taskId, Number(goalId), elapsedSeconds);
        
        // Sync to backend
        try {
            await syncTimerSessionsToBackend();
        } catch (error) {
            console.error('Failed to sync timer session to backend:', error);
        }
        
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // Optionally, add pause/resume if needed
    const handlePause = () => {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleResume = () => {
        setIsRunning(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    };

    // Show session complete message if stopped and elapsedSeconds > 0
    const sessionComplete = !isRunning && elapsedSeconds > 0;

    const pendingTasks = tasks.filter(task => !task.completed);
    const pendingGoals = goals.filter(goal => !goal.completed);

    // Calculate XP earned
    const xpEarned = Math.floor(elapsedSeconds / 60) * 15; // 15 XP per minute for deep work
    const levelProgress = (xp % 1000) / 10; // Progress to next level

    return (
        <div className="w-full flex flex-col items-center justify-center p-6 space-y-6">
            {/* Quest Header */}
            <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚔️</div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent mb-2">
                    Deep Quest: The Focus Journey
                </h2>
                <p className="text-gray-400 text-sm">Embark on an intense journey of focused productivity</p>
            </div>

            {/* Quest Progress Bar */}
            <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Quest Progress</span>
                    <span>{Math.round(questProgress)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                    <div 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${questProgress}%` }}
                    ></div>
                </div>
            </div>

            {/* Timer Display */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-xl"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-full p-8 border border-purple-500/30">
                    <div className="text-center">
                        <div className="text-6xl font-mono font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                            {formatTime(elapsedSeconds)}
                        </div>
                        <div className="text-sm text-gray-400">Time in DEEP mode</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full max-w-md">
                {!isRunning ? (
                    <button
                        onClick={handleStart}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                    >
                        🚀 Embark on Journey
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                    >
                        🏁 Complete Quest
                    </button>
                )}
            </div>

            {/* Session Complete Message */}
            {sessionComplete && (
                <div className="w-full max-w-md bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-6 text-center animate-pulse">
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="text-green-400 font-bold text-lg mb-2">Quest Completed!</div>
                    <div className="text-gray-300 text-sm">
                        You've earned <span className="text-yellow-400 font-bold">{xpEarned} XP</span> for your journey
                    </div>
                </div>
            )}

            {/* XP and Level Progress */}
            <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">⚡</span>
                        <span className="text-gray-300 font-semibold">XP Earned</span>
                    </div>
                    <span className="text-yellow-400 font-bold">{xpEarned}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${levelProgress}%` }}
                    ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">
                    Level {level} • {levelProgress.toFixed(1)}% to next level
                </div>
            </div>

            {/* Energy Status */}
            <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-green-400">⚡</span>
                        <span className="text-gray-300 font-semibold">Energy</span>
                    </div>
                    <span className="text-green-400 font-bold">{energy}/{maxEnergy}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(energy / maxEnergy) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
                <div className="w-full max-w-md">
                    <h3 className="text-lg font-bold text-gray-300 mb-3 text-center">🏆 Achievements Unlocked</h3>
                    <div className="space-y-2">
                        {achievements.map((achievement, index) => (
                            <div key={achievement} className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-3 flex items-center space-x-3 animate-bounce">
                                <span className="text-2xl">🏅</span>
                                <div>
                                    <div className="text-yellow-400 font-semibold">
                                        {achievement === '5min' && 'First Steps'}
                                        {achievement === '15min' && 'Focused Warrior'}
                                        {achievement === '30min' && 'Deep Diver'}
                                        {achievement === '1hour' && 'Legendary Focus'}
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        {achievement === '5min' && '5 minutes of deep focus'}
                                        {achievement === '15min' && '15 minutes of deep focus'}
                                        {achievement === '30min' && '30 minutes of deep focus'}
                                        {achievement === '1hour' && '1 hour of deep focus'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Task/Goal Info */}
            {(selectedTaskId || selectedGoalId) && (
                <div className="w-full max-w-md bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">📋 Current Quest Details</h4>
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

            {/* Quest Setup Button */}
            <button
                className="w-full max-w-md py-3 px-6 border-2 border-purple-500/50 text-purple-400 rounded-xl hover:bg-purple-500/10 transition-all duration-300 font-medium"
                onClick={() => {
                    showModal(<div className="w-full max-w-md mb-6 space-y-4">
                        <div className="text-center mb-4">
                            <div className="text-3xl mb-2">⚔️</div>
                            <h3 className="text-lg font-bold text-gray-300">Prepare Your Quest</h3>
                            <p className="text-gray-400 text-sm">Choose your mission and objectives</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Select Task (Optional)</label>
                            {selectedTaskId && (
                                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-3">
                                    <p className="text-sm text-blue-300">
                                        <span className="text-gray-400">Current Quest:</span> <strong>{tasks.find(t => t.id?.toString() === selectedTaskId?.toString())?.title}</strong>
                                    </p>
                                </div>
                            )}

                            <select
                                value={selectedTaskId || ''}
                                onChange={(e) =>{
                                    setSelectedTaskId(e.target.value ? e.target.value : undefined);
                                    logClickedEvent('timer_deep_focus_select_task', 'task', e.target.value);
                                }}
                                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
                                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            >
                                <option value="">No specific goal</option>
                                {pendingGoals.map(goal => (
                                    <option key={goal.id} value={goal.id}>
                                        {goal.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedGoalId && (
                            <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                                <span className="text-green-300">🎯 Goal: <strong>{goals.find(g => g.id?.toString() === selectedGoalId?.toString())?.title}</strong></span>
                            </div>
                        )}
                    </div>);
                }}
            >
                ⚙️ Configure Quest Settings
            </button>
        </div>
    );
}