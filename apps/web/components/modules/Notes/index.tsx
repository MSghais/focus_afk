'use client';

import { useState, useEffect } from 'react';
import { Note } from '../../../types';
import NotesList from './NotesList';
import NoteDetail from './NoteDetail';
import NoteCreateForm from './NoteCreateForm';
import NotebookView from './NotebookView';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth';

type ViewMode = 'list' | 'detail' | 'create' | 'edit' | 'notebook';

export default function NotesOverview() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userConnected, isAuthenticated } = useAuthStore();

  // Debug authentication state
  useEffect(() => {
    console.log('🔐 Auth state:', { isAuthenticated, userConnected });
  }, [isAuthenticated, userConnected]);

  // Fetch notes from API
  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getNotes();
      
      console.log('fetch notes response', response);
      if (!response) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = response?.data || [];
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create note
  const createNote = async (noteData: Partial<Note>) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔐 Creating note with auth state:', { isAuthenticated, userConnected });
      
      // Check if user is authenticated
      if (!isAuthenticated || !userConnected?.id) {
        console.error('❌ Authentication failed:', { isAuthenticated, userConnected });
        throw new Error('You must be logged in to create notes');
      }
      
      // Ensure metadata is always an object to satisfy backend validation
      const createData = {
        ...noteData,
        userId: userConnected.id, // Use the authenticated user's ID
        metadata: noteData.metadata || {}
      };
      
      console.log('📝 Creating note with data:', createData);
      
      const response = await api.createNote(createData as Note);

      if (!response.success) {
        throw new Error('Failed to create note');
      }

      const newNote = response.data;
      if (newNote) {
        setNotes(prev => [newNote, ...prev]);
      }
      setViewMode('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      console.error('Error creating note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update note
  const updateNote = async (noteData: Partial<Note>) => {
    if (!selectedNote?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // For updates, we don't need to validate userId since it should already be associated with the note
      // Only validate userId for new notes (createNote function)
      console.log('🔄 Updating note:', selectedNote.id);
      console.log('📝 Update data:', noteData);
      console.log('📋 Selected note:', selectedNote);
      
      // Ensure metadata is always an object to satisfy backend validation
      const updateData = {
        ...noteData,
        metadata: noteData.metadata || selectedNote.metadata || {}
      };
      
      const response = await api.updateNote(selectedNote.id, updateData);
      if (!response.success) {
        throw new Error('Failed to update note');
      }
      const updatedNote = response.data;
      if (updatedNote) {
        setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
        setSelectedNote(updatedNote);
      }
      setViewMode('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      console.error('Error updating note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.deleteNote(noteId);
      
      if (!response.success) {
        throw new Error('Failed to delete note');
      }
      
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setViewMode('list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      console.error('Error deleting note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    if (note.isNotebook) {
      setViewMode('notebook');
    } else {
      setViewMode('detail');
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setViewMode('edit');
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setViewMode('create');
  };

  const handleBackToList = () => {
    setSelectedNote(null);
    setViewMode('list');
  };

  const handleOpenNotebook = (note: Note) => {
    setSelectedNote(note);
    setViewMode('notebook');
  };

  const handleShareNote = (note: Note) => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Note from Focus AFK',
        text: note.text || 'Check out this note!',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(note.text || '');
      // You could add a toast notification here
    }
  };

  // Load notes on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isAuthenticated]);

  // Show authentication message if not logged in
  if (!isAuthenticated) {
    return (
      <div className="mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-4">
            You need to be logged in to view and create notes
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Please log in to access your notes and use the AI-powered source suggestions.
          </p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                Error loading notes
              </h3>
              <div className="mt-2 text-sm text-destructive/80">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchNotes}
                  className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm font-medium hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render based on view mode
  switch (viewMode) {
    case 'create':
      return (
        <div className="p-6">
          <NoteCreateForm
            onSubmit={createNote}
            onCancel={handleBackToList}
            isLoading={isLoading}
          />
        </div>
      );

    case 'edit':
      return (
        <div className="p-6">
          <NoteCreateForm
            onSubmit={updateNote}
            onCancel={() => setViewMode('detail')}
            isLoading={isLoading}
            note={selectedNote || undefined}
          />
        </div>
      );

    case 'detail':
      return selectedNote ? (
        <div className="">
          <NoteDetail
            note={selectedNote}
            onEdit={handleEditNote}
            onDelete={deleteNote}
            onBack={handleBackToList}
            onShare={handleShareNote}
            onOpenNotebook={handleOpenNotebook}
          />
        </div>
      ) : (
        <div className=" mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              Note not found
            </div>
            <button
              onClick={handleBackToList}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Back to Notes
            </button>
          </div>
        </div>
      );

    case 'notebook':
      return selectedNote ? (
        <div className="h-full">
          <NotebookView
            note={selectedNote}
            onUpdate={updateNote}
            onBack={handleBackToList}
          />
        </div>
      ) : (
        <div className="mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              Notebook not found
            </div>
            <button
              onClick={handleBackToList}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Back to Notes
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div className="mx-auto p-0">
          <NotesList
            notes={notes}
            onNoteClick={handleNoteClick}
            onEditNote={handleEditNote}
            onDeleteNote={deleteNote}
            onCreateNote={handleCreateNote}
            isLoading={isLoading}
          />
        </div>
      );
  }
}