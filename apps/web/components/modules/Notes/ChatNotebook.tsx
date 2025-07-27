'use client';

import { useState, useEffect } from 'react';
import { Note, NoteSource, NoteRelation } from '../../../types';
import { Modal } from '../../small/Modal/Modal';
import api from '../../../lib/api';
import { useNotesStore } from '../../../store/notes';
import SourceToolsRecommendation from './SourceToolsRecommendation';

interface ChatNotebookProps {
  note: Note;
  onUpdate: (note: Partial<Note>) => void;
  onBack: () => void;
}

export default function ChatNotebook({ note, onUpdate, onBack }: ChatNotebookProps) {


  const { notes, setNotes, noteSources, setNoteSources, selectedNote, setSelectedNote, selectedNoteSource, setSelectedNoteSource } = useNotesStore();
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


  return (
    <div className="h-full flex flex-col">
      <div className="flex space-x-4 md:space-x-8 px-4 md:px-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('discussion')}
          className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'discussion'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Discussion
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'studio'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Studio
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'sources'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Sources
        </button>
      </div>
      <div className="flex-1 p-4 md:p-6">
        {/* Tab Content */}
        <div className="flex-1 p-4 md:p-6">
          {activeTab === 'discussion' && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <textarea
                  placeholder="Ask a question about your sources..."
                  className="w-full p-3 border border-border rounded-lg bg-background h-32 resize-none"
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 space-y-3 sm:space-y-0">
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                      Generate
                    </button>
                    <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
                      Add Note
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground text-center sm:text-right">
                    AI can make mistakes. Please verify its answers.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="p-4 border border-border rounded-lg text-left hover:border-border/80">
                  <div className="text-lg mb-2">📋</div>
                  <div className="font-medium">Briefing Document</div>
                </button>
                <button className="p-4 border border-border rounded-lg text-left hover:border-border/80">
                  <div className="text-lg mb-2">📅</div>
                  <div className="font-medium">Timeline</div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <h3 className="text-lg font-semibold">Linked Notes</h3>
                <button
                  onClick={() => setShowLinkNoteModal(true)}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  + Link Note
                </button>
              </div>

              <div className="space-y-2">
                {note.relations?.map((relation, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">Note {relation.targetNoteId}</div>
                        <div className="text-sm text-muted-foreground">
                          {relation.relationType} • Strength: {relation.strength}
                        </div>
                      </div>
                      <button
                        onClick={() => removeRelation(index)}
                        className="text-destructive hover:text-destructive/80 ml-2 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
} 