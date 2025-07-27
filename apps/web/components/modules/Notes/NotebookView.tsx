'use client';

import { useState, useEffect } from 'react';
import { Note, NoteSource, NoteRelation } from '../../../types';
import { Modal } from '../../small/Modal/Modal';
import api from '../../../lib/api';
import { useNotesStore } from '../../../store/notes';
import SourceToolsRecommendation from './SourceToolsRecommendation';
import ChatNotebook from './ChatNotebook';

interface NotebookViewProps {
  note: Note;
  onUpdate: (note: Partial<Note>) => void;
  onBack: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export default function NotebookView({ note, onUpdate, onBack, onEdit, onDelete }: NotebookViewProps) {


  const { notes, setNotes, noteSources, setNoteSources, selectedNote, setSelectedNote, selectedNoteSource, setSelectedNoteSource } = useNotesStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const [activeTab, setActiveTab] = useState<'discussion' | 'studio' | 'sources'>('discussion');
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showLinkNoteModal, setShowLinkNoteModal] = useState(false);
  const [showSourcesSidebar, setShowSourcesSidebar] = useState(false);
  const [sourceFormData, setSourceFormData] = useState<Partial<NoteSource>>({
    type: 'text',
    title: '',
    content: '',
    url: ''
  });
  const [relationFormData, setRelationFormData] = useState<Partial<NoteRelation>>({
    relationType: 'related',
    strength: 0.5
  });

