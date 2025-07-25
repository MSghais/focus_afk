'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFocusAFKStore } from '../../../store/store';
import { useRouter } from 'next/navigation';
// import Timer from '../../../components/modules/timer';
// import SimpleTimer from '../../../components/modules/timer/TimerBreak';
import TimeLoading from '../../../components/small/loading/time-loading';
import TimerMain from '../../../components/modules/timer';
import { logClickedEvent } from '../../../lib/analytics';
import ChatAi from '../../../components/modules/ChatAi';
import GoalsOverview from '../../../components/modules/goals/GoalsOverview';
import { useUIStore } from '../../../store/uiStore';
import { ButtonPrimary } from '../../../components/small/buttons';
import { Task } from '../../../types';

export default function DeepModePage() {
    const router = useRouter();
    const params = useParams();
    const { showModal } = useUIStore();
    const taskId = parseInt(params.taskId as string);
    const { tasks, goals, addGoal, updateTask } = useFocusAFKStore();
    const [task, setTask] = useState<Task | null>(null);
    const [goal, setGoal] = useState({
        id: '',
        taskId: '',
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

    const [isOpenGoalModal, setIsOpenGoalModal] = useState(false);

    useEffect(() => {
        if (taskId && tasks.length > 0) {
            const foundTask = tasks.find(t => t.id === taskId.toString());
            if (foundTask) {
                setTask(foundTask);
                // Initialize goal with task info
                setGoal({
                    id: foundTask?.id?.toString() || '',
                    taskId: foundTask?.id?.toString() || '',
                    title: `Complete: ${foundTask.title}`,
                    description: foundTask.description || '',
                    targetDate: foundTask.dueDate ? new Date(foundTask.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    category: foundTask.category || ''
                });
            }
        }
    }, [taskId, tasks]);

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
            <div className="w-full h-full flex items-center justify-center bg-[var(--background)] align-middle">
                <TimeLoading />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-2 bg-[var(--background)]">
            {/* Header */}
            <div className="mb-6 px-2">
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
                        <span className={`px-2 py-1 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
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

                    <TimerMain timerTypeProps="deep" isSetupEnabled={true} taskId={taskId}
                    // goalId={goal?.} 

                    />


                    {/* 
                    <ButtonPrimary  
                        className="max-w-100"
                        onClick={() => showModal(
                            <>
                                <GoalsOverview />
                            </>
                        )}
                    >
                        Set Your Goal
                    </ButtonPrimary> */}


                </div>

                {/* Right Column - Mentor Chat */}
                <ChatAi taskId={taskId} />

                <div className="rounded-lg p-6 shadow-lg">
                    {/* Check if user is logged in */}
                    {/* <LoginCheck />
                    
                    <AuthDebug /> */}

                    {/* <h3 className="text-lg font-bold mb-4 text-[var(--gray-500)]">Mentor AI Assistant</h3>
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
                                            className={`max-w-xs p-3 rounded-lg ${msg.role === 'user'
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
                    </div> */}
                </div>
            </div>
        </div>
    );
} 