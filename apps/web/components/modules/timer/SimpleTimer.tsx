'use client';

import { useState, useEffect, useRef } from "react";
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
    // Local timer state: count up from 0
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Reset timer when component unmounts
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Start timer: count up from 0
    const handleStart = () => {
        setElapsedSeconds(0);
        setIsRunning(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    };

    // Stop timer
    const handleStop = () => {
        setIsRunning(false);
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

    return (
        <div className="w-full flex flex-col items-center justify-center p-6">
            {/* Session Complete Message */}
            {sessionComplete && (
                <div className="mt-6 text-green-600 font-bold text-lg animate-bounce">
                    🎉 Focus session complete!
                </div>
            )}

            <div className="rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-[var(--gray-500)]">Focus Timer</h3>
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