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
  isBackView?: boolean;
}

export default function SourceModal({ note, onUpdate, onBack, onEdit, onDelete, isBackView = true }: NotebookViewProps) {


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


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
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
} 