'use client';

import { useState } from 'react';
import { NoteSource } from '../../../types';
import SourceSuggestions from './SourceSuggestions';
import SearchTypeSelector from './SearchTypeSelector';

// Example component showing different ways to use SourceSuggestions
export default function SourceSuggestionsExample() {
  const [text, setText] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'articles' | 'research' | 'tutorials' | 'documentation'>('all');
  const [addedSources, setAddedSources] = useState<NoteSource[]>([]);

  const handleSourcesAdded = (sources: NoteSource[]) => {
    setAddedSources(prev => [...prev, ...sources]);
  };

  const handleSourceSelected = (source: NoteSource) => {
    console.log('Selected source:', source);
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Source Suggestions Examples</h2>

      {/* Example 1: Auto-suggestions with text input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Example 1: Auto-suggestions</h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Type your note content (auto-suggestions will appear):
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border border-border rounded-lg h-32"
            placeholder="Start typing your note content here... The AI will suggest relevant sources as you type."
          />
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Search Type</h4>
          <SearchTypeSelector
            value={searchType}
            onChange={setSearchType}
          />
        </div>

        <SourceSuggestions
          text={text}
          onSourceSelected={handleSourceSelected}
          onSourcesAdded={handleSourcesAdded}
          maxResults={5}
          includeContent={false}
          searchType="tutorials"
          minTextLength={20}
        />
      </div>

      {/* Example 2: Manual search */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Example 2: Manual search</h3>
        <SourceSuggestions
          text="React hooks tutorial advanced patterns"
          onSourcesAdded={handleSourcesAdded}
          maxResults={3}
          includeContent={false}
          searchType="tutorials"
          minTextLength={10}
        />
      </div>

      {/* Example 3: Research-focused */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Example 3: Research papers</h3>
        <SourceSuggestions
          text="machine learning neural networks deep learning"
          onSourcesAdded={handleSourcesAdded}
          maxResults={4}
          includeContent={true}
          searchType="research"
          minTextLength={10}
        />
      </div>

      {/* Display added sources */}
      {addedSources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Added Sources ({addedSources.length})</h3>
          <div className="space-y-2">
            {addedSources.map((source, index) => (
              <div key={index} className="p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌐</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{source.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {source.url}
                    </p>
                    {source.metadata?.relevanceScore && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                        {Math.round(source.metadata.relevanceScore * 100)}% match
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 