'use client';

import { useState, useEffect, useRef } from "react";
import { useFocusAFKStore } from '../../../store/store';
import { useGamificationStore } from '../../../store/gamification';
import { dbUtils } from '../../../lib/database';
import { logClickedEvent } from "../../../lib/analytics";
import { useAuthStore } from "../../../store/auth";
import { syncTimerSessionsToBackend } from "../../../lib/timerSync";

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TimerProps {
    isSetupEnabled: boolean;
}

export default function TimerBreak({
    isSetupEnabled = true,
}) {
    // Local timer state: count up from 0
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [breakSessionId, setBreakSessionId] = useState<number | null>(null);
    const [healingProgress, setHealingProgress] = useState(0);
    const [restorationLevel, setRestorationLevel] = useState<'tired' | 'refreshed' | 'energized' | 'fully_restored'>('tired');
    const [breakActivities, setBreakActivities] = useState<string[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const {
        // timer, 
        // tasks, 
        // goals, 
        // settings,
        // startTimerBreak,
        // stopTimerBreak
    } = useFocusAFKStore();

    // Gamification store
    const {
        level,
        xp,
        focusPoints,
        energy,
        maxEnergy,
        addXp,
        addFocusPoints,
        restoreEnergy,
        unlockAchievement,
        updateSkill,
        recordSession
    } = useGamificationStore();

    // Reset timer when component unmounts
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Healing progress tracking
    useEffect(() => {
        if (isRunning && elapsedSeconds > 0) {
            const progress = Math.min((elapsedSeconds / 900) * 100, 100); // 15 minutes = 100% healing
            setHealingProgress(progress);

            // Update restoration level based on progress
            if (progress >= 75) {
                setRestorationLevel('fully_restored');
            } else if (progress >= 50) {
                setRestorationLevel('energized');
            } else if (progress >= 25) {
                setRestorationLevel('refreshed');
            }
        }
    }, [elapsedSeconds, isRunning]);

    // Start timer: count up from 0
    const handleStart = async () => {
        logClickedEvent('timer_break_start');
        setElapsedSeconds(0);
        setIsRunning(true);
        setHealingProgress(0);
        setRestorationLevel('tired');
        setBreakActivities([]);

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        // Create a new break session in the DB
        // Get the current userId from the store, fallback to empty string if not available
        const userId = useAuthStore.getState().userConnected?.id || "";
        const sessionId = await dbUtils.addSession({
            type: 'break',
            startTime: new Date().toISOString(),
            duration: 0,
            completed: false,
            isHavingFun: false,
            activities: [],
            persons: [],
            location: '',
            weather: '',
            userId
        });
        setBreakSessionId(sessionId);
    };

    // Stop timer
    const handleStop = async () => {
        logClickedEvent('timer_break_end');
        setIsRunning(false);

        // Award XP and restore energy
        const minutes = Math.floor(elapsedSeconds / 60);
        const xpEarned = minutes * 5; // 5 XP per minute for breaks
        const energyRestored = minutes * 2; // 2 energy per minute

        addXp(xpEarned, 'break_session');
        restoreEnergy(energyRestored);
        updateSkill('restoration', minutes);
        recordSession('break', minutes);

        // Check for break achievements
        if (minutes >= 5) unlockAchievement('break_5min');
        if (minutes >= 15) unlockAchievement('break_15min');

        if (intervalRef.current) clearInterval(intervalRef.current);

        // Update the break session in the DB
        if (breakSessionId !== null) {
            await dbUtils.updateSession(breakSessionId, {
                endTime: new Date().toISOString(),
                duration: elapsedSeconds,
                completed: true,
                activities: breakActivities,
            });
        }

        // Sync to backend
        try {
            await syncTimerSessionsToBackend();
        } catch (error) {
            console.error('Failed to sync timer session to backend:', error);
        }
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

    // Calculate energy restored
    const energyRestored = Math.floor(elapsedSeconds / 60) * 2; // 2 energy per minute

    // Break activity suggestions
    const activitySuggestions = [
        { name: 'Stretching', icon: '🧘', energy: 5 },
        { name: 'Deep Breathing', icon: '🫁', energy: 3 },
        { name: 'Eye Rest', icon: '👁️', energy: 4 },
        { name: 'Hydration', icon: '💧', energy: 2 },
        { name: 'Light Walk', icon: '🚶', energy: 8 },
        { name: 'Meditation', icon: '🧘‍♀️', energy: 6 }
    ];

    const addActivity = (activity: string) => {
        if (!breakActivities.includes(activity)) {
            setBreakActivities(prev => [...prev, activity]);
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center p-6 space-y-6">




            {/* Timer Display */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-full blur-xl"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-full p-8 border border-green-500/30">
                    <div className="text-center">
                        <div className="text-6xl font-mono font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                            {formatTime(elapsedSeconds)}
                        </div>
                        <div className="text-sm text-gray-400">Restorative time</div>
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
                        🛡️ Begin Recovery
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                    >
                        ✨ Complete Rest
                    </button>
                )}
            </div>




            {/* Energy Status */}
            <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-green-400">⚡</span>
                        <span className="text-gray-300 font-semibold">Energy Restored</span>
                    </div>
                    <span className="text-green-400 font-bold">{energyRestored}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((energyRestored / 100) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">
                    {restorationLevel === 'fully_restored' && '🌟 Fully Restored'}
                    {restorationLevel === 'energized' && '⚡ Energized'}
                    {restorationLevel === 'refreshed' && '🔄 Refreshed'}
                    {restorationLevel === 'tired' && '😴 Still Tired'}
                </div>
            </div>

            {/* Healing Progress Bar */}
            <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Healing Progress</span>
                    <span>{Math.round(healingProgress)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                    <div
                        className="bg-gradient-to-r from-green-600 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${healingProgress}%` }}
                    ></div>
                </div>
            </div>




            {/* Session Complete Message */}
            {sessionComplete && (
                <div className="w-full max-w-md bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-6 text-center animate-pulse">
                    <div className="text-4xl mb-2">✨</div>
                    <div className="text-green-400 font-bold text-lg mb-2">Recovery Complete!</div>
                    <div className="text-gray-300 text-sm">
                        You've restored <span className="text-green-400 font-bold">{energyRestored} energy</span> and are ready for your next quest!
                    </div>
                </div>
            )}

            {/* Break Activities */}
            <div className="w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-300 mb-3 text-center">🧘 Restorative Activities</h3>
                <div className="grid grid-cols-2 gap-3">
                    {activitySuggestions.map((activity) => (
                        <button
                            key={activity.name}
                            onClick={() => addActivity(activity.name)}
                            className={`
                                p-3 rounded-lg border transition-all duration-300 text-sm font-medium
                                ${breakActivities.includes(activity.name)
                                    ? 'bg-green-900/30 border-green-500/50 text-green-300'
                                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-green-500/30 hover:bg-green-900/10'
                                }
                            `}
                        >
                            <div className="text-xl mb-1">{activity.icon}</div>
                            <div>{activity.name}</div>
                            <div className="text-xs text-gray-400">+{activity.energy} energy</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Activities */}
            {breakActivities.length > 0 && (
                <div className="w-full max-w-md bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">✅ Activities Completed</h4>
                    <div className="flex flex-wrap gap-2">
                        {breakActivities.map((activity) => (
                            <span key={activity} className="px-2 py-1 bg-blue-800/50 rounded-md text-blue-300 text-xs">
                                {activity}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Rest Tips */}
            {/* <div className="w-full max-w-md bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                <h4 className="text-purple-400 font-semibold mb-2">💡 Rest Tips</h4>
                <div className="space-y-2 text-sm text-gray-300">
                    <div>• Take deep breaths to reduce stress</div>
                    <div>• Stretch to improve circulation</div>
                    <div>• Look away from screens every 20 minutes</div>
                    <div>• Stay hydrated throughout your break</div>
                </div>
            </div> */}
        </div>
    );
}