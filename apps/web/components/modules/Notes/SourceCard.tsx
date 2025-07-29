'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoteSource } from '../../../types';
import api from '../../../lib/api';
import { useUIStore } from '../../../store/uiStore';
import { useAuthStore } from '../../../store/auth';
import { ButtonSecondary, ButtonSimple } from '../../small/buttons';
import { logClickedEvent } from '../../../lib/analytics';

interface SourceCardProps {
  source: NoteSource;
  className?: string;
}

interface SuggestionState {
  suggestions: NoteSource[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export default function SourceCard({
  source,
  className
}: SourceCardProps) {
  const [state, setState] = useState<SuggestionState>({
    suggestions: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });
  const { showToast } = useUIStore();
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'chat'>('chat');

  const { userConnected } = useAuthStore();
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [showSourcesTools, setShowSourcesTools] = useState(true);
  const [analyzingSource, setAnalyzingSource] = useState<string | null>(null);

  const [sourceAnalysis, setSourceAnalysis] = useState<Record<string, any>>({});

  const fetchSuggestions = useCallback(async () => {


    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await api.suggestSources({
        text: source.content || '',
        maxResults: 10,
        includeContent: true,
        searchType: 'all',
      });

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          suggestions: response.data!.suggestions,
          isLoading: false,
          hasSearched: true,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to fetch suggestions',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch suggestions',
        isLoading: false,
      }));
    }
  }, [source.content]);

  const handleManualSearch = () => {
    fetchSuggestions();
  };

  const handleRemoveSource = async (source: NoteSource) => {
    console.log("handleRemoveSource", source);
    logClickedEvent("chat_notebook_source_remove")


    // remove source from note
    // remove source from note sources
    // remove source from note sources
  }


  const handleSourceAction = async (action: string, source: NoteSource) => {
    // Switch to chat tab when using source actions
    setActiveTab('audio');

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
      // setInputMessage(`Can you ${analysisType === 'summary' ? 'summarize' : analysisType === 'key_points' ? 'analyze the key points of' : 'extract insights from'} the source "${source.title}"?`);
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
          // setInputMessage(analysisText);

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

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const showSuggestions = state.hasSearched && state.suggestions.length > 0;

  return (
    <div className={`space-y-4 `}>

      <div className={`${className} border border-border rounded-lg p-4 hover:border-border/80 transition-colors`}>
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

        <div
          className="py-2"
        >
          <ButtonSimple
            onClick={() => handleRemoveSource(source)}
            disabled={analyzingSource === source.id}
            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove
          </ButtonSimple>
        </div>

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
                    <ExpandAnalysis content={content as string} type={type} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>



    </div>
  );
}


export const ExpandAnalysis = ({ content, type }: { content: string, type: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  }

  return (
    <div>

      <div className="p-2 bg-muted/30 rounded text-xs">
        <div className="font-medium capitalize mb-1">
          {type === 'key_points' ? 'Key Points' : type === 'summary' ? 'Summary' : 'Insights'}:
        </div>
        <div

        // className="text-muted-foreground ellipsis w-full no-wrap"
        >
          <p className="text-xs ellipsis w-full whitespace-pre-wrap text-wrap">{isExpanded ? content : content.substring(0, 150)}...</p>
        </div>

      </div>

      {content?.length > 150 && (
        <button
          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={toggleExpand}>
          {isExpanded ? 'Collapse' : 'VIew more'}
        </button>
      )}


      {/* <button onClick={toggleExpand}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button> */}
    </div>
  )
}