  // Fetch related notes
  useEffect(() => {
    if (note.relations && note.relations.length > 0) {
      fetchRelatedNotes();
    }
  }, [note.relations]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const fetchRelatedNotes = async () => {
    setIsLoading(true);
    try {
      const relatedIds = note.relations?.map(r => r.targetNoteId) || [];
      const notes = await Promise.all(
        relatedIds.map(id => api.getNote(id))
      );
      setRelatedNotes(notes.filter(n => n.success && n.data).map(n => n.data!).filter(Boolean));
    } catch (error) {
      console.error('Error fetching related notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSource = (source: NoteSource) => {
    const updatedSources = [...(note.noteSources || []), source];
    onUpdate({
      noteSources: updatedSources,
      metadata: note.metadata || {}
    });
    setShowAddSourceModal(false);
    setSourceFormData({ type: 'text', title: '', content: '', url: '' });
  };

  const removeSource = (index: number) => {
    const updatedSources = (note.noteSources || []).filter((_, i) => i !== index);
    onUpdate({
      noteSources: updatedSources,
      metadata: note.metadata || {}
    });
  };

  const addRelation = async (targetNoteId: string) => {
    const newRelation: NoteRelation = {
      sourceNoteId: note.id!,
      targetNoteId,
      relationType: relationFormData.relationType!,
      strength: relationFormData.strength!
    };

    const updatedRelations = [...(note.relations || []), newRelation];
    onUpdate({
      relations: updatedRelations,
      metadata: note.metadata || {}
    });
    setShowLinkNoteModal(false);
    setRelationFormData({ relationType: 'related', strength: 0.5 });
  };

  const removeRelation = (index: number) => {
    const updatedRelations = (note.relations || []).filter((_, i) => i !== index);
    onUpdate({
      relations: updatedRelations,
      metadata: note.metadata || {}
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

  const SourceModal = () => (
    <Modal
      isOpen={showAddSourceModal}
      onClose={() => setShowAddSourceModal(false)}
      size="lg"
      height="auto"
      closeOnOverlayClick={true}
      showCloseButton={true}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Add Source</h3>
        </div>

        {/* Source Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Source Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { type: 'text', label: 'Paste Text', icon: '📄' },
              { type: 'link', label: 'Website Link', icon: '🔗' },
              { type: 'youtube', label: 'YouTube', icon: '📺' },
              { type: 'google_drive', label: 'Google Drive', icon: '☁️' }
            ].map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSourceFormData(prev => ({ ...prev, type: type as NoteSource['type'] }))}
                className={`p-4 border rounded-lg text-left transition-all duration-200 hover:scale-[1.02] ${sourceFormData.type === type
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border hover:border-border/80 hover:bg-muted/50'
                  }`}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Source Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={sourceFormData.title || ''}
              onChange={(e) => setSourceFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Enter source title"
            />
          </div>

          {sourceFormData.type === 'text' && (
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={sourceFormData.content || ''}
                onChange={(e) => setSourceFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-background h-32 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Paste your text content here..."
              />
            </div>
          )}

          {(sourceFormData.type === 'link' || sourceFormData.type === 'youtube') && (
            <div>
              <label className="block text-sm font-medium mb-2">URL *</label>
              <input
                type="url"
                value={sourceFormData.url || ''}
                onChange={(e) => setSourceFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={`Enter ${sourceFormData.type === 'youtube' ? 'YouTube' : 'website'} URL`}
              />
            </div>
          )}

          {sourceFormData.type === 'google_drive' && (
            <div>
              <label className="block text-sm font-medium mb-2">Google Drive Options</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="p-3 border border-border rounded-lg hover:border-border/80 hover:bg-muted/50 transition-colors"
                >
                  📝 Google Docs
                </button>
                <button
                  type="button"
                  className="p-3 border border-border rounded-lg hover:border-border/80 hover:bg-muted/50 transition-colors"
                >
                  📊 Google Slides
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Sources List */}
        {note.noteSources && note.noteSources.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-3">Existing Sources</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {note.noteSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{source.title}</div>
                    {source.url && (
                      <div className="text-sm text-muted-foreground truncate">{source.url}</div>
                    )}
                    <SourceToolsRecommendation source={source} noteId={note.id} onSourceUpdated={() => { }} />
                  </div>
                  <button
                    onClick={() => removeSource(index)}
                    className="text-destructive hover:text-destructive/80 ml-2 flex-shrink-0 p-1 hover:bg-destructive/10 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Limit Indicator */}
        <div className="p-4 rounded-lg bg-muted/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Source Limit</span>
            <span className="text-sm">
              {(note.noteSources?.length || 0)}/300
            </span>
          </div>
          <div className="w-full rounded-full h-2 bg-muted">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((note.noteSources?.length || 0) / 300) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setShowAddSourceModal(false)}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => addSource(sourceFormData as NoteSource)}
            disabled={!sourceFormData.title}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Source
          </button>
        </div>
      </div>
    </Modal>
  );

  const LinkNoteModal = () => (
    <Modal
      isOpen={showLinkNoteModal}
      onClose={() => setShowLinkNoteModal(false)}
      size="md"
      height="auto"
      closeOnOverlayClick={true}
      showCloseButton={true}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Link Note</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Relation Type</label>
            <select
              value={relationFormData.relationType}
              onChange={(e) => setRelationFormData(prev => ({ ...prev, relationType: e.target.value as NoteRelation['relationType'] }))}
              className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="related">Related</option>
              <option value="references">References</option>
              <option value="extends">Extends</option>
              <option value="supports">Supports</option>
              <option value="contradicts">Contradicts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Strength (0-1)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={relationFormData.strength}
              onChange={(e) => setRelationFormData(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="text-sm text-muted-foreground mt-1">
              {relationFormData.strength}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Note ID</label>
            <input
              type="text"
              placeholder="Enter note ID to link"
              className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setShowLinkNoteModal(false)}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => addRelation('temp-id')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Link Note
          </button>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold truncate text-wrap text-ellipsis max-w-[200px]">{note?.text || note?.description || 'Untitled Notebook'}</h1>
              <div className="text-sm text-muted-foreground">
                {note.noteSources?.length || 0} sources
              </div>
            </div>
          </div>
          {/* <div className="flex items-center space-x-3">


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
          </div> */}
          <div className="flex items-center space-x-2">
            {/* Mobile: Show sources toggle button */}
            <button
              onClick={() => setShowSourcesSidebar(!showSourcesSidebar)}
              className="md:hidden px-3 py-1 text-sm bg-muted rounded-lg"
            >
              📚
            </button>
            <button className="hidden md:block px-3 py-1 text-sm bg-muted rounded-lg">
              📊 Analytics
            </button>
            <button className="hidden md:block px-3 py-1 text-sm bg-muted rounded-lg">
              📤 Share
            </button>
            <button className="hidden md:block px-3 py-1 text-sm bg-muted rounded-lg">
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">


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

      {/* <div className="flex flex-1 relative">
        <div className="hidden md:block w-80 border-r border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sources</h2>
            <button
              onClick={() => setShowAddSourceModal(true)}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2">
            {note.noteSources?.map((source, index) => (
              <div key={index} className="p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">
                    {source.type === 'text' && '📄'}
                    {source.type === 'link' && '🔗'}
                    {source.type === 'youtube' && '📺'}
                    {source.type === 'google_drive' && '☁️'}
                    {source.type === 'file' && '📁'}
                    {source.type === 'website' && '🌐'}
                  </span>
                  <span className="font-medium text-sm  text-wrap text-ellipsis overflow-hidden">{source.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {source.type} • {source.url || source.content?.substring(0, 50) || 'No content'}
                </div>
                <button
                  onClick={() => removeSource(index)}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {showSourcesSidebar && (
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setShowSourcesSidebar(false)}
            />
            <div className="absolute left-0 top-0 h-full w-80 bg-background border-r border-border p-4 overflow-y-auto transform transition-transform duration-300 ease-out shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Sources</h2>
                <button
                  onClick={() => setShowSourcesSidebar(false)}
                  className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Add new source</span>
                <button
                  onClick={() => setShowAddSourceModal(true)}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2">
                {note.noteSources?.map((source, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg hover:border-border/80 transition-colors"
                    onClick={() => setSelectedNoteSource(source)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">
                        {source.type === 'text' && '📄'}
                        {source.type === 'link' && '🔗'}
                        {source.type === 'youtube' && '📺'}
                        {source.type === 'google_drive' && '☁️'}
                        {source.type === 'file' && '📁'}
                        {source.type === 'website' && '🌐'}
                      </span>
                      <span className="font-medium text-sm text-wrap text-ellipsis overflow-hidden">{source.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 text-wrap text-ellipsis overflow-hidden">
                      {source.type} • {source.url || source.content?.substring(0, 50) || 'No content'}
                    </div>
                    <button
                      onClick={() => removeSource(index)}
                      className="text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-2 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


      </div> */}
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ChatNotebook note={note} onUpdate={onUpdate} onBack={onBack} />

      </div>

      {showAddSourceModal && <SourceModal />}
      {showLinkNoteModal && <LinkNoteModal />}
    </div>
  );
} 