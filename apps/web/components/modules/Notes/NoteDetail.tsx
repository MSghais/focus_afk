'use client';

import { useState } from 'react';
import { Note } from '../../../types';

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

  const getDifficultyLabel = (difficulty?: number) => {
    switch (difficulty) {
      case 1: return { label: 'Beginner', color: 'bg-green-100 dark:bg-green-900 dark:text-green-200' };
      case 2: return { label: 'Intermediate', color: 'bg-blue-100 dark:bg-blue-900 dark:text-blue-200' };
      case 3: return { label: 'Advanced', color: 'bg-yellow-100  dark:bg-yellow-900 dark:text-yellow-200' };
      case 4: return { label: 'Expert', color: 'bg-orange-100 dark:bg-orange-900 dark:text-orange-200' };
      case 5: return { label: 'Master', color: 'bg-red-100  dark:bg-red-900 dark:text-red-200' };
      default: return { label: 'Unknown', color: 'bg-gray-100  dark:bg-gray-900 dark:text-gray-200' };
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

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="block md:flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            {/* <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Note Details</h1> */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created {formatDate(note.createdAt)}
              {note.updatedAt && note.updatedAt !== note.createdAt && (
                <span> • Updated {formatDate(note.updatedAt)}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {onShare && (
            <button
              onClick={() => onShare(note)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Share
            </button>
          )}
          <button
            onClick={() => copyToClipboard(note.text || '')}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Copy
          </button>
          <button
            onClick={() => onEdit(note)}
            className="px-4 py-2 bg-blue-500  rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Note Type and Difficulty */}
      <div className="flex items-center space-x-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          note.type === 'ai' 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {note.type === 'ai' ? '🤖 AI Generated' : '👤 User Note'}
        </span>
        {note.difficulty && (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyLabel(note.difficulty).color}`}>
            🎯 {getDifficultyLabel(note.difficulty).label}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="rounded-lg shadow-lg space-y-6">
        {/* Note Text */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Content</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed">
              {note.text || 'No content available'}
            </div>
          </div>
        </div>

        {/* Description */}
        {note.description && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
            <p className="leading-relaxed">
              {note.description}
            </p>
          </div>
        )}

        {/* Summary */}
        {/* {note.summary && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
            <div className="p-4 rounded-lg border-l-4 border-blue-500">
              <p className="leading-relaxed">
                {note.summary}
              </p>
            </div>
          </div>
        )} */}

        {/* AI Summary */}
        {note.aiSummary && (
          <div>
            <h3 className="text-lg font-semibold mb-3">AI Summary</h3>
            <div className=" p-4 rounded-lg border-l-4 border-purple-500">
              <p className=" leading-relaxed">
                {note.aiSummary}
              </p>
            </div>
          </div>
        )}

        {/* Topics */}
        {note.topics && note.topics.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold  mb-3">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {note.topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm dark:text-blue-200 border border-blue-500"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Topics */}
        {note.aiTopics && note.aiTopics.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">AI Topics</h3>
            <div className="flex flex-wrap gap-2">
              {note.aiTopics.map((topic, index) => (
                <span
                  key={index}
                  className="max-w-fit inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  🤖 {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {(note.sources && note.sources.length > 0) || (note.noteSources && note.noteSources.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sources</h3>
            <div className="space-y-2">
              {/* Display new structured sources */}
              {note.noteSources?.map((source, index) => (
                <div key={`new-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {source.type === 'text' && '📄'}
                      {source.type === 'link' && '🔗'}
                      {source.type === 'youtube' && '📺'}
                      {source.type === 'google_drive' && '☁️'}
                      {source.type === 'file' && '📁'}
                      {source.type === 'website' && '🌐'}
                    </span>
                    <div>
                      <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {source.title}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        {source.type} • {source.url || source.content?.substring(0, 50) || 'No content'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(source.url || source.content || source.title)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {/* Display legacy sources for backward compatibility */}
              {note.sources?.map((source: any, index) => (
                <div key={`legacy-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        Legacy Source {index + 1}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        text • {typeof source === 'string' ? source.substring(0, 50) : (source as any)?.title || 'Legacy source'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(typeof source === 'string' ? source : source.url || source.content || source.title)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

        {/* AI Sources */}
        {note.aiSources && note.aiSources.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">AI Sources</h3>
            <div className="space-y-2">
              {note.aiSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 text-sm break-all">
                    🤖 {source}
                  </span>
                  <button
                    onClick={() => copyToClipboard(source)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

        {/* Requirements */}
        {note.requirements && note.requirements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
            <div className="space-y-2">
              {note.requirements.map((requirement, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border border-yellow-500 dark:border-yellow-500/20 rounded-lg">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                  <span className="text-sm">
                    {requirement}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {note.metadata && Object.keys(note.metadata).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Metadata</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(note.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className=" rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => copyToClipboard(note.text || '')}
            className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Copy Content</span>
          </button>
          
          <button
            onClick={() => onEdit(note)}
            className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Edit Note</span>
          </button>

          {onOpenNotebook && (
            <button
              onClick={() => onOpenNotebook(note)}
              className="flex flex-col items-center p-4 border border-blue-200 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-blue-700 dark:text-blue-300">Open Notebook</span>
            </button>
          )}

          {onShare && (
            <button
              onClick={() => onShare(note)}
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">Share</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex flex-col items-center p-4 border border-red-200 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}