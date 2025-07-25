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
import ChatAi from '../ChatAi';



interface CompanionOverviewProps {
    taskId?: number | string;
    mentorId?: number | string;
    chatId?:string;
    isSelectMentorViewEnabled?: boolean;
}

export default function CompanionOverview({ taskId, mentorId, chatId, isSelectMentorViewEnabled = false }: CompanionOverviewProps) {
    const { selectedMentor } = useMentorsStore();
    const { showToast, showModal } = useUIStore();
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

    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // Load messages from backend
    useEffect(() => {
        loadMessages();
        setIsLoadingMessagesInitial(true);
    }, []);

    useEffect(() => {
        if (selectedMentor?.id) {
            loadMessages();
        }
    }, [selectedMentor?.id, mentorId]);

    const loadMessages = async () => {
        try {

            if (!userConnected) {
                showModal(<ProfileUser isLoggoutViewActive={false} />);
                return;
            }

            const response = await apiService.getMessages({ limit: 50, mentorId: selectedMentor?.id?.toString() || undefined });

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
                mentorId: selectedMentor?.id?.toString() || undefined, // You can add mentor selection later
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
        return tryMarkdownToHtml(content);
    };

    return (
        <div className={styles.chatAi}>
            {/* <h1 className={styles.title}>AI Mentor</h1> */}

            
            <ChatAi 
            chatId={chatId} 
            isSelectMentorViewEnabled={isSelectMentorViewEnabled}
            taskId={taskId}
            mentorId={mentorId}
            onSendMessage={handleSendMessage}
            messagesProps={messages}
            isLoadingProps={isLoading}
            />
        </div>
    );
}