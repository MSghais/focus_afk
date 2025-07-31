"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getJwtToken } from '../lib/auth'; // adjust import as needed
import { useWebSocketStore } from '../store/websocket';
import { useUIStore } from '../store/uiStore';
import { Quest } from '../lib/gamification';
import QuestItem from '../components/modules/quests/QuestItem';

interface WebSocketContextType {
  publicSocket: Socket | null;
  authedSocket: Socket | null;
  isPublicConnected: boolean;
  isAuthedConnected: boolean;
  error: Error | null;
  requestEnhancedQuests: () => void;
  requestContextualQuests: (triggerPoint: string) => void;
  requestTaskQuests: () => void;
  requestFocusQuests: () => void;
  requestGoalQuests: () => void;
  requestQuickWinQuests: () => void;
  requestLearningQuests: () => void;
  requestWellnessQuests: () => void;
  requestSocialQuests: () => void;
  requestStreakQuests: () => void;
  requestNoteQuests: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  publicSocket: null,
  authedSocket: null,
  isPublicConnected: false,
  isAuthedConnected: false,
  error: null,
  requestEnhancedQuests: () => {},
  requestContextualQuests: () => {},
  requestTaskQuests: () => {},
  requestFocusQuests: () => {},
  requestGoalQuests: () => {},
  requestQuickWinQuests: () => {},
  requestLearningQuests: () => {},
  requestWellnessQuests: () => {},
  requestSocialQuests: () => {},
  requestStreakQuests: () => {},
  requestNoteQuests: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const { setQuestOfTheDay, questOfTheDay, setQuestSuggestions } = useWebSocketStore();
  const [isPublicConnected, setIsPublicConnected] = useState(false);
  const [isAuthedConnected, setIsAuthedConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {showModal, showToast} = useUIStore();
  const publicSocketRef = useRef<Socket | null>(null);
  const authedSocketRef = useRef<Socket | null>(null);

  // Function to request enhanced quests
  const requestEnhancedQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_enhanced_quests');
    }
  };

  // Function to request contextual quests
  const requestContextualQuests = (triggerPoint: string) => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_contextual_quests', triggerPoint);
    }
  };

  // Function to request task-based quests
  const requestTaskQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_task_quests');
    }
  };

  // Function to request focus-based quests
  const requestFocusQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_focus_quests');
    }
  };

  // Function to request goal-based quests
  const requestGoalQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_goal_quests');
    }
  };

  // Function to request quick win quests
  const requestQuickWinQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_quick_win_quests');
    }
  };

  // Function to request learning quests
  const requestLearningQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_learning_quests');
    }
  };

  // Function to request wellness quests
  const requestWellnessQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_wellness_quests');
    }
  };

  // Function to request social quests
  const requestSocialQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_social_quests');
    }
  };

  // Function to request streak-based quests
  const requestStreakQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_streak_quests');
    }
  };

  // Function to request note-based quests
  const requestNoteQuests = () => {
    if (authedSocketRef.current) {
      authedSocketRef.current.emit('request_note_quests');
    }
  };

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:5000';

    // Public socket (no auth)
    const publicSocket = io(backendUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    publicSocketRef.current = publicSocket;

    publicSocket.on('connect', () => {
      setIsPublicConnected(true);
      publicSocket.emit('connection'); // Custom event for public connection
    });
    publicSocket.on('disconnect', () => setIsPublicConnected(false));
    publicSocket.on('connect_error', (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Public WebSocket error:', err);
    });

    // Authed socket (with JWT)
    const token = getJwtToken();
    let authedSocket: Socket | null = null;
    if (token) {
      console.log('Authed WebSocket connection:', token);
      authedSocket = io(backendUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { token },
      });
      authedSocketRef.current = authedSocket;

      authedSocket.on('connect', () => {
        setIsAuthedConnected(true);
        if (authedSocket) {
          authedSocket.emit('authed_connection'); // Custom event for authed connection
          // Ping-pong test
          authedSocket.emit('ping');
          console.log('Sent ping to backend');
        }
      });
      authedSocket.on('pong', () => {
        console.log('Received pong from backend');
      });

      // Handle personalized quest of the day
      authedSocket.on('quest_of_the_day', (quest: Quest) => {
        console.log('Personalized quest of the day:', quest);
        showModal(<QuestItem quest={quest} isExpanded={true} />)
        setQuestOfTheDay(quest);
      });

      // Handle quest suggestions (additional personalized quests)
      authedSocket.on('quest_suggestions', (suggestions: Quest[]) => {
        console.log('Quest suggestions received:', suggestions);
        setQuestSuggestions(suggestions);
        
        // Show a toast notification about additional quests
        if (suggestions.length > 0) {
          showToast({
            type: 'info',
            message: `You have ${suggestions.length} additional personalized quests available!`,
            description: 'Additional Quests Available',
            duration: 5000
          });
        }
      });

      // Handle enhanced quests response
      authedSocket.on('enhanced_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Enhanced quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Enhanced Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle contextual quests response
      authedSocket.on('contextual_quests_response', (response: {
        quests: Quest[];
        triggerPoint: string;
        message: string;
        error?: string;
      }) => {
        console.log('Contextual quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: `${response.message} (${response.triggerPoint})`,
            description: 'Contextual Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Contextual Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle task quests response
      authedSocket.on('task_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Task quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Task Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Task Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle focus quests response
      authedSocket.on('focus_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Focus quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Focus Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Focus Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle goal quests response
      authedSocket.on('goal_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Goal quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Goal Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Goal Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle quick win quests response
      authedSocket.on('quick_win_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Quick win quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Quick Win Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Quick Win Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle learning quests response
      authedSocket.on('learning_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Learning quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Learning Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Learning Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle wellness quests response
      authedSocket.on('wellness_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Wellness quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Wellness Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Wellness Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle social quests response
      authedSocket.on('social_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Social quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Social Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Social Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle streak quests response
      authedSocket.on('streak_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Streak quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Streak Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Streak Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // Handle note quests response
      authedSocket.on('note_quests_response', (response: {
        quests: Quest[];
        message: string;
        error?: string;
      }) => {
        console.log('Note quests response:', response);
        if (response.quests && response.quests.length > 0) {
          setQuestSuggestions(response.quests);
          showToast({
            type: 'success',
            message: response.message,
            description: 'Note Quests Generated',
            duration: 4000
          });
        } else if (response.error) {
          showToast({
            type: 'error',
            message: response.error,
            description: 'Note Quest Generation Failed',
            duration: 4000
          });
        }
      });

      // authedSocket.on('disconnect', () => setIsAuthedConnected(false));
      authedSocket.on('connect_error', (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error('Authed WebSocket error:', err);
      });
    }

    return () => {
      publicSocket.disconnect();
      publicSocket.off();
      if (authedSocket) {
        authedSocket.disconnect();
        authedSocket.off();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        publicSocket: publicSocketRef.current,
        authedSocket: authedSocketRef.current,
        isPublicConnected,
        isAuthedConnected,
        error,
        requestEnhancedQuests,
        requestContextualQuests,
        requestTaskQuests,
        requestFocusQuests,
        requestGoalQuests,
        requestQuickWinQuests,
        requestLearningQuests,
        requestWellnessQuests,
        requestSocialQuests,
        requestStreakQuests,
        requestNoteQuests,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}; 