'use client';

import { useState } from 'react';
import { NoteSource } from '../../../types';
import api from '../../../lib/api';

      interface SourceToolsRecommendationProps {
  source: NoteSource;
  noteId?: string;
  onSourceUpdated?: (updatedSource: NoteSource) => void;
}

interface AnalysisResult {
  type: string;
  content: string;
  isLoading: boolean;
}

export default function SourceToolsRecommendation({ source, noteId, onSourceUpdated }: SourceToolsRecommendationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isShowPreview, setIsShowPreview] = useState(false);

  const handleAnalyzeSource = async (analysisType: 'summary' | 'key_points' | 'questions' | 'insights') => {
    if (!source.id) return;

    setIsLoading(true);
    setError(null);

    // Initialize analysis result
    setAnalysisResults(prev => ({
      ...prev,
      [analysisType]: { type: analysisType, content: '', isLoading: true }
    }));

    try {
      const response = await api.analyzeSource({
        sourceId: source.id,
        analysisType
      });

      if (response.success && response.data?.analysis) {
        setAnalysisResults(prev => ({
          ...prev,
          [analysisType]: { 
            type: analysisType, 
            content: response.data!.analysis, 
            isLoading: false 
          }
        }));
      } else {
        throw new Error('Failed to analyze source');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze source');
      setAnalysisResults(prev => ({
        ...prev,
        [analysisType]: { type: analysisType, content: 'Analysis failed', isLoading: false }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetInsights = async () => {
    if (!source.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getSourceInsights(source.id);

      if (response.success && response.data?.insights) {
        setAnalysisResults(prev => ({
          ...prev,
          insights: { 
            type: 'insights', 
            content: response.data!.insights, 
            isLoading: false 
          }
        }));
        setShowAnalysis(true);
      } else {
        throw new Error('Failed to get insights');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindSimilar = async () => {
    if (!source.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getSimilarSources(source.id);

      if (response.success && response.data) {
        const similarContent = response.data.similarSources
          .map((s: any, index: number) => `${index + 1}. ${s.title} - ${s.url}`)
          .join('\n');

        setAnalysisResults(prev => ({
          ...prev,
          similar: { 
            type: 'similar_sources', 
            content: `Similar sources found:\n\n${similarContent}`, 
            isLoading: false 
          }
        }));
        setShowAnalysis(true);
      } else {
        throw new Error('Failed to find similar sources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find similar sources');
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'website': return '🌐';
      case 'link': return '🔗';
      case 'text': return '📄';
      case 'youtube': return '📺';
      case 'google_drive': return '☁️';
      case 'file': return '📁';
      default: return '📄';
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'summary': return '📝';
      case 'key_points': return '🎯';
      case 'questions': return '❓';
      case 'insights': return '💡';
      case 'similar_sources': return '🔍';
      default: return '🤖';
    }
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4">

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* AI Tools Panel */}
      {showAnalysis && (
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => handleAnalyzeSource('summary')}
              disabled={isLoading}
              className="flex flex-col items-center p-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="text-lg mb-1">📝</span>
              <span className="text-xs">Summary</span>
            </button>

            <button
              onClick={() => handleAnalyzeSource('key_points')}
              disabled={isLoading}
              className="flex flex-col items-center p-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="text-lg mb-1">🎯</span>
              <span className="text-xs">Key Points</span>
            </button>

            <button
              onClick={() => handleAnalyzeSource('questions')}
              disabled={isLoading}
              className="flex flex-col items-center p-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="text-lg mb-1">❓</span>
              <span className="text-xs">Questions</span>
            </button>

            <button
              onClick={handleGetInsights}
              disabled={isLoading}
              className="flex flex-col items-center p-3 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              <span className="text-lg mb-1">💡</span>
              <span className="text-xs text-primary">Insights</span>
            </button>
          </div>

          {/* Advanced Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handleFindSimilar}
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              🔍 Find Similar Sources
            </button>
          </div>

          {/* Analysis Results */}
          {Object.keys(analysisResults).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Analysis Results</h4>
              {Object.entries(analysisResults).map(([key, result]) => (
                <div key={key} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getAnalysisIcon(result.type)}</span>
                    <h5 className="font-medium capitalize">
                      {result.type.replace('_', ' ')}
                    </h5>
                    {result.isLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                  {result.content && (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">
                        {result.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
} 