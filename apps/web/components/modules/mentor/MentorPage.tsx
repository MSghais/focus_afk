'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/mentor.module.scss';
import ChatAi from '../ChatAi';
import { useUIStore } from '../../../store/uiStore';
import { useApi } from '../../../hooks/useApi';
import type { Message, Mentor } from '../../../types';
import MentorList from './MentorList';
import ProgressMentor from './Progress';
import { ButtonPrimary, ButtonSecondary, ButtonSimple } from '../../small/buttons';
import { useMentorsStore } from '../../../store/mentors';
import EnhancedChatTester from '../EnhancedChatTester';

interface MentorFeedback {
  sessionId: string;
  rating: number;
  message: string;
  tips: string[];
  nextSteps: string[];
}

interface MentorProps {
  isSetupEnabled?: boolean;
  isEnhancedChatEnabled?: boolean;
}

export default function MentorPageComponent({ isSetupEnabled = false, isEnhancedChatEnabled = true }: MentorProps) {
  const { timerSessions, tasks, goals } = useFocusAFKStore();
  const { showToast } = useUIStore();
  const apiService = useApi();

  const [activeTab, setActiveTab] = useState<"list" | "chat" | "mentor">('list');
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recentFeedback, setRecentFeedback] = useState<MentorFeedback | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const { selectedMentor } = useMentorsStore();

  const [isOpenInsights, setIsOpenInsights] = useState(false);
  const [isViewChatAi, setIsViewChatAi] = useState(false);
  const [isViewEnhancedChat, setIsViewEnhancedChat] = useState(false);

  console.log("isEnhancedChatEnabled", isEnhancedChatEnabled);
  useEffect(() => {
    loadMentors();

    // Load recent session feedback
    if (timerSessions.length > 0) {
      const latestSession = timerSessions[0];
      generateSessionFeedback(latestSession);
    }
  }, []);

  const loadMentors = async () => {
    try {
      const response = await apiService.getMentors();
      if (response) {
        setMentors(response);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const generateSessionFeedback = async (session: any) => {
    // Simulate AI feedback generation
    const feedback: MentorFeedback = {
      sessionId: session.id,
      rating: session.duration > 25 * 60 ? 5 : 4,
      message: session.duration > 25 * 60
        ? "Excellent focus session! You maintained concentration for a full Pomodoro cycle."
        : "Good work! You're building consistent focus habits.",
      tips: [
        "Try breaking complex tasks into smaller chunks",
        "Take regular breaks to maintain mental clarity",
        "Set specific goals for each session"
      ],
      nextSteps: [
        "Schedule your next focus session",
        "Review and update your task priorities",
        "Set a new learning goal"
      ]
    };
    setRecentFeedback(feedback);
  };

  const getProductivityInsights = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalFocusTime = timerSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionLength = timerSessions.length > 0 ? totalFocusTime / timerSessions.length : 0;

    return {
      taskCompletion: Math.round((completedTasks / tasks.length) * 100) || 0,
      totalFocusHours: Math.round(totalFocusTime / 3600 * 10) / 10,
      averageSessionMinutes: Math.round(averageSessionLength / 60),
      streak: timerSessions.filter(s =>
        new Date(s.startTime).toDateString() === new Date().toDateString()
      ).length
    };
  };

  const insights = getProductivityInsights();

  return (
    <div className={styles.simpleMentorContainer}>


      <div className='flex flex-row gap-2 border-b border-gray-500 pb-2'>

        <button
          className={`p-2 rounded-md ${activeTab === "list" ? "border-b border-gray-500" : ""}`}
          onClick={() => setActiveTab("list")}>Mentor List</button>
        <button
          className={`p-2 rounded-md ${activeTab === "chat" ? "border-b border-gray-500" : ""}`}
          onClick={() => setActiveTab("chat")}>Chat</button>
        {/* <button
          className={`border-gray-500 p-2 rounded-md ${activeTab === "mentor" ? "bg-gray-600" : ""}`}
          onClick={() => setActiveTab("mentor")}>Mentor</button> */}

      </div>
      {/* Mentor List */}
      {isEnhancedChatEnabled && (

        <div className='flex flex-row gap-2'>
          <ButtonSimple
            onClick={() => {
              setIsViewEnhancedChat(!isViewEnhancedChat)
              setIsViewChatAi(false)
            }}
            className={styles.simpleToggleButton}
          >
            {isViewEnhancedChat ? "Hide Enhanced Chat" : "Show Enhanced Chat"}
          </ButtonSimple>

          <ButtonSimple
            onClick={() => {
              setIsViewChatAi(!isViewChatAi)
              setIsViewEnhancedChat(false)
            }}
            className={styles.simpleToggleButton}
          >
            {isViewChatAi ? "Hide Chat" : "Show Chat"}
          </ButtonSimple>
        </div>

      )}
      {isViewEnhancedChat && (
        <div className={styles.simpleChatWrapper}>
          <EnhancedChatTester />
        </div>
      )}
      {activeTab === "list" && <MentorList />}


      {isViewChatAi && (
        <div className={styles.simpleChatWrapper}>
          <ChatAi taskId={tasks[0]?.id} mentorId={selectedMentor?.id}
            isSelectMentorViewEnabled={true}
          />
        </div>
      )}

      {/* Chat Section - Simple toggle */}
      {/* {selectedMentor && (
        <div className={styles.simpleChatSection}>

        </div>
      )} */}
    </div>
  );
} 