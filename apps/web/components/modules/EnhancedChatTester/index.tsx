'use client';

import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import { useApi } from '../../../hooks/useApi';
import { useAuthStore } from '../../../store/auth';
import { useMentorsStore } from '../../../store/mentors';
import { enhancedMarkdownRenderer, tryMarkdownToHtml } from '../../../lib/helpers';
import styles from './EnhancedChatTester.module.scss';

interface EnhancedChatResponse {
  text: string;
  metadata: {
    model: string;
    useCase: string;
    vectorSearchUsed: boolean;
    contextSize: number;
    responseTime: number;
  };
  context: {
    vectorSearchUsed: boolean;
    contextSources: string[];
    vectorResultsCount: number;
    totalContextSize: number;
  };
}

interface UseCase {
  value: string;
  label: string;
  description: string;
}

const USE_CASES: UseCase[] = [
  { value: 'general_chat', label: 'General Chat', description: 'General conversation with basic context' },
  { value: 'task_planning', label: 'Task Planning', description: 'Focused on task management and planning' },
  { value: 'goal_tracking', label: 'Goal Tracking', description: 'Focused on goal progress and achievement' },
  { value: 'focus_sessions', label: 'Focus Sessions', description: 'Optimizing productivity and focus sessions' },
  { value: 'note_analysis', label: 'Note Analysis', description: 'Analyzing and working with notes' },
  { value: 'mentor_specific', label: 'Mentor Specific', description: 'Conversation with a specific mentor' },
  { value: 'quick_question', label: 'Quick Question', description: 'Quick questions without extensive context' },
  { value: 'deep_analysis', label: 'Deep Analysis', description: 'Deep analysis with extensive context' },
];

const CONTEXT_SOURCES = [
  { value: 'tasks', label: 'Tasks' },
  { value: 'goals', label: 'Goals' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'notes', label: 'Notes' },
  { value: 'badges', label: 'Badges' },
  { value: 'quests', label: 'Quests' },
  { value: 'profile', label: 'Profile' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'settings', label: 'Settings' },
];

