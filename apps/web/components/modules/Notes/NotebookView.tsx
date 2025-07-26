'use client';

import { useState, useEffect } from 'react';
import { Note, NoteSource, NoteRelation } from '../../../types';
import api from '../../../lib/api';

interface NotebookViewProps {
  note: Note;
  onUpdate: (note: Partial<Note>) => void;
  onBack: () => void;
}

export default function NotebookView({ note, onUpdate, onBack }: NotebookViewProps) {
  const [activeTab, setActiveTab] = useState<'discussion' | 'studio' | 'sources'>('discussion');
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showLinkNoteModal, setShowLinkNoteModal] = useState(false);
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
      setRelatedNotes(notes.filter(n => n.success && n.data).map(n => n.data));
    } catch (error) {
      console.error('Error fetching related notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSource = (source: NoteSource) => {
    const updatedSources = [...(note.sources || []), source];
    onUpdate({ sources: updatedSources });
    setShowAddSourceModal(false);
    setSourceFormData({ type: 'text', title: '', content: '', url: '' });
  };

  const removeSource = (index: number) => {
    const updatedSources = (note.sources || []).filter((_, i) => i !== index);
    onUpdate({ sources: updatedSources });
  };

  const addRelation = async (targetNoteId: string) => {
    const newRelation: NoteRelation = {
      sourceNoteId: note.id!,
      targetNoteId,
      relationType: relationFormData.relationType!,
      strength: relationFormData.strength!
    };

    const updatedRelations = [...(note.relations || []), newRelation];
    onUpdate({ relations: updatedRelations });
    setShowLinkNoteModal(false);
    setRelationFormData({ relationType: 'related', strength: 0.5 });
  };

  const removeRelation = (index: number) => {
    const updatedRelations = (note.relations || []).filter((_, i) => i !== index);
    onUpdate({ relations: updatedRelations });
  };

  const SourceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Add Source</h3>
          <button
            onClick={() => setShowAddSourceModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Source Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Source Type</label>
          <div className="grid grid-cols-2 gap-4">
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
                className={`p-4 border rounded-lg text-left transition-colors ${
                  sourceFormData.type === type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              placeholder="Enter source title"
            />
          </div>

          {sourceFormData.type === 'text' && (
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={sourceFormData.content || ''}
                onChange={(e) => setSourceFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 h-32"
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
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
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
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400"
                >
                  📝 Google Docs
                </button>
                <button
                  type="button"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400"
                >
                  📊 Google Slides
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Source Limit Indicator */}
        <div className="mt-6 p-4 rounded-lg">
          <div className="flex justify-between items-center">   
            <span className="text-sm font-medium">Source Limit</span>
            <span className="text-sm">
              {(note.sources?.length || 0)}/300
            </span>
          </div>
          <div className="mt-2 w-full rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(((note.sources?.length || 0) / 300) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => setShowAddSourceModal(false)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => addSource(sourceFormData as NoteSource)}
            disabled={!sourceFormData.title}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Add Source
          </button>
        </div>
      </div>
    </div>
  );

  const LinkNoteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className=" rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Link Note</h3>
          <button
            onClick={() => setShowLinkNoteModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Relation Type</label>
            <select
              value={relationFormData.relationType}
              onChange={(e) => setRelationFormData(prev => ({ ...prev, relationType: e.target.value as NoteRelation['relationType'] }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
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
              className="w-full"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {relationFormData.strength}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Note ID</label>
            <input
              type="text"
              placeholder="Enter note ID to link"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => setShowLinkNoteModal(false)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => addRelation('temp-id')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Link Note
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold">{note.description || 'Untitled Notebook'}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">
              📊 Analytics
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">
              📤 Share
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar - Sources */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sources</h2>
            <button
              onClick={() => setShowAddSourceModal(true)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2">
            {note.sources?.map((source, index) => (
              <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">
                    {source.type === 'text' && '📄'}
                    {source.type === 'link' && '🔗'}
                    {source.type === 'youtube' && '📺'}
                    {source.type === 'google_drive' && '☁️'}
                  </span>
                  <span className="font-medium text-sm">{source.title}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {source.type} • {source.url || 'No URL'}
                </div>
                <button
                  onClick={() => removeSource(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('discussion')}
                className={`py-3 border-b-2 font-medium ${
                  activeTab === 'discussion'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Discussion
              </button>
              <button
                onClick={() => setActiveTab('studio')}
                className={`py-3 border-b-2 font-medium ${
                  activeTab === 'studio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Studio
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`py-3 border-b-2 font-medium ${
                  activeTab === 'sources'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sources
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {activeTab === 'discussion' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <textarea
                    placeholder="Ask a question about your sources..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 h-32 resize-none"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Generate
                      </button>
                      <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                        Add Note
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      NotebookLM can make mistakes. Please verify its answers.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'studio' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:border-gray-300">
                    <div className="text-lg mb-2">📋</div>
                    <div className="font-medium">Briefing Document</div>
                  </button>
                  <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:border-gray-300">
                    <div className="text-lg mb-2">📅</div>
                    <div className="font-medium">Timeline</div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Linked Notes</h3>
                  <button
                    onClick={() => setShowLinkNoteModal(true)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    + Link Note
                  </button>
                </div>

                <div className="space-y-2">
                  {note.relations?.map((relation, index) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Note {relation.targetNoteId}</div>
                          <div className="text-sm text-gray-500">
                            {relation.relationType} • Strength: {relation.strength}
                          </div>
                        </div>
                        <button
                          onClick={() => removeRelation(index)}
                          className="text-red-500 hover:text-red-700"
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

      {showAddSourceModal && <SourceModal />}
      {showLinkNoteModal && <LinkNoteModal />}
    </div>
  );
} 