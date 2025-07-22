'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFocusAFKStore } from '../../../store/store';
import { Task } from '../../../lib/database';
import { useRouter } from 'next/navigation';
import Timer from '../timer';
import SimpleTimer from '../timer/TimerBreak';
import TimeLoading from '../../small/loading/time-loading';
import TimerMain from '../timer';
import { logClickedEvent } from '../../../lib/analytics';


interface ChatAiProps {
    taskId?: number | string;
}

export default function ChatAi({ taskId }: ChatAiProps) {
    const router = useRouter();
    const params = useParams();
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


    useEffect(() => {
        if (taskId && tasks.length > 0) {
            const foundTask = tasks.find(t => t.id === taskId);
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

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;

        const userMessage = chatMessage;
        setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);
        setChatMessage('');

        logClickedEvent('send_message_deep_mode');

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


    // useEffect(() => {
    //     let interval: NodeJS.Timeout;
    //     if (isTimerRunning) {
    //         interval = setInterval(() => {
    //             setTimerSeconds(prev => prev + 1);
    //         }, 1000);
    //     }
    //     return () => clearInterval(interval);
    // }, [isTimerRunning]);

    if (!task) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
                <TimeLoading />
            </div>
        );
    }

    return (
        <div className=" w-full flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6  bg-[var(--background)]">
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
                </div>
            </div>
        </div>
    );
} 