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
import { useMentorsStore } from '../../../store/mentors';
import { ButtonPrimary, ButtonSimple } from '../../../components/small/buttons';
import { Task } from '../../../types';
import MentorList from '../../../components/modules/mentor/MentorList';

export default function DeepModePage() {
    const router = useRouter();
    const params = useParams();
    const { showModal } = useUIStore();
    const { selectedMentor } = useMentorsStore();
    const taskId = params.taskId as string;
    const { tasks, goals, addGoal, updateTask, getTask } = useFocusAFKStore();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    const [isOpenChatAi, setIsOpenChatAi] = useState(false);

    const [isOpenGoalModal, setIsOpenGoalModal] = useState(false);

    useEffect(() => {
        const loadTask = async () => {
            if (!taskId) {
                setError('Invalid task ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                // Try to get task using the new getTask function
                const foundTask = await getTask(taskId);
                
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
                } else {
                    setError('Task not found');
                }
            } catch (err) {
                console.error('Failed to load task:', err);
                setError('Failed to load task');
            } finally {
                setLoading(false);
            }
        };

        loadTask();
    }, [taskId, getTask]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--background)] align-middle">
                <TimeLoading />
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--background)] align-middle">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Task</h1>
                    <p className="text-gray-600 mb-4">{error || 'Task not found'}</p>
                    <button
                        onClick={() => router.push('/tasks')}
                        className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-secondary)] transition"
                    >
                        Back to Tasks
                    </button>
                </div>
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
                        {/* <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                        >
                            Exit DEEP
                        </button> */}
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

                    <TimerMain timerTypeProps="deep" isSetupEnabled={true} taskId={typeof taskId === 'string' ? parseInt(taskId) || undefined : taskId}
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
                <div className="space-y-4">
                    {/* Mentor Selection Header */}
                    <div className=" rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Mentor</h3>
                            <button
                                onClick={() => {
                                    showModal(<MentorList isSelectMentorViewEnabled={true} 
                                    isCreateMentorViewEnabled={false}
                                    />);
                                }}
                                className="px-3 py-1 text-sm bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-secondary)] transition"
                            >
                                Select Mentor
                            </button>
                        </div>
                        
                        {/* Selected Mentor Display */}
                        <div className="flex items-center gap-3">
                            {selectedMentor ? (
                                <>
                                    <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white font-semibold">
                                        {selectedMentor.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]">{selectedMentor.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMentor.role}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                    <div className=" w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                        🤖
                                    </div>
                                    <div>
                                        <p className="text-sm">No mentor selected</p>
                                        <p className="text-xs">Click "Select Mentor" to choose an AI mentor</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Component */}

                    <div className="flex justify-end">
                        <ButtonSimple onClick={() => setIsOpenChatAi(!isOpenChatAi)}>
                            {isOpenChatAi ? 'Close Chat' : 'Open Chat'}
                        </ButtonSimple>
                    </div>

                    {isOpenChatAi && (
                    <ChatAi 
                        taskId={typeof taskId === 'string' ? parseInt(taskId) || undefined : taskId} 
                        isSelectMentorViewEnabled={true}
                    />
                    )}
                </div>
            </div>
        </div>
    );
} 