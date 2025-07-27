'use client';

import { useState, useEffect, useRef } from 'react';
import { Note, NoteSource, NoteRelation, Message } from '../../../types';
import { Modal } from '../../small/Modal/Modal';
import api from '../../../lib/api';
import { useNotesStore } from '../../../store/notes';
import SourceToolsRecommendation from './SourceToolsRecommendation';
import { useUIStore } from '../../../store/uiStore';
import { useAuthStore } from '../../../store/auth';
import { tryMarkdownToHtml } from '../../../lib/helpers';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatNotebookProps {
  note: Note;
  onUpdate: (note: Partial<Note>) => void;
  onBack: () => void;
}

export default function ChatNotebook({ note, onUpdate, onBack }: ChatNotebookProps) {
  const { showToast } = useUIStore();
  const { userConnected } = useAuthStore();
  const { notes, setNotes, noteSources, setNoteSources, selectedNote, setSelectedNote, selectedNoteSource, setSelectedNoteSource } = useNotesStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing chat messages
  useEffect(() => {
    if (note.id) {
      loadChatMessages();
    }
  }, [note.id]);

  const loadChatMessages = async () => {
    if (!userConnected || !note.id) return;
    
    setIsLoadingMessages(true);
    try {
      const response = await api.getNoteChat(note.id);
      if (response.success && response.data) {
        // Convert API messages to ChatMessage format
        const chatMessages: ChatMessage[] = (response.data.messages || []).map(msg => ({
          id: msg.id || `msg_${Date.now()}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content || '',
          createdAt: msg.createdAt || new Date().toISOString()
        }));
        setMessages(chatMessages);
        setChatId(response.data.chat?.id || null);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !userConnected || !note.id) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Add user message immediately for better UX
    const tempUserMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await api.chatAboutNote({
        noteId: note.id,
        prompt: userMessage
      });

      if (response.success && response.data) {
        // Remove temp message and add real messages
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
          return [...filtered, {
            id: response.data!.messageId,
            role: 'assistant',
            content: response.data!.response,
            createdAt: new Date().toISOString()
          }];
        });
        
        if (response.data!.chatId && !chatId) {
          setChatId(response.data!.chatId);
        }
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        showToast({
          message: response.error || 'Failed to send message',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      showToast({
        message: 'Error sending message',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMarkdown = (content: string) => {
    return tryMarkdownToHtml(content);
  };

  const handleSourceAction = (action: string, source: NoteSource) => {
    switch (action) {
      case 'analyze':
        setInputMessage(`Can you analyze the source "${source.title}" and explain its key points?`);
        break;
      case 'summarize':
        setInputMessage(`Please provide a summary of the source "${source.title}"`);
        break;
      case 'compare':
        setInputMessage(`How does the source "${source.title}" relate to the main note content?`);
        break;
      case 'extract':
        setInputMessage(`What are the main insights or takeaways from "${source.title}"?`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Chat about this note</h2>
            <p className="text-sm text-muted-foreground">
              Ask questions about your note and its {note.noteSources?.length || 0} sources
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadChatMessages}
              disabled={isLoadingMessages}
              className="px-3 py-1 text-sm bg-muted rounded-lg hover:bg-muted/80 disabled:opacity-50"
            >
              {isLoadingMessages ? '🔄' : '🔄'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading conversation...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
            <p className="text-muted-foreground max-w-md">
              Ask questions about your note content, sources, or request analysis and insights.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatMessageTime(message.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Source Tools Section */}
      {note.noteSources && note.noteSources.length > 0 && (
        <div className="border-t border-border p-4">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Source Tools</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {note.noteSources.map((source, index) => (
              <div key={index} className="border border-border rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm">
                    {source.type === 'text' && '📄'}
                    {source.type === 'link' && '🔗'}
                    {source.type === 'youtube' && '📺'}
                    {source.type === 'google_drive' && '☁️'}
                    {source.type === 'file' && '📁'}
                    {source.type === 'website' && '🌐'}
                  </span>
                  <span className="text-xs font-medium truncate">{source.title}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => handleSourceAction('analyze', source)}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    title="Analyze this source"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => handleSourceAction('summarize', source)}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    title="Summarize this source"
                  >
                    📝
                  </button>
                  <button
                    onClick={() => handleSourceAction('compare', source)}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    title="Compare with note"
                  >
                    ⚖️
                  </button>
                  <button
                    onClick={() => handleSourceAction('extract', source)}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    title="Extract insights"
                  >
                    💡
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your note, sources, or request analysis..."
              className="w-full p-3 border border-border rounded-lg bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              rows={3}
              disabled={isLoading || !userConnected}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !userConnected}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Send</span>
                </>
              )}
            </button>
            {!userConnected && (
              <div className="text-xs text-muted-foreground text-center">
                Login to chat
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </div>
          <div className="text-xs text-muted-foreground">
            {inputMessage.length}/2000
          </div>
        </div>
      </div>
    </div>
  );
} 