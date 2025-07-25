'use client';

import { useState, useEffect } from "react";
import { useFocusAFKStore } from '../../../store/store';
import { useGamificationStore } from '../../../store/gamification';
import { Task, Goal } from '../../../types';
import TimerGoal from "./TimerGoals";
import TimerBreak from "./TimerBreak";
import TimerDeepFocus from "./TimerDeepFocus";

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TimerProps {
    isSetupEnabled?: boolean;
    timerTypeProps?: 'focus' | 'break' | 'deep';
    taskId?: string | number;
    goalId?: string;
    task?: Task;
    goal?: Goal;
}

export default function TimerMain({
    isSetupEnabled = true,
    timerTypeProps = 'break',
    taskId,
    goalId,
    task,
    goal,
}: TimerProps) {

    const [timerType, setTimerType] = useState<'focus' | 'break' | 'deep'>(timerTypeProps as 'focus' | 'break' | 'deep' ?? "deep");

    // Gamification store
    const {
        level,
        xp,
        focusPoints,
        totalSessions,
        totalFocusTime,
        totalBreakTime,
        totalDeepTime
    } = useGamificationStore();

    // RPG Mode configurations
    const rpgModes = {
        deep: {
            // name: "Deep Quest",
            name: "Quest",
            description: "Embark on an intense journey of focused productivity",
            icon: "⚔️",
            color: "from-purple-600 to-indigo-700",
            borderColor: "border-purple-500",
            bgColor: "bg-gradient-to-br from-purple-900/20 to-indigo-900/20",
            difficulty: "Legendary",
            xpReward: "500 XP",
            requirements: "Level 5+ Focus"
        },
        focus: {
            // name: "Focus Training",
            name: "Training",
            description: "Sharpen your skills with structured productivity",
            icon: "🎯",
            color: "from-blue-600 to-cyan-600",
            borderColor: "border-blue-500",
            bgColor: "bg-gradient-to-br from-blue-900/20 to-cyan-900/20",
            difficulty: "Advanced",
            xpReward: "300 XP",
            requirements: "Level 3+ Focus"
        },
        break: {
            name: "Rest",
            // name: "Rest & Recovery",
            description: "Recharge your energy for the next adventure",
            icon: "🛡️",
            color: "from-green-600 to-emerald-600",
            borderColor: "border-green-500",
            bgColor: "bg-gradient-to-br from-green-900/20 to-emerald-900/20",
            difficulty: "Beginner",
            xpReward: "100 XP",
            requirements: "Any Level"
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center px-4 py-6 space-y-6 flex-grow">
            {/* RPG Header */}
            <div className="text-center mb-6">
                {/* <h1 className="text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                    🏰 Focus AFK - Adventure Mode
                </h1> */}
                <p className="text-gray-400 text-xs">🏰 Choose your quest and begin your journey</p>
            </div>

            {/* RPG Mode Selector */}
            <div className="overflow-x-auto overflow-y-hidden grid grid-cols-3 md:grid-cols-3 gap-4 w-full max-w-4xl grid-template-columns: repeat(3, 1fr, 125px 125px 125px);">
                {Object.entries(rpgModes).map(([mode, config]) => (
                    <div
                        key={mode}
                        onClick={() => setTimerType(mode as 'focus' | 'break' | 'deep')}
                        className={`
                            whitespace-nowrap 
                            text-wrap-balance;
                            overflow-hidden 
                            group py-2 px-2 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                            ${timerType === mode
                                ? `${config.borderColor} ${config.bgColor} shadow-lg shadow-purple-500/25`
                                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                            }
                        `}
                    >
                        {/* Mode Icon */}

                        <div className="flex flex-row items-center justify-center">
                            <div className="text-sm mb-3">{config.icon}</div>
                            {/* Mode Name */}
                            <p className={`text-xs font-bold mb-2 ${timerType === mode
                                    ? 'text-white'
                                    : 'text-gray-300'
                                }`}>
                                {config.name}
                            </p>

                        </div>


                        {/* Description */}
                        {/* <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-2 ellipsis overflow-hidden no-wrap text-ellipsis">
                            {config.description}
                        </p> */}

                        {/* RPG Stats */}
                        {/* <div className="space-y-2 text-xs hidden md:block">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Difficulty:</span>
                                <span className={`font-semibold ${config.difficulty === 'Legendary' ? 'text-purple-400' :
                                        config.difficulty === 'Advanced' ? 'text-blue-400' :
                                            'text-green-400'
                                    }`}>
                                    {config.difficulty}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">XP Reward:</span>
                                <span className="text-yellow-400 font-semibold">{config.xpReward}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Requirements:</span>
                                <span className="text-gray-300">{config.requirements}</span>
                            </div>
                        </div> */}

                        {/* Selection Indicator */}
                        {/* {timerType === mode && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                            </div>
                        )} */}

                        {/* Hover Effect */}
                        {/* <div className={`
                            absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300
                            bg-gradient-to-br ${config.color}
                        `}></div> */}
                    </div>
                ))}
            </div>

            {/* Quest Progress Bar */}
            {/* <div className="w-full max-w-2xl bg-gray-800 rounded-full h-2 mb-6">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500" 
                     style={{ width: '65%' }}></div>
            </div> */}

            {/* Timer Content */}
            <div className="w-full">
                {timerType === 'focus' && (
                    <div className="flex flex-col items-center justify-center">
                        <TimerGoal isSetupEnabled={true}
                            taskId={taskId}
                            goalId={goalId}
                            task={task}
                            goal={goal}
                        />
                    </div>
                )}

                {timerType === 'deep' && (
                    <div className="flex flex-col items-center justify-center">
                        <TimerDeepFocus isSetupEnabled={true}
                            taskId={taskId}
                            goalId={goalId}
                            task={task}
                            goal={goal}
                        />
                    </div>
                )}

                {timerType === 'break' && (
                    <div className="flex flex-col items-center justify-center py-2">
                        <div className="text-center mb-4">
                            {/* <div className="text-2xl mb-2"></div> */}
                            <p className="text-sm text-gray-400 italic">🛡️Take a restorative break to prepare for your next quest.</p>
                        </div>
                        <TimerBreak isSetupEnabled={true} />
                    </div>
                )}
            </div>

            {/* RPG Status Bar */}
            <div className="w-full max-w-3xl bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-4">
                        <div className="md:flex items-center space-x-2">
                            <p className="text-yellow-400">⭐</p>
                            <span className="text-gray-300">Level {level}</span>
                        </div>
                        <div className="md:flex items-center space-x-2">
                            <p className="text-blue-400">⚡</p>
                            <span className="text-gray-300">{xp.toLocaleString()} XP</span>
                        </div>
                        <div className="md:flex items-center space-x-2">
                            <p className="text-purple-400">🎯</p>
                            <span className="text-gray-300">{focusPoints} Points</span>
                        </div>
                    </div>
                    <div className="md:flex items-center space-x-2">
                        <p className="text-green-400">💎</p>
                        <span className="text-gray-300">{totalSessions} Sessions</span>
                    </div>
                </div>
            </div>
        </div>
    );
}