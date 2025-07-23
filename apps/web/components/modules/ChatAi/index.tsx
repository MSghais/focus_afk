'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFocusAFKStore } from '../../../store/store';
import { Task } from '../../../lib/database';
import { useRouter } from 'next/navigation';
import TimeLoading from '../../small/loading/time-loading';
import { logClickedEvent } from '../../../lib/analytics';
import { useUIStore } from '../../../store/uiStore';
import { Message } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';

interface ChatAiProps {
    taskId?: number | string;
}

export default function ChatAi({ taskId }: ChatAiProps) {
    const router = useRouter();
    const params = useParams();
    const {showToast} = useUIStore();
    const { tasks, goals, addGoal, updateTask } = useFocusAFKStore();
    const apiService = useApi();
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);

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

    // Load messages from backend
    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setIsLoadingMessages(true);
            const response = await apiService.getMessages({ limit: 50 });
            
            if (response.success && response.data) {
                // Sort messages by creation date (oldest first for chat display)
                const sortedMessages = response.data.sort((a, b) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                setMessages(sortedMessages);
            } else {
                console.error('Failed to load messages:', response.error);
                showToast({
                    message: 'Failed to load chat history',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            showToast({
                message: 'Error loading chat history',
                type: 'error',
            });
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || isLoading) return;

        const userMessage = chatMessage;
        setChatMessage('');
        setIsLoading(true);

        logClickedEvent('send_message_deep_mode');

        try {
            // Send message to backend
            const response = await apiService.sendChatMessage({
                prompt: userMessage,
                mentorId: undefined, // You can add mentor selection later
            });

            if (response.success) {
                // Reload messages to get the updated conversation
                await loadMessages();
            } else {
                showToast({
                    message: response.error || 'Failed to send message',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showToast({
                message: 'Error sending message',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatMessageTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (isLoadingMessages) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
                <TimeLoading />
            </div>
        );
    }

    return (
        <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[var(--background)]">
            {/* Right Column - Mentor Chat */}
            <div className="rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-[var(--gray-500)]">Mentor AI Assistant</h3>
                <div className="h-64 overflow-y-auto mb-4 border rounded-lg p-3">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p>Ask your mentor for guidance on this task!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs p-3 rounded-lg ${
                                            message.role === 'user'
                                                ? 'bg-[var(--brand-primary)] text-white'
                                                : 'bg-gray-200 text-gray-800'
                                        }`}
                                    >
                                        <div className="text-sm">{message.content}</div>
                                        <div className="text-xs opacity-70 mt-1">
                                            {formatMessageTime(message.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-xs p-3 rounded-lg bg-gray-200 text-gray-800">
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