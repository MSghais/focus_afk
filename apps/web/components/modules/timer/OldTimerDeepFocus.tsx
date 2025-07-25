'use client';

import { useState, useEffect, useRef } from "react";
import { useFocusAFKStore } from '../../../store/store';
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

export default function OldTimerDeepFocus({
    isSetupEnabled = true,
    taskId,
    goalId,
}: TimerProps) {
    // Local timer state: count up from 0
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
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
    // Reset timer when component unmounts
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const { showModal } = useUIStore();

    // Start timer: count up from 0
    const handleStart = () => {
        logClickedEvent('timer_deep_focus_start');
        setElapsedSeconds(0);
        setIsRunning(true);
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

    return (
        <div className="w-full flex flex-col items-center justify-center p-6">
            {/* Session Complete Message */}
            {sessionComplete && (
                <div className="mt-6 text-green-600 font-bold text-lg animate-bounce">
                    🎉 Focus session complete!
                </div>
            )}

            <div className="rounded-lg p-6 shadow-lg">
                {/* <h3 className="text-lg font-bold mb-4 text-[var(--gray-500)]">Focus Timer</h3> */}
                <div className="text-center mb-4">
                    <div className="text-4xl font-mono font-bold text-[var(--brand-primary)] mb-2">
                        {formatTime(elapsedSeconds)}
                    </div>
                    <div className="text-sm text-gray-600">Time in DEEP mode</div>
                </div>
                <div className="flex gap-2">
                    {!isRunning ? (
                        <button
                            onClick={handleStart}
                            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
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

            <button
                className="mt-4 border-2 border-gray-300 rounded-md p-2"

                onClick={() => {
                    showModal(<div className="w-full max-w-md mb-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Task (Optional)</label>
                            {selectedTaskId && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-md">
                                    <p className="text-sm text-blue-800">
                                        {selectedTaskId && (
                                            <span>Working on: <strong>{tasks.find(t => t.id?.toString() === selectedTaskId?.toString())?.title}</strong></span>
                                        )}
                                     
                                    </p>
                                </div>
                            )}


                            <select
                                value={selectedTaskId || ''}
                                onChange={(e) =>{
                                    setSelectedTaskId(e.target.value ? e.target.value : undefined);
                                    logClickedEvent('timer_deep_focus_select_task', 'task', e.target.value);
                                }}
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


                        {selectedGoalId && (
                            <div>
                                <span>Goal: <strong>{goals.find(g => g.id?.toString() === selectedGoalId?.toString())?.title}</strong></span>
                            </div>
                        )}
                    </div>);
                }}
            >
                Set Your Goal
            </button>



        </div>
    );
}