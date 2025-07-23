'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useFocusAFKStore } from '../../../store/store';
import { Task, Message } from '../../../types';
import { useRouter } from 'next/navigation';
import TimeLoading from '../../small/loading/time-loading';
import { logClickedEvent } from '../../../lib/analytics';
import { useUIStore } from '../../../store/uiStore';
import { useApi } from '../../../hooks/useApi';
import styles from '../../../styles/components/chat-ai.module.scss';
import { useAuthStore } from '../../../store/auth';
import ProfileUser from '../../profile/ProfileUser';
import { Icon } from '../../small/icons';

// Enhanced markdown renderer without external dependencies
const enhancedMarkdownRenderer = (text: string) => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // First, handle line breaks properly for long text
    let processedText = text
        // HTML escaping
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Lists
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Handle line breaks and paragraphs more carefully
    // Split by double line breaks first
    const paragraphs = processedText.split(/\n\n+/);
    const processedParagraphs = paragraphs.map(paragraph => {
        if (paragraph.trim() === '') return '';
        
        // Check if paragraph already contains HTML tags
        if (/<[^>]+>/.test(paragraph)) {
            return paragraph;
        }
        
        // Replace single line breaks with <br> tags
        const withBreaks = paragraph.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
    });

    return processedParagraphs.join('');
};

interface ChatAiProps {
    taskId?: number | string;
    mentorId?: number | string;
}

export default function ChatAi({ taskId, mentorId }: ChatAiProps) {
    const router = useRouter();
    const params = useParams();
    const { showToast, showModal } = useUIStore();
    const { tasks, goals, addGoal, updateTask } = useFocusAFKStore();
    const { userConnected } = useAuthStore();
    const apiService = useApi();
    const messagesEndRef = useRef<HTMLDivElement>(null);
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
    const [isLoadingMessagesInitial, setIsLoadingMessagesInitial] = useState(true);

    console.log('mentorId', mentorId);
    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    targetDate: foundTask.dueDate ? foundTask.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    category: foundTask.category || ''
                });
            }
        }
    }, [taskId, tasks]);

    // Load messages from backend
    useEffect(() => {
        loadMessages();
        setIsLoadingMessagesInitial(true);
    }, []);

    const loadMessages = async () => {
        try {

            if (!userConnected) {
                showModal(<ProfileUser />);
                return;
            }

            const response = await apiService.getMessages({ limit: 50, mentorId: mentorId?.toString() || undefined });

            // console.log('Messages response:', response);
            
            // Handle both direct array response and wrapped response
            let messagesArray: Message[] = [];
            if (Array.isArray(response)) {
                messagesArray = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                messagesArray = response.data;
            } else if (response && response.success && response.data && Array.isArray(response.data)) {
                messagesArray = response.data;
            }

            if (messagesArray.length > 0) {
                // Sort messages by creation date (oldest first for chat display)
                const sortedMessages = messagesArray.sort((a: Message, b: Message) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateA - dateB;
                });
                setMessages(sortedMessages);
                console.log('Loaded messages:', sortedMessages.length);
            } else {
                console.log('No messages found or empty response');
                setMessages([]);
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
                mentorId: mentorId?.toString() || undefined, // You can add mentor selection later
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

    // Use the enhanced markdown renderer
    const renderMarkdown = (content: string) => {
        return enhancedMarkdownRenderer(content);
    };

    return (
        <div className={styles.chatAi}>
            {/* <h1 className={styles.title}>AI Mentor</h1> */}

            <div className={styles.chatGrid}>
                <div className={styles.chatCard}>

                    <div className={"flex flex-row justify-between items-center"}>
                        <h2 className={styles.cardTitle}>Chat with AI Mentor</h2>

                        <div>
                            <button onClick={() => {
                                loadMessages();
                            }}>
                                <Icon name="refresh" />
                            </button>
                        </div>

                    </div>

                    {isLoadingMessages && (
                        <TimeLoading />
                    )}

                    <div className={styles.chatMessages}>
                        {messages.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Start a conversation with your AI mentor!</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                // console.log('Rendering message:', message.role, message.content?.substring(0, 50) + '...');
                                return (
                                    <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>

                                        {message?.role === "assistant" && (
                                            <div className={`${styles.messageContent} ${styles.markdownContent}`}>
                                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || '') }}></div>
                                                {message.content && message.content.length > 1000 && (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                                                        (Message length: {message.content.length} characters)
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {message?.role === "user" && (
                                            <div className={styles.messageContent}>{message.content || ''}</div>
                                        )}

                                        <div className={styles.messageTime}>
                                            {message.createdAt ? formatMessageTime(message.createdAt) : ''}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {isLoading && (
                            <div className={`${styles.message} ${styles.assistant}`}>
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
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