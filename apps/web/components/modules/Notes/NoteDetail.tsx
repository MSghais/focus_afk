'use client';

import { useState } from 'react';
import { Note } from '../../../types';
import SourceAgent from './SourceAgent';

interface NoteDetailProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onBack: () => void;
  onShare?: (note: Note) => void;
  onOpenNotebook?: (note: Note) => void;
}

export default function NoteDetail({ note, onEdit, onDelete, onBack, onShare, onOpenNotebook }: NoteDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const getDifficultyLabel = (difficulty?: number) => {
    switch (difficulty) {
      case 1: return { label: 'Beginner', color: 'bg-green-100 dark:bg-green-900 dark:text-green-200' };
      case 2: return { label: 'Intermediate', color: 'bg-blue-100 dark:bg-blue-900 dark:text-blue-200' };
      case 3: return { label: 'Advanced', color: 'bg-yellow-100  dark:bg-yellow-900 dark:text-yellow-200' };
      case 4: return { label: 'Expert', color: 'bg-orange-100 dark:bg-orange-900 dark:text-orange-200' };
      case 5: return { label: 'Master', color: 'bg-red-100  dark:bg-red-900 dark:text-red-200' };
      default: return { label: 'Unknown', color: 'bg-muted text-muted-foreground' };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!note.id) return;

    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        onDelete(note.id);
      } catch (error) {
        console.error('Error deleting note:', error);
        setIsDeleting(false);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getContentPreview = (text: string) => {
    if (!text) return 'No content available';
    const maxLength = 300;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header with Navigation */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={onBack}
              className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              {/* <h1 className="text-2xl font-bold mb-1">Note Details</h1> */}
              <p className="text-sm text-muted-foreground">
                Created {formatDate(note.createdAt)}
                {note.updatedAt && note.updatedAt !== note.createdAt && (
                  <span> • Updated {formatDate(note.updatedAt)}</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {onOpenNotebook && (
              <button
                onClick={() => onOpenNotebook(note)}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Open</span>
              </button>
            )}

            <button
              onClick={() => onEdit(note)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>

            <button
              onClick={() => copyToClipboard(note.text || '')}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>


        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Content Preview
          </h2>
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-sm text-primary hover:underline font-medium"
          >
            {showFullContent ? 'Show Less' : 'Show More'}
          </button>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className={`whitespace-pre-wrap leading-relaxed text-base ${!showFullContent ? 'line-clamp-4' : ''}`}>
            {showFullContent ? (note.text || 'No content available') : getContentPreview(note.text || '')}
          </div>
        </div>
        {/* Note Metadata Badges */}

        <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-border/50">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${note.type === 'ai'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              : 'bg-primary/10 text-primary'
            }`}>
            {note.type === 'ai' ? '🤖 AI Generated' : '👤 User Note'}
          </span>
          {note.difficulty && (
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getDifficultyLabel(note.difficulty).color}`}>
              🎯 {getDifficultyLabel(note.difficulty).label}
            </span>
          )}
        </div>

      </div>

      {/* Content Preview Section */}
      {/* <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Content Preview
          </h2>
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-sm text-primary hover:underline font-medium"
          >
            {showFullContent ? 'Show Less' : 'Show More'}
          </button>
        </div>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className={`whitespace-pre-wrap leading-relaxed text-base ${!showFullContent ? 'line-clamp-4' : ''}`}>
            {showFullContent ? (note.text || 'No content available') : getContentPreview(note.text || '')}
          </div>
        </div>
      </div> */}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column - Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Description */}
          {note.description && (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Description
              </h3>
              <p className="leading-relaxed text-muted-foreground text-base">
                {note.description}
              </p>
            </div>
          )}

          {/* AI Summary */}
          {note.aiSummary && (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Summary
              </h3>
              <div className="p-6 rounded-xl border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/10">
                <p className="leading-relaxed text-base">
                  {note.aiSummary}
                </p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {note.requirements && note.requirements.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Requirements
              </h3>
              <div className="space-y-3">
                {note.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border border-yellow-200 dark:border-yellow-800 rounded-xl bg-yellow-50 dark:bg-yellow-900/10">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1 text-lg">•</span>
                    <span className="text-base">
                      {requirement}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {((note.sources && note.sources.length > 0) || (note.noteSources && note.noteSources.length > 0)) && (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Sources
              </h3>
              <div className="space-y-4">
                {/* Display new structured sources */}
                {note.noteSources?.map((source, index) => (
                  <div key={`new-${index}`}>
                    {source.type === 'website' ? (
                      <SourceAgent
                        source={source}
                        noteId={note.id}
                        onSourceUpdated={(updatedSource) => {
                          console.log('Source updated:', updatedSource);
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">
                            {source.type === 'text' && '📄'}
                            {source.type === 'link' && '🔗'}
                            {source.type === 'youtube' && '📺'}
                            {source.type === 'google_drive' && '☁️'}
                            {source.type === 'file' && '📁'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-medium truncate">
                              {source.title}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {source.type} • {source.url || source.content?.substring(0, 50) || 'No content'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(source.url || source.content || source.title)}
                          className="ml-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-background transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Display legacy sources */}
                {note.sources?.map((source: any, index) => (
                  <div key={`legacy-${index}`} className="flex items-center justify-between p-4 bg-muted rounded-xl border-l-4 border-yellow-400">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">📄</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-medium truncate">
                          Legacy Source {index + 1}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          text • {typeof source === 'string' ? source.substring(0, 50) : (source as any)?.title || 'Legacy source'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(typeof source === 'string' ? source : source.url || source.content || source.title)}
                      className="ml-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-background transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Metadata & Sources */}
        <div className="space-y-8">
          {/* Topics */}
          {(note.topics && note.topics.length > 0) && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {note.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm border border-primary/20 text-primary bg-primary/5"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Topics */}
          {note.aiTopics && note.aiTopics.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {note.aiTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    🤖 {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Sources */}
          {note.aiSources && note.aiSources.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Sources
              </h3>
              <div className="space-y-3">
                {note.aiSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm break-all">
                      🤖 {source}
                    </span>
                    <button
                      onClick={() => copyToClipboard(source)}
                      className="ml-2 p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {note.metadata && Object.keys(note.metadata).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Metadata
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(note.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}