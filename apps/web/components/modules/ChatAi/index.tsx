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
import { useMentorsStore } from '../../../store/mentors';
import MentorList from '../mentor/MentorList';
import { enhancedMarkdownRenderer, tryMarkdownToHtml } from '../../../lib/helpers';



interface ChatAiProps {
    taskId?: number | string;
    mentorId?: number | string;
    isSelectMentorViewEnabled?: boolean;
    chatId?: string;
    onSendMessage?: (message: string) => void;
    messagesProps?: Message[];
    isLoadingProps?: boolean;
}

export default function ChatAi({ taskId, mentorId, isSelectMentorViewEnabled = false, chatId, onSendMessage, messagesProps, isLoadingProps }: ChatAiProps) {
    const router = useRouter();
    const { selectedMentor } = useMentorsStore();
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
    const [messages, setMessages] = useState<Message[]>(messagesProps || []);
    const [isLoading, setIsLoading] = useState(isLoadingProps || false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [isLoadingMessagesInitial, setIsLoadingMessagesInitial] = useState(true);
    const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);

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

    useEffect(() => {
        if (selectedMentor?.id) {
            // Reset current chat ID when mentor changes
            setCurrentChatId(null);
            loadMessages();
        }
    }, [selectedMentor?.id, mentorId]);

    const loadMessages = async () => {
        try {
            if (!userConnected) {
                showModal(<ProfileUser isLoggoutViewActive={false} />);
                return;
            }

            let messagesArray: Message[] = [];

            // If we have a current chat ID, load messages from that chat
            if (currentChatId) {
                const response = await apiService.getChatMessages(currentChatId, { limit: 50 });
                
                if (response && response.data && Array.isArray(response.data)) {
                    messagesArray = response.data;
                } else if (Array.isArray(response)) {
                    messagesArray = response;
                }
            } else {
                // Try to find an existing chat for the selected mentor
                if (selectedMentor?.id) {
                    const chatsResponse = await apiService.getChats({ 
                        mentorId: selectedMentor.id.toString(), 
                        limit: 1 
                    });
                    
                    if (chatsResponse && chatsResponse.data && chatsResponse.data.length > 0) {
                        const chat = chatsResponse.data[0];
                        setCurrentChatId(chat.id);
                        
                        // Load messages from this chat
                        const messagesResponse = await apiService.getChatMessages(chat.id, { limit: 50 });
                        if (messagesResponse && messagesResponse.data && Array.isArray(messagesResponse.data)) {
                            messagesArray = messagesResponse.data;
                        } else if (Array.isArray(messagesResponse)) {
                            messagesArray = messagesResponse;
                        }
                    }
                }
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

        logClickedEvent('send_message_deep_mode');

        try {
            // Send message to backend
            const response = await apiService.sendChatMessage({
                prompt: userMessage,
                mentorId: selectedMentor?.id?.toString() || undefined,
            });

            if (response?.success || response) {
                // Update current chat ID if this is a new chat
                if (response.data?.chatId && !currentChatId) {
                    setCurrentChatId(response.data.chatId);
                }
                
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
        return tryMarkdownToHtml(content);
    };

    return (
        <div className={styles.chatAi}>
            {/* <h1 className={styles.title}>AI Mentor</h1> */}

            <div className={styles.chatGrid}>
                <div className={styles.chatCard}>

                    <div className={"flex flex-row justify-between items-center"}>
                        <h2 className={styles.cardTitle}>Chat with AI Mentor</h2>


                        {isSelectMentorViewEnabled && (
                            <div className="flex flex-row justify-between items-center">
                                <button onClick={() => {
                                    logClickedEvent('open_mentor_list_from_chat');   
                                    showModal(<MentorList />);
                                }}>
                                    <Icon name="list" />
                                </button>
                            </div>
                        )}

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