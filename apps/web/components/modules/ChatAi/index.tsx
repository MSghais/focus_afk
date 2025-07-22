'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFocusAFKStore } from '../../../store/store';
import { Task } from '../../../lib/database';
import { useRouter } from 'next/navigation';
import TimeLoading from '../../small/loading/time-loading';
import { logClickedEvent } from '../../../lib/analytics';
import { useUIStore } from '../../../store/uiStore';

interface ChatAiProps {
    taskId?: number | string;
}

// AI Service function to call the backend
const callMentorAI = async (prompt: string, model: string = 'GEMMA_3N_E2B_IT') => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/mentor/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                model,
            }),
        });

        console.log('response', response);

        if (!response.ok) {
            console.log('response', response);
            return undefined
            // throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error calling mentor AI:', error);
        // throw error;
        console.log('error', error);
        return undefined;
    }
};

export default function ChatAi({ taskId }: ChatAiProps) {
    const router = useRouter();
    const params = useParams();
    const {showToast} = useUIStore();
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
    const [isLoading, setIsLoading] = useState(false);

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

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || isLoading) return;

        const userMessage = chatMessage;
        setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);
        setChatMessage('');
        setIsLoading(true);

        logClickedEvent('send_message_deep_mode');

        try {
            // Call the backend AI service
            const aiResponse = await callMentorAI(userMessage);
            if(!aiResponse) {
                setIsLoading(false);
                showToast({
                    message: 'Error calling mentor AI',
                    type: 'error',
                });
                return;
            }
            
            // Add AI response to chat history
            setChatHistory(prev => [...prev, { 
                role: 'assistant', 
                message: aiResponse.text || 'I apologize, but I encountered an error processing your request.' 
            }]);
            setIsLoading(false);
        } catch (error) {
            console.error('Error getting AI response:', error);
            // Add error message to chat history
            setChatHistory(prev => [...prev, { 
                role: 'assistant', 
                message: 'I apologize, but I\'m having trouble connecting right now. Please try again later.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // if (!task) {
    //     return (
    //         <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
    //             <TimeLoading />
    //         </div>
    //     );
    // }

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
                                            ? 'bg-[var(--brand-primary)] text-white'
                                            : 'bg-gray-200 text-gray-800'
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-xs p-3 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !chatMessage.trim()}
                        className="px-4 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}