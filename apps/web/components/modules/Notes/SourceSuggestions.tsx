'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoteSource } from '../../../types';
import api from '../../../lib/api';
import { logClickedEvent } from '../../../lib/analytics';

interface SourceSuggestionsProps {
  text: string;
  onSourceSelected?: (source: NoteSource) => void;
  onSourcesAdded?: (sources: NoteSource[]) => void;
  maxResults?: number;
  includeContent?: boolean;
  searchType?: 'all' | 'articles' | 'research' | 'tutorials' | 'documentation';
  className?: string;
  minTextLength?: number;
  autoSuggest?: boolean;
}

interface SuggestionState {
  suggestions: NoteSource[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export default function SourceSuggestions({
  text,
  onSourceSelected,
  onSourcesAdded,
  maxResults = 5,
  includeContent = false,
  searchType = 'all',
  className = '',
  minTextLength = 10,
  autoSuggest = false,
}: SourceSuggestionsProps) {
  const [state, setState] = useState<SuggestionState>({
    suggestions: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    if (text.length < minTextLength) {
      setState(prev => ({ ...prev, error: `Please enter at least ${minTextLength} characters to search` }));
      return;
    }

    logClickedEvent("suggestions_search_sources_note_create_form")

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.suggestSources({
        text,
        maxResults,
        includeContent,
        searchType,
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
  }, [text, maxResults, includeContent, searchType, minTextLength]);

  const handleManualSearch = () => {
    fetchSuggestions();
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

  const handleAddSelected = () => {
    const selectedSourcesList = state.suggestions.filter(source => {
      if (!source.url) return false;
      // Normalize URL to ensure consistency
      const normalizedUrl = source.url.startsWith('http') ? source.url : `https://${source.url}`;
      return selectedSources.has(source.url) || selectedSources.has(normalizedUrl);
    });
    if (selectedSourcesList.length > 0 && onSourcesAdded) {
      onSourcesAdded(selectedSourcesList);
      setSelectedSources(new Set());
      setState(prev => ({ ...prev, suggestions: [], hasSearched: false }));
    }
  };

  const handleAddAll = () => {
    if (state.suggestions.length > 0 && onSourcesAdded) {
      onSourcesAdded(state.suggestions);
      setSelectedSources(new Set());
      setState(prev => ({ ...prev, suggestions: [], hasSearched: false }));
    }
  };

  const showSuggestions = state.hasSearched && state.suggestions.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleManualSearch}
          disabled={text.length < minTextLength || state.isLoading}
          className="px-3 py-1 text-xs bg-[var(--background)] text-white rounded-md hover:bg-[var(--background)]/90 disabled:opacity-50"
        >
          🔍 Search
        </button>
        {state.isLoading && (
          <span className="text-xs text-muted-foreground">Searching...</span>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
          {state.error}
        </div>
      )}

      {/* Suggestions List */}
      {showSuggestions && (
        <div className="space-y-3">
          {/* Header with Add All/Add Selected buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Found {state.suggestions.length} suggestions
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleAddSelected}
                disabled={selectedSources.size === 0}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Add Selected ({selectedSources.size})
              </button>
              <button
                onClick={handleAddAll}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add All
              </button>
            </div>
          </div>

          {/* List of suggestions with checkboxes */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.suggestions.map((source, index) => {
              const sourceUrl = source.url || '';
              const isSelected = selectedSources.has(sourceUrl);
              
              return (
                <div
                  key={sourceUrl || `source-${index}`}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-border hover:border-blue-300'
                  }`}
                  onClick={() => sourceUrl && handleSourceToggle(sourceUrl)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => sourceUrl && handleSourceToggle(sourceUrl)}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">
                          {source.type === 'website' && '🌐'}
                          {source.type === 'text' && '📄'}
                          {source.type === 'link' && '🔗'}
                          {source.type === 'youtube' && '📺'}
                          {source.type === 'google_drive' && '☁️'}
                          {source.type === 'file' && '📁'}
                        </span>
                        <h4 className="font-medium text-sm truncate">{source.title}</h4>
                      </div>
                      {source.url && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {source.url}
                        </p>
                      )}
                      {source.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {source.content}
                        </p>
                      )}
                      {/* Show relevance score if available */}
                      {(source as any).relevanceScore && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">Relevance:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xs ${
                                  star <= (source as any).relevanceScore
                                    ? 'text-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results / Text Length Warning */}
      {state.hasSearched && state.suggestions.length === 0 && !state.isLoading && !state.error && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            No relevant sources found. Try adjusting your search terms or search type.
          </p>
        </div>
      )}

      {!state.hasSearched && text.length < minTextLength && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Enter at least {minTextLength} characters to search for sources.
          </p>
        </div>
      )}
    </div>
  );
} 