'use client';

import { useState, useEffect } from "react";
import { useFocusAFKStore } from '../../../store/store';
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

export default function OldTimerMain({
    isSetupEnabled = true,
    timerTypeProps = 'break',
    taskId,
    goalId,
    task,
    goal,
}:TimerProps) {


    const [timerType, setTimerType] = useState<'focus' | 'break' | 'deep'>(timerTypeProps as 'focus' | 'break' | 'deep' ?? "deep");

    return (
        <div className="w-full flex flex-col items-center justify-center px-6">


            <div className="flex flex-row items-center justify-center gap-4">
                <button className={`bg-gray-500 text-white px-4 py-2 rounded-md active:bg-gray-600 ${timerType === 'deep' ? 'bg-[var(--brand-primary)]' : ''}`} onClick={() => setTimerType('deep')}>
                    Deep
                </button>
                <button className={`bg-gray-500 text-white px-4 py-2 rounded-md active:bg-gray-600 ${timerType === 'focus' ? 'bg-[var(--brand-primary)]' : ''}`} onClick={() => setTimerType('focus')}>
                    Focus
                </button>
                <button className={`bg-gray-500 text-white px-4 py-2 rounded-md active:bg-gray-600 ${timerType === 'break' ? 'bg-[var(--brand-primary)]' : ''}`} onClick={() => setTimerType('break')}>
                    Break
                </button>
            </div>

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
                <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-sm text-gray-500 italic">Take a break to be productive after.</p>
                    <TimerBreak isSetupEnabled={true} />
                </div>
            )}


        </div>
    );


}