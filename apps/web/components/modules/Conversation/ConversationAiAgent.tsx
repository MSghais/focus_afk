'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import { useWebSocket } from '../../../providers/WebSocketProvider';
import { api } from '../../../lib/api';
import { useUIStore } from '../../../store/uiStore';

export function ConversationAiAgent() {
    const { userConnected } = useAuthStore();
    const { authedSocket } = useWebSocket();
    const { showToast } = useUIStore();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [testResult, setTestResult] = useState<string>('');

    const conversation = useConversation({
        onConnect: () => {
            console.log('ElevenLabs conversation connected');
            showToast({
                type: 'success',
                message: 'Conversation connected successfully',
                description: 'You can now speak with the AI agent',
                duration: 3000
            });
        },
        onDisconnect: () => {
            console.log('ElevenLabs conversation disconnected');
            showToast({
                type: 'info',
                message: 'Conversation disconnected',
                description: 'The conversation session has ended',
                duration: 3000
            });
        },
        onMessage: (message) => {
            console.log('ElevenLabs message:', message);
            // Emit message to WebSocket for backend tracking
            if (authedSocket && sessionId) {
                authedSocket.emit('conversation_message', {
                    sessionId,
                    message: message.message || '',
                    type: message.source === 'user' ? 'user' : 'agent'
                });
            }
        },
        onError: (error) => {
            console.error('ElevenLabs conversation error:', error);
            showToast({
                type: 'error',
                message: 'Conversation error',
                description: typeof error === 'string' ? error : 'An error occurred during the conversation',
                duration: 5000
            });
        },
        onAudio: (audio) => {
            console.log('ElevenLabs audio received:', audio);
            // Handle audio data if needed
        },
    });

    const getSignedUrl = async (): Promise<string> => {
        try {
            console.log('🔍 Attempting to get signed URL from backend...');
            const response = await api.getConversationSignedUrl();
            
            console.log('🔍 API Response:', response);
            
            if (!response.success) {
                console.error('❌ API call failed:', response.error);
                throw new Error(`Failed to get signed URL: ${response.error || 'Unknown error'}`);
            }
            
            if (!response.data?.signedUrl) {
                console.error('❌ No signed URL in response data:', response.data);
                throw new Error('No signed URL received from backend');
            }
            
            console.log('✅ Successfully got signed URL');
            return response.data.signedUrl;
        } catch (error) {
            console.error('❌ Error getting signed URL:', error);
            console.error('❌ Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    };

    const startConversation = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Get signed URL from backend
            const signedUrl = await getSignedUrl();
            
            // Generate session ID
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setSessionId(newSessionId);

            // Emit conversation start to WebSocket
            if (authedSocket) {
                authedSocket.emit('conversation_start', {
                    sessionId: newSessionId,
                    metadata: {
                        userId: userConnected?.id,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Start the conversation with ElevenLabs
            await conversation.startSession({
                connectionType: 'websocket',
                signedUrl: signedUrl,
                userId: userConnected?.id?.toString() || 'anonymous'
            });

            showToast({
                type: 'success',
                message: 'Conversation started',
                description: 'You can now speak with the AI agent',
                duration: 3000
            });

        } catch (error) {
            console.error('Failed to start conversation:', error);
            showToast({
                type: 'error',
                message: 'Failed to start conversation',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
                duration: 5000
            });
        } finally {
            setIsLoading(false);
        }
    }, [conversation, authedSocket, userConnected, showToast]);

    const stopConversation = useCallback(async () => {
        try {
            await conversation.endSession();
            
            // Emit conversation end to WebSocket
            if (authedSocket && sessionId) {
                authedSocket.emit('conversation_end', { sessionId });
            }
            
            setSessionId(null);
            setIsListening(false);
            setIsPaused(false);
            
            showToast({
                type: 'info',
                message: 'Conversation ended',
                description: 'The conversation session has been terminated',
                duration: 3000
            });
        } catch (error) {
            console.error('Failed to stop conversation:', error);
            showToast({
                type: 'error',
                message: 'Failed to stop conversation',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
                duration: 5000
            });
        }
    }, [conversation, authedSocket, sessionId, showToast]);

    const toggleListening = useCallback(async () => {
        try {
            if (conversation.status !== 'connected') {
                showToast({
                    type: 'error',
                    message: 'Not connected',
                    description: 'Please start a conversation first',
                    duration: 3000
                });
                return;
            }

            // Toggle listening state
            setIsListening(!isListening);
            
            if (!isListening) {
                showToast({
                    type: 'success',
                    message: 'Listening mode enabled',
                    description: 'The AI will now listen for your voice input',
                    duration: 2000
                });
            } else {
                showToast({
                    type: 'info',
                    message: 'Listening mode disabled',
                    description: 'Manual listening mode is now off',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Failed to toggle listening:', error);
            showToast({
                type: 'error',
                message: 'Failed to toggle listening',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
                duration: 5000
            });
        }
    }, [conversation, isListening, showToast]);

    const testBackendConnection = useCallback(async () => {
        try {
            console.log('🧪 Testing backend connection...');
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/conversation/test`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Backend test successful:', data);
            setTestResult(`✅ Backend working: ${data.message}`);
            
            showToast({
                type: 'success',
                message: 'Backend connection test successful',
                description: data.message,
                duration: 3000
            });
        } catch (error) {
            console.error('❌ Backend test failed:', error);
            setTestResult(`❌ Backend error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            showToast({
                type: 'error',
                message: 'Backend connection test failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                duration: 5000
            });
        }
    }, [showToast]);

    // Listen for WebSocket conversation events
    useEffect(() => {
        if (!authedSocket) return;

        const handleConversationStarted = (data: { sessionId: string; message: string }) => {
            console.log('Conversation started via WebSocket:', data);
        };

        const handleConversationEnded = (data: { sessionId: string; message: string }) => {
            console.log('Conversation ended via WebSocket:', data);
        };

        const handleConversationError = (data: { message: string; error: string }) => {
            console.error('Conversation error via WebSocket:', data);
            showToast({
                type: 'error',
                message: data.message,
                description: data.error,
                duration: 5000
            });
        };

        authedSocket.on('conversation_started', handleConversationStarted);
        authedSocket.on('conversation_ended', handleConversationEnded);
        authedSocket.on('conversation_error', handleConversationError);

        return () => {
            authedSocket.off('conversation_started', handleConversationStarted);
            authedSocket.off('conversation_ended', handleConversationEnded);
            authedSocket.off('conversation_error', handleConversationError);
        };
    }, [authedSocket, showToast]);

    return (
        <div className="flex flex-col items-center gap-4 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Conversation</h2>
            
            <div className="flex flex-wrap gap-3 justify-center">
                <button
                    onClick={startConversation}
                    disabled={conversation.status === 'connected' || isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Starting...' : 'Start Conversation'}
                </button>
                <button
                    onClick={stopConversation}
                    disabled={conversation.status !== 'connected'}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Stop Conversation
                </button>
                {conversation.status === 'connected' && (
                    <button
                        onClick={toggleListening}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            isListening 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                    >
                        {isListening ? '🎤 Listening' : '🎤 Listen Mode'}
                    </button>
                )}
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                        conversation.status === 'connected' ? 'bg-green-500' : 
                        conversation.status === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <p className="text-sm font-medium text-gray-700">
                        Status: {conversation.status}
                    </p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Agent: {conversation.isSpeaking ? 'speaking' : 'ready'}
                    </span>
                    {isListening && (
                        <span className="flex items-center gap-1 text-green-600">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Listening mode: ON
                        </span>
                    )}
                </div>
                
                {sessionId && (
                    <p className="text-xs text-gray-500">
                        Session: {sessionId}
                    </p>
                )}
            </div>

            {conversation.status === 'connected' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 space-y-2">
                        <p className="text-center font-medium">🎤 How to use:</p>
                        <ul className="space-y-1 text-left">
                            <li>• Click "Listen Mode" to enable manual listening</li>
                            <li>• Speak clearly into your microphone</li>
                            <li>• The AI will respond automatically</li>
                            <li>• Click "Listen Mode" again to disable</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
