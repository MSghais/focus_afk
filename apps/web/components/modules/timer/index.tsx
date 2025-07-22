'use client';

import { useState, useEffect } from "react";
import { useFocusAFKStore } from '../../../store/store';
import { Task, Goal } from '../../../lib/database';
import TimerGoal from "./TimerGoals";
import TimerBreak from "./TimerBreak";

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TimerProps {
    isSetupEnabled: boolean;
}

export default function TimerMain({
    isSetupEnabled = true,
}) {


    const [timerType, setTimerType] = useState<'focus' | 'break'>('break');

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6">


            <div className="flex flex-row items-center justify-center gap-4">
                <button className="bg-gray-500 text-white px-4 py-2 rounded-md active:bg-gray-600" onClick={() => setTimerType('break')}>
                    Break
                </button>
                <button className="bg-gray-500 text-white px-4 py-2 rounded-md active:bg-gray-600" onClick={() => setTimerType('focus')}>
                    Focus
                </button>
            </div>

            {timerType === 'focus' && (
                <div className="flex flex-col items-center justify-center">
                    <TimerGoal isSetupEnabled={true} />
                </div>
            )}

            {timerType === 'break' && (
                <div className="flex flex-col items-center justify-center">
                    <TimerBreak isSetupEnabled={true} />
                </div>
            )}


        </div>
    );


}