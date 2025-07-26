'use client';

import { useState, useEffect } from 'react';
import { Note } from '../../../types';

interface NotesListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onCreateNote: () => void;
  isLoading?: boolean;
}

export default function NotesList({ 
  notes, 
  onNoteClick, 
  onEditNote, 
  onDeleteNote, 
  onCreateNote, 
  isLoading = false 
}: NotesListProps) {
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'ai'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'difficulty' | 'type'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    console.log('notes list', notes);
  useEffect(() => {
    let filtered = notes;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(note => note.type === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.text?.toLowerCase().includes(term) ||
        note.description?.toLowerCase().includes(term) ||
        note.summary?.toLowerCase().includes(term) ||
        note.topics?.some(topic => topic.toLowerCase().includes(term)) ||
        note.sources?.some(source => source.title?.toLowerCase().includes(term) || source.content?.toLowerCase().includes(term))
      );
    }

    // Sort notes
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt || '').getTime();
          bValue = new Date(b.updatedAt || '').getTime();
          break;
        case 'difficulty':
          aValue = a.difficulty || 0;
          bValue = b.difficulty || 0;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchTerm, typeFilter, sortBy, sortOrder]);

  const getDifficultyLabel = (difficulty?: number) => {
    switch (difficulty) {
      case 1: return { label: 'Beginner', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
      case 2: return { label: 'Intermediate', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      case 3: return { label: 'Advanced', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
      case 4: return { label: 'Expert', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      case 5: return { label: 'Master', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text?: string, maxLength: number = 150) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notes</h1>
        <button
          onClick={onCreateNote}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Create Note
        </button>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg shadow p-2 space-y-4">
        <div className="grid grid-cols- md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Type Filter */}
          {/* <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'user' | 'ai')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="user">User Notes</option>
              <option value="ai">AI Generated</option>
            </select>
          </div> */}

          {/* Sort */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="difficulty-asc">Difficulty (Low to High)</option>
              <option value="difficulty-desc">Difficulty (High to Low)</option>
              <option value="type-asc">Type A-Z</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredNotes.length} of {notes.length} notes
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg">
            {searchTerm || typeFilter !== 'all' ? 'No notes match your filters.' : 'No notes yet.'}
          </div>
          {!searchTerm && typeFilter === 'all' && (
            <button
              onClick={onCreateNote}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create your first note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer"
              onClick={() => onNoteClick(note)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  {/* <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      note.type === 'ai' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {note.type === 'ai' ? 'AI' : 'User'}
                    </span>
                    {note.difficulty && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyLabel(note.difficulty).color}`}>
                        {getDifficultyLabel(note.difficulty).label}
                      </span>
                    )}
                  </div> */}
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNote(note);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (note.id) onDeleteNote(note.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold line-clamp-2">
                      {note.text ? truncateText(note.text, 100) : 'Untitled Note'}
                    </h3>
                    {note.isNotebook && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        📓 Notebook
                      </span>
                    )}
                  </div>
                  
                  {note.description && (
                    <p className="text-sm line-clamp-3">
                      {note.description}
                    </p>
                  )}

                  {note.summary && (
                    <div className="dark:bg-gray-700 p-3 rounded-md">
                      <p className="text-sm line-clamp-2">
                        <strong>Summary:</strong> {note.summary}
                      </p>
                    </div>
                  )}

                  {/* Topics */}
                  {note.topics && note.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.topics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-blue-500 text-blue-500"
                        >
                          {topic}
                        </span>
                      ))}
                      {note.topics.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-gray-500 text-gray-500">
                          +{note.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sources count */}
                  {note.sources && note.sources.length > 0 && (
                    <div className="text-xs">
                      📚 {note.sources.length} source{note.sources.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-xs">
                    {formatDate(note.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}