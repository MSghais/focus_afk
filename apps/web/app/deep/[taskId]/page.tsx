'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFocusAFKStore } from '../../../store/store';
import { Task } from '../../../lib/database';
import { useRouter } from 'next/navigation';
import Timer from '../../../components/modules/timer';
import SimpleTimer from '../../../components/modules/timer/TimerBreak';
import TimeLoading from '../../../components/small/loading/time-loading';

export default function DeepModePage() {
    const router = useRouter();
    const params = useParams();
    const taskId = parseInt(params.taskId as string);
    const { tasks, goals, addGoal, updateTask } = useFocusAFKStore();
    const [task, setTask] = useState<Task | null>(null);
    const [goal, setGoal] = useState({
        title: '',
        description: '',
        targetDate: new Date().toISOString().split('T')[0],
        category: ''
    });
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', message: string }>>([]);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    useEffect(() => {
        if (taskId && tasks.length > 0) {
            const foundTask = tasks.find(t => t.id === taskId);
            if (foundTask) {
                setTask(foundTask);
                // Initialize goal with task info
                setGoal({
                    title: `Complete: ${foundTask.title}`,
                    description: foundTask.description || '',
                    targetDate: foundTask.dueDate ? new Date(foundTask.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    category: foundTask.category || ''
                });
            }
        }
    }, [taskId, tasks]);

    const handleStartTimer = () => {
        setIsTimerRunning(true);
        setTimerSeconds(0);
    };

    const handleStopTimer = () => {
        setIsTimerRunning(false);
        // Award XP based on time spent
        const minutesSpent = Math.floor(timerSeconds / 60);
        const xpGained = minutesSpent * 10;
        setXp(prev => prev + xpGained);
        
        // Level up logic
        const newLevel = Math.floor(xp / 100) + 1;
        if (newLevel > level) {
            setLevel(newLevel);
        }
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        
        const userMessage = chatMessage;
        setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);
        setChatMessage('');
        
        // Simulate AI response
        setTimeout(() => {
            const responses = [
                "Great question! Let me help you break this down into smaller steps.",
                "I can see you're making progress. What specific challenge are you facing?",
                "That's a good approach. Have you considered trying it this way?",
                "You're on the right track! Keep going and don't forget to take breaks.",
                "I'm here to support you. What would help you move forward?"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setChatHistory(prev => [...prev, { role: 'assistant', message: randomResponse || '' }]);
        }, 1000);
    };

    const handleCreateGoal = async () => {
        if (!goal.title.trim()) return;
        
        await addGoal({
            title: goal.title,
            description: goal.description,
            targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
            completed: false,
            progress: 0,
            category: goal.category,
            relatedTasks: taskId ? [taskId] : undefined
        });
        
        setGoal({
            title: '',
            description: '',
            targetDate: '',
            category: ''
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    if (!task) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
                <TimeLoading />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-6 bg-[var(--background)]">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-[var(--brand-primary)]">DEEP Mode</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">Level {level}</div>
                            <div className="text-sm text-gray-600">{xp} XP</div>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                        >
                            Exit DEEP
                        </button>
                    </div>
                </div>
                
                {/* Task Card */}
                <div className="rounded-lg p-6 shadow-lg border-l-4 border-[var(--brand-primary)]">
                    <h2 className="text-xl font-bold mb-2">{task.title}</h2>
                    {task.description && (
                        <p className="text-gray-600 mb-4">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-600' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                        }`}>
                            {task.priority} priority
                        </span>
                        {task.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                                {task.category}
                            </span>
                        )}
                        {task.estimatedMinutes && (
                            <span>Est: {task.estimatedMinutes}m</span>
                        )}
                    </div>
                </div>
            </div>
            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Timer & Goals */}
                <div className="space-y-6">

                    <SimpleTimer isSetupEnabled={false} />

                    {/* Goal Setting */}
                    <div className="rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-bold mb-4 text-[var(--gray-500)]">Set Your Goal</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={goal.title}
                                onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                                placeholder="What do you want to achieve?"
                                className="w-full p-3 border rounded-lg"
                            />
                            <textarea
                                value={goal.description}
                                onChange={(e) => setGoal({ ...goal, description: e.target.value })}
                                placeholder="Describe your goal..."
                                rows={3}
                                className="w-full p-3 border rounded-lg"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    value={goal.targetDate}
                                    onChange={(e) => setGoal({ ...goal, targetDate: e.target.value })}
                                    className="p-3 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    value={goal.category}
                                    onChange={(e) => setGoal({ ...goal, category: e.target.value })}
                                    placeholder="Category"
                                    className="p-3 border rounded-lg"
                                />
                            </div>
                            <button
                                onClick={handleCreateGoal}
                                className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-purple-700 transition font-medium"
                            >
                                Create Goal
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column - Mentor Chat */}
                <div className="rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold mb-4 text-[var(--gray-500)]">Mentor AI Assistant</h3>
                    <div className="h-64 overflow-y-auto mb-4 border rounded-lg p-3">
                        {chatHistory.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <p>Ask your mentor for guidance on this task!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {chatHistory.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs p-3 rounded-lg ${
                                                msg.role === 'user'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-200 text-gray-800'
                                            }`}
                                        >
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask your mentor..."
                            className="flex-1 p-3 border rounded-lg"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="px-4 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 