export default function EnhancedChatTester() {
  const { showToast } = useUIStore();
  const { userConnected } = useAuthStore();
  const { mentors = [], selectedMentor, setSelectedMentor } = useMentorsStore();
  const apiService = useApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState('general_chat');
  const [selectedContextSources, setSelectedContextSources] = useState<string[]>(['tasks', 'goals', 'sessions']);
  const [enableVectorSearch, setEnableVectorSearch] = useState(true);
  const [maxVectorResults, setMaxVectorResults] = useState(5);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<Array<{
    id: string;
    prompt: string;
    response: EnhancedChatResponse;
    timestamp: Date;
  }>>([]);

  // Auto-scroll to bottom when responses change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const handleSendMessage = async () => {
    if (!prompt.trim() || isLoading || !userConnected) {
      if (!userConnected) {
        showToast({
          message: 'Please connect your wallet first',
          type: 'error',
        });
      }
      return;
    }

    setIsLoading(true);
    const userPrompt = prompt;
    setPrompt('');

    try {
      // Call the enhanced chat endpoint using API service
      const response = await apiService.enhancedChatUseCase({
        prompt: userPrompt,
        useCase: selectedUseCase,
        mentorId: selectedMentor?.id,
        enableVectorSearch,
        contextSources: selectedContextSources,
        maxVectorResults,
        customSystemPrompt: customSystemPrompt || undefined,
        saveToChat: true,
      });
      
      if (response.success && response.data) {
        const newResponse = {
          id: Date.now().toString(),
          prompt: userPrompt,
          response: response.data,
          timestamp: new Date(),
        };
        
        setResponses(prev => [...prev, newResponse]);
        
        showToast({
          message: 'Response received successfully!',
          type: 'success',
        });
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast({
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextSourceToggle = (source: string) => {
    setSelectedContextSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const clearResponses = () => {
    setResponses([]);
  };

  const renderMarkdown = (content: string) => {
    return tryMarkdownToHtml(content);
  };

  return (
    <div className={styles.enhancedChatTester}>
      <div className={styles.header}>
        <h2>Enhanced Chat Tester</h2>
        <p>Test the enhanced chat endpoints with different use cases and configurations</p>
      </div>

      <div className={styles.configuration}>
        <div className={styles.configSection}>
          <h3>Use Case</h3>
          <select 
            value={selectedUseCase} 
            onChange={(e) => setSelectedUseCase(e.target.value)}
            className={styles.select}
          >
            {USE_CASES.map(useCase => (
              <option key={useCase.value} value={useCase.value}>
                {useCase.label} - {useCase.description}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.configSection}>
          <h3>Context Sources</h3>
          <div className={styles.checkboxGrid}>
            {CONTEXT_SOURCES.map(source => (
              <label key={source.value} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={selectedContextSources.includes(source.value)}
                  onChange={() => handleContextSourceToggle(source.value)}
                />
                {source.label}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.configSection}>
          <h3>Vector Search Settings</h3>
          <div className={styles.vectorSettings}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={enableVectorSearch}
                onChange={(e) => setEnableVectorSearch(e.target.checked)}
              />
              Enable Vector Search
            </label>
            <div className={styles.inputGroup}>
              <label>Max Vector Results:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxVectorResults}
                onChange={(e) => setMaxVectorResults(parseInt(e.target.value))}
                className={styles.numberInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.configSection}>
          <h3>Custom System Prompt (Optional)</h3>
          <textarea
            value={customSystemPrompt}
            onChange={(e) => setCustomSystemPrompt(e.target.value)}
            placeholder="Enter a custom system prompt to override the default..."
            className={styles.textarea}
            rows={3}
          />
        </div>

        <div className={styles.configSection}>
          <h3>Mentor Selection</h3>
          <select 
            value={selectedMentor?.id || ''} 
            onChange={(e) => {
              const mentor = mentors.find(m => m.id === e.target.value);
              setSelectedMentor(mentor || undefined);
            }}
            className={styles.select}
          >
            <option value="">No mentor selected</option>
            {mentors.map(mentor => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.name} - {mentor.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.chatSection}>
        <div className={styles.inputArea}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className={styles.promptInput}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendMessage();
              }
            }}
          />
          <div className={styles.inputActions}>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !prompt.trim() || !userConnected}
              className={styles.sendButton}
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </button>
            <button
              onClick={clearResponses}
              className={styles.clearButton}
            >
              Clear Responses
            </button>
          </div>
        </div>

        <div className={styles.responses}>
          {responses.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No responses yet. Send a message to see the enhanced chat in action!</p>
            </div>
          ) : (
            responses.map((item) => (
              <div key={item.id} className={styles.responseItem}>
                <div className={styles.userPrompt}>
                  <strong>You:</strong>
                  <div className={styles.promptText}>{item.prompt}</div>
                  <small>{item.timestamp.toLocaleTimeString()}</small>
                </div>
                
                <div className={styles.aiResponse}>
                  <strong>AI Response:</strong>
                  <div 
                    className={styles.responseText}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(item.response.text) || '' }}
                  />
                  
                  <div className={styles.responseMetadata}>
                    <div className={styles.metadataGrid}>
                      <div className={styles.metadataItem}>
                        <strong>Model:</strong> {item.response.metadata.model}
                      </div>
                      <div className={styles.metadataItem}>
                        <strong>Use Case:</strong> {item.response.metadata.useCase}
                      </div>
                      <div className={styles.metadataItem}>
                        <strong>Response Time:</strong> {item.response.metadata.responseTime}ms
                      </div>
                      <div className={styles.metadataItem}>
                        <strong>Vector Search:</strong> {item.response.context.vectorSearchUsed ? 'Yes' : 'No'}
                      </div>
                      <div className={styles.metadataItem}>
                        <strong>Vector Results:</strong> {item.response.context.vectorResultsCount}
                      </div>
                      <div className={styles.metadataItem}>
                        <strong>Context Size:</strong> {item.response.context.totalContextSize} chars
                      </div>
                    </div>
                    
                    <div className={styles.contextSources}>
                      <strong>Context Sources:</strong>
                      <div className={styles.sourceTags}>
                        {item.response.context.contextSources.map((source, index) => (
                          <span key={index} className={styles.sourceTag}>
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
} 