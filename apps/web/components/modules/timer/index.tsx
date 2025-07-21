import { useState, useRef, useEffect } from "react";

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const FOCUS_DURATION = 25 * 60; // 25 minutes

export default function Timer() {
    const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [goal, setGoal] = useState("");
    const [focusDuration, setFocusDuration] = useState(FOCUS_DURATION);

    useEffect(() => {
        if (isRunning && secondsLeft > 0) {
            intervalRef.current = setInterval(() => {
                setSecondsLeft((prev) => prev - 1);
            }, 1000);
        } else if (!isRunning && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (secondsLeft === 0 && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, secondsLeft]);

    const handleStart = () => {
        if (secondsLeft > 0) setIsRunning(true);
    };

    const handlePause = () => setIsRunning(false);

    const handleReset = () => {
        setIsRunning(false);
        setSecondsLeft(focusDuration);
    };

    const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setFocusDuration(FOCUS_DURATION);
        } else {
            setFocusDuration(Number(value) * 60);
        }
    }

    // For smooth UI decount, animate the progress circle
    const progress = 1 - secondsLeft / FOCUS_DURATION;
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="text-2xl font-bold mb-2">Focus Timer</div>
            <div className="text-sm mb-6 text-center">Stay focused for {focusDuration / 60} minutes. You got this!</div>
            {!isRunning && <input type="text" placeholder="Enter your timer in minutes" className="w-full max-w-md p-2 rounded-md border border-gray-300 mb-4"
                value={focusDuration}
                onChange={handleTimerChange}
            />}
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
                        stroke="var(--brand-accent, #4f46e5)"
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
                    {formatTime(secondsLeft)}
                </div>
            </div>
            <div className="flex gap-4">
                {!isRunning && secondsLeft > 0 && (
                    <button
                        className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                        onClick={handleStart}
                    >
                        Start
                    </button>
                )}
                {isRunning && (
                    <button
                        className="px-4 py-2 rounded bg-yellow-500 text-white font-semibold shadow hover:bg-yellow-600 transition"
                        onClick={handlePause}
                    >
                        Pause
                    </button>
                )}
                <button
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
                    onClick={handleReset}
                >
                    Reset
                </button>
            </div>
            <input type="text" placeholder="Write your goals" className=" my-4 w-full max-w-md p-2 rounded-md border border-gray-300 mb-4" />

            {secondsLeft === 0 && (
                <div className="mt-6 text-green-600 font-bold text-lg animate-bounce">
                    🎉 Focus session complete!
                </div>
            )}
        </div>
    );
}