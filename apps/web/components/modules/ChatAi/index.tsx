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
import styles from '../../../styles/components/chat-ai.module.scss';
import { useAuthStore } from '../../../store/auth';
import ProfileUser from '../../profile/ProfileUser';
import { Icon } from '../../small/icons';
import MarkdownIt from 'markdown-it';

// Add a simple markdown renderer as fallback
const simpleMarkdownRenderer = (text: string) => {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
};

interface ChatAiProps {
    taskId?: number | string;
}

export default function ChatAi({ taskId }: ChatAiProps) {
    const router = useRouter();
    const params = useParams();
    const {showToast, showModal} = useUIStore();
    const { tasks, goals, addGoal, updateTask } = useFocusAFKStore();
    const {userConnected} = useAuthStore();
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

            if(!userConnected) {
                showModal(<ProfileUser />);
                return;
            }

            const response = await apiService.getMessages({ limit: 50 });
            
            console.log('response', response);
            if (response && response) {
                // Sort messages by creation date (oldest first for chat display)
                const sortedMessages = response?.sort((a: Message, b: Message) => 
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
        // if(!userConnected) {
        //     showModal(<ProfileUser />);
        //     return;
        // }

        logClickedEvent('send_message_deep_mode');

        try {
            // Send message to backend
            const response = await apiService.sendChatMessage({
                prompt: userMessage,
                mentorId: undefined, // You can add mentor selection later
            });

            if (response?.success || response) {
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

    // Initialize markdown-it with error handling
    const renderMarkdown = (content: string) => {
        if (!content || typeof content !== 'string') {
            return '';
        }
        
        try {
            const md = new MarkdownIt({
                html: true,
                linkify: true,
                typographer: true
            });
            return md.render(content);
        } catch (error) {
            console.warn('Markdown-it failed, using fallback renderer:', error);
            return simpleMarkdownRenderer(content);
        }
    };


    return (
        <div className={styles.chatAi}>
            <h1 className={styles.title}>AI Mentor</h1>
            
            <div className={styles.chatGrid}>
                <div className={styles.chatCard}>
                    <h2 className={styles.cardTitle}>Chat with AI Mentor</h2>

                    <div>
                        <button onClick={() => {
                            loadMessages();
                        }}>
                            <Icon name="refresh" />
                        </button>
                    </div>

                    {isLoadingMessages && (
                        <div className={styles.loadingState}>
                            <div className={styles.loadingContent}>
                                <div className={styles.spinner}></div>
                                <p>Loading chat history...</p>
                                <TimeLoading /> 
                            </div>
                        </div>
                    )}
                
                    <div className={styles.chatMessages}>
                        {messages.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Start a conversation with your AI mentor!</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                console.log('message', message.content);
                                return (
                                <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>

                                    {message?.role === "assistant" && (
                                        <div className={`${styles.messageContent} ${styles.markdownContent}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || '') }}></div>
                                    )}

                                    {message?.role === "user" && (
                                        <div className={styles.messageContent}>{message.content || ''}</div>
                                    )}

                                    <div className={styles.messageTime}>
                                        {formatMessageTime(message.createdAt)}
                                    </div>
                                </div>
                            );
                        })
                        )}
                        {isLoading && (
                            <div className={`${styles.message} ${styles.ai}`}>
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.chatInput}>
                        <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask me anything about productivity, focus, or your goals..."
                            className={styles.input}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !chatMessage.trim()}
                            className={styles.sendButton}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}