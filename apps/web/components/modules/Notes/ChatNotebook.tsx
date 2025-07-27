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
import StudioNotebook from './StudioNotebook';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatNotebookProps {
  note: Note;
  notesSources?: NoteSource[];
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
  const [activeTab, setActiveTab] = useState<'chat' | 'sources' | 'studio'  >('chat');
  const [showSourcesTools, setShowSourcesTools] = useState(true);
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

      console.log('response chat about note', response);

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

  const [sourceAnalysis, setSourceAnalysis] = useState<Record<string, any>>({});
  const [analyzingSource, setAnalyzingSource] = useState<string | null>(null);

  const handleSourceAction = async (action: string, source: NoteSource) => {
    // Switch to chat tab when using source actions
    setActiveTab('chat');

    switch (action) {
      case 'analyze':
        await performSourceAnalysis(source, 'key_points');
        break;
      case 'summarize':
        await performSourceAnalysis(source, 'summary');
        break;
      case 'compare':
        setInputMessage(`How does the source "${source.title}" relate to the main note content?`);
        break;
      case 'extract':
        await performSourceAnalysis(source, 'insights');
        break;
      default:
        break;
    }
  };

  const performSourceAnalysis = async (source: NoteSource, analysisType: 'summary' | 'key_points' | 'insights') => {
    if (!source.id) {
      // Fallback to chat if no source ID
      setInputMessage(`Can you ${analysisType === 'summary' ? 'summarize' : analysisType === 'key_points' ? 'analyze the key points of' : 'extract insights from'} the source "${source.title}"?`);
      return;
    }

    setAnalyzingSource(source.id);

    try {
      let response;
      if (analysisType === 'insights') {
        response = await api.getSourceInsights(source.id);
      } else {
        response = await api.analyzeSource({
          sourceId: source.id,
          analysisType
        });
      }

      if (response.success && response.data) {
        let analysisContent = '';

        if (analysisType === 'insights') {
          analysisContent = (response.data as any).insights || '';
        } else {
          analysisContent = (response.data as any).analysis || '';
        }

        if (analysisContent) {
          // Store the analysis result
          setSourceAnalysis(prev => ({
            ...prev,
            [source.id!]: {
              ...prev[source.id!],
              [analysisType]: analysisContent
            }
          }));

          // Pre-fill the chat with the analysis result
          const analysisText = `Analysis of "${source.title}" (${analysisType}):\n\n${analysisContent}`;
          setInputMessage(analysisText);

          showToast({
            message: `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} generated successfully!`,
            type: 'success',
          });
        } else {
          throw new Error('No analysis content received');
        }
      } else {
        throw new Error('Failed to analyze source');
      }
    } catch (error) {
      console.error('Error analyzing source:', error);
      showToast({
        message: 'Failed to analyze source. Using chat instead.',
        type: 'error',
      });
      // Fallback to chat
      setInputMessage(`Can you ${analysisType === 'summary' ? 'summarize' : analysisType === 'key_points' ? 'analyze the key points of' : 'extract insights from'} the source "${source.title}"?`);
    } finally {
      setAnalyzingSource(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full max-h-[calc(100vh-100px)]">
      {/* Header with Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div>
            {/* <h2 className="text-lg font-semibold">Note Assistant</h2> */}
            <p className="text-sm text-muted-foreground">
              Chat and analyze your note with {note.noteSources?.length || 0} sources
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* <button
              onClick={() => setShowSourcesTools(!showSourcesTools)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                showSourcesTools 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              🛠️ Tools
            </button> */}
            <button
              onClick={loadChatMessages}
              disabled={isLoadingMessages}
              className="px-3 py-1 text-sm bg-muted rounded-lg hover:bg-muted/80 disabled:opacity-50"
            >
              {isLoadingMessages ? '🔄' : '🔄'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'sources'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            📚 Sources ({note.noteSources?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'chat'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            💬 Chat
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'studio'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Studio
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[350px] sm:max-h-[450px] overflow-y-auto scrollbar-hide">
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
                    className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' 
                          ? 'bg-primary text-primary-foreground text-left'
                          : 'bg-muted border border-border text-right'
                        }`}
                    >
                      {message.role === 'assistant' ? (
                        <div
                          className="prose prose-sm max-w-none text-right"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
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
        )}

        {activeTab === 'sources' && (
          <div className="flex flex-col h-full">
            {/* Sources List */}
            <div className="flex-1 overflow-y-auto p-4">
              {note.noteSources && note.noteSources.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sources ({note.noteSources.length})</h3>
                    {showSourcesTools && (
                      <span className="text-sm text-muted-foreground">🛠️ Tools enabled</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {note.noteSources.map((source, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 hover:border-border/80 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {source.type === 'text' && '📄'}
                              {source.type === 'link' && '🔗'}
                              {source.type === 'youtube' && '📺'}
                              {source.type === 'google_drive' && '☁️'}
                              {source.type === 'file' && '📁'}
                              {source.type === 'website' && '🌐'}
                            </span>
                            <div>
                              <h4 className="font-medium text-sm">{source.title}</h4>
                              <p className="text-xs text-muted-foreground capitalize">{source.type}</p>
                            </div>
                          </div>
                        </div>

                        {source.content && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {source.content.substring(0, 150)}...
                          </p>
                        )}

                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline block mb-3 truncate"
                          >
                            {source.url}
                          </a>
                        )}

                        {showSourcesTools && (
                          <div className="border-t border-border pt-3">
                            <h5 className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</h5>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleSourceAction('analyze', source)}
                                disabled={analyzingSource === source.id}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Analyze this source"
                              >
                                {analyzingSource === source.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                ) : (
                                  '🔍 Analyze'
                                )}
                              </button>
                              <button
                                onClick={() => handleSourceAction('summarize', source)}
                                disabled={analyzingSource === source.id}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Summarize this source"
                              >
                                {analyzingSource === source.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                ) : (
                                  '📝 Summarize'
                                )}
                              </button>
                              <button
                                onClick={() => handleSourceAction('compare', source)}
                                disabled={analyzingSource === source.id}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Compare with note"
                              >
                                ⚖️ Compare
                              </button>
                              <button
                                onClick={() => handleSourceAction('extract', source)}
                                disabled={analyzingSource === source.id}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Extract insights"
                              >
                                {analyzingSource === source.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                ) : (
                                  '💡 Extract'
                                )}
                              </button>
                            </div>

                            {/* Show existing analysis results */}
                            {source.id && sourceAnalysis[source.id] && (
                              <div className="mt-3 space-y-2">
                                <h6 className="text-xs font-medium text-muted-foreground">Previous Analysis</h6>
                                {Object.entries(sourceAnalysis[source.id]).map(([type, content]) => (
                                  <div key={type} className="p-2 bg-muted/30 rounded text-xs">
                                    <div className="font-medium capitalize mb-1">
                                      {type === 'key_points' ? 'Key Points' : type === 'summary' ? 'Summary' : 'Insights'}:
                                    </div>
                                    <div className="text-muted-foreground line-clamp-2">
                                      {content as string}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold mb-2">No Sources Yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    Add sources to your note to enable AI-powered analysis and insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'studio' && (
          <StudioNotebook
            note={note}
            notesSources={note.noteSources || []}
          />
        )}
      </div>
    </div>
  );
} 