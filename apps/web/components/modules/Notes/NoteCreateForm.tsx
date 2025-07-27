'use client';

import { useState } from 'react';
import { Note, NoteSource } from '../../../types';
import WebsiteScraper from './WebsiteScraper';
import SourceSuggestions from './SourceSuggestions';
import SearchTypeSelector from './SearchTypeSelector';
import { ButtonPrimary } from '../../small/buttons';

interface NoteCreateFormProps {
  onSubmit: (note: Partial<Note>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  note?: Note;
}

export default function NoteCreateForm({ onSubmit, onCancel, isLoading = false, note }: NoteCreateFormProps) {
  const [formData, setFormData] = useState<Partial<Note>>({
    text: note?.text || '',
    description: note?.description || '',
    summary: note?.summary || '',
    topics: note?.topics || [],
    sources: note?.sources || [], // Keep for backward compatibility
    noteSources: note?.noteSources || [], // New structured sources
    aiSources: note?.aiSources || [],
    aiTopics: note?.aiTopics || [],
    type: note?.type || 'user',
    difficulty: note?.difficulty || 1,
    requirements: note?.requirements || [],
    isNotebook: note?.isNotebook || false,
    notebookSettings: note?.notebookSettings || {
      allowCollaboration: false,
      defaultView: 'list',
      tags: []
    },
    metadata: note?.metadata || {},
    ...note,
  });

  const [newTopic, setNewTopic] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showWebsiteScraper, setShowWebsiteScraper] = useState(false);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'articles' | 'research' | 'tutorials' | 'documentation'>('all');
  const [sourceFormData, setSourceFormData] = useState<Partial<NoteSource>>({
    type: 'text',
    title: '',
    content: '',
    url: ''
  });

  const handleInputChange = (field: keyof Note, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: keyof Note, value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), value.trim()]
    }));
  };

  const removeArrayItem = (field: keyof Note, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).filter((_, i) => i !== index)
    }));
  };

  const addSource = (source: NoteSource) => {
    setFormData(prev => ({
      ...prev,
      noteSources: [...(prev.noteSources || []), source]
    }));
    setShowSourceModal(false);
    setSourceFormData({ type: 'text', title: '', content: '', url: '' });
  };

  const removeSource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      noteSources: (prev.noteSources || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text?.trim()) return;
    
    // Prepare the data for submission
    const submitData = {
      ...formData,
      // Ensure we send both old and new format for backward compatibility
      sources: formData.sources || [],
      noteSources: formData.noteSources || [],
      // Ensure metadata is always an object
      metadata: formData.metadata || {}
    };
    
    onSubmit(submitData);
  };

  const SourceModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 ">
          <h3 className="text-xl font-bold">Add Source</h3>
          <button
            onClick={() => setShowSourceModal(false)}
            className="text-muted-foreground hover:text-foreground"
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
              { type: 'google_drive', label: 'Google Drive', icon: '☁️' },
              { type: 'file', label: 'File Upload', icon: '📁' },
              { type: 'website', label: 'Website', icon: '🌐' }
            ].map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSourceFormData(prev => ({ ...prev, type: type as NoteSource['type'] }))}
                className={`p-4 border rounded-lg text-left transition-colors ${sourceFormData.type === type
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border/80'
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
              className="w-full p-3 border border-border rounded-lg bg-background"
              placeholder="Enter source title"
            />
          </div>

          {sourceFormData.type === 'text' && (
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={sourceFormData.content || ''}
                onChange={(e) => setSourceFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-background h-32"
                placeholder="Paste your text content here..."
              />
            </div>
          )}

          {(sourceFormData.type === 'link' || sourceFormData.type === 'youtube' || sourceFormData.type === 'website') && (
            <div>
              <label className="block text-sm font-medium mb-2">URL *</label>
              <input
                type="url"
                value={sourceFormData.url || ''}
                onChange={(e) => setSourceFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-background"
                placeholder={`Enter ${sourceFormData.type === 'youtube' ? 'YouTube' : sourceFormData.type === 'website' ? 'website' : 'link'} URL`}
              />
            </div>
          )}

          {sourceFormData.type === 'google_drive' && (
            <div>
              <label className="block text-sm font-medium mb-2">Google Drive Options</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="p-3 border border-border rounded-lg hover:border-border/80"
                >
                  📝 Google Docs
                </button>
                <button
                  type="button"
                  className="p-3 border border-border rounded-lg hover:border-border/80"
                >
                  📊 Google Slides
                </button>
              </div>
            </div>
          )}

          {sourceFormData.type === 'file' && (
            <div>
              <label className="block text-sm font-medium mb-2">File Information</label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={sourceFormData.fileType || ''}
                  onChange={(e) => setSourceFormData(prev => ({ ...prev, fileType: e.target.value }))}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                  placeholder="File type (e.g., PDF, DOC, etc.)"
                />
                <input
                  type="number"
                  value={sourceFormData.fileSize || ''}
                  onChange={(e) => setSourceFormData(prev => ({ ...prev, fileSize: parseInt(e.target.value) || undefined }))}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                  placeholder="File size in bytes"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => setShowSourceModal(false)}
            className="px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => addSource(sourceFormData as NoteSource)}
            disabled={!sourceFormData.title}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            Add Source
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6"> {note ? 'Edit Note' : 'Create New Note'} </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notebook Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isNotebook"
            checked={formData.isNotebook || false}
            onChange={(e) => handleInputChange('isNotebook', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isNotebook" className="text-sm font-medium">
            Create as Notebook Project (with sources and linked notes)
          </label>
        </div>

        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-muted-foreground">
            Sources
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowSourceSuggestions(!showSourceSuggestions)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              💡 AI Suggestions
            </button>
            <button
              type="button"
              onClick={() => setShowWebsiteScraper(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              🌐 Scrape Website
            </button>
            <ButtonPrimary
              type="button"
              onClick={() => setShowSourceModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
            >
              + Add Source
            </ButtonPrimary>
          </div>
        </div>

        {/* Main Text */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Note Content *
          </label>
          <textarea
            value={formData.text || ''}
            onChange={(e) => handleInputChange('text', e.target.value)}
            className="w-full p-3 border border-border rounded-lg bg-background h-32"
            placeholder="Write your note content here..."
            required
          />
        </div>

        {/* AI Source Suggestions */}
        {showSourceSuggestions && (
          <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg ">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Search Type</h4>
              <SearchTypeSelector
                value={searchType}
                onChange={setSearchType}
              />
            </div>
            <SourceSuggestions
              text={formData.text || ''}
              onSourcesAdded={(sources) => {
                setFormData(prev => ({
                  ...prev,
                  noteSources: [...(prev.noteSources || []), ...sources]
                }));
              }}
              maxResults={8}
              includeContent={true}
              searchType={searchType}
              minTextLength={30}
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Description
          </label>
          <input
            type="text"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full p-3 border border-border rounded-lg bg-background"
            placeholder="Brief description of the note"
          />
        </div>

        {/* Sources Section */}
        <div>
          {/* Sources List */}
          <div className="space-y-2">
            {formData.noteSources?.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
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
                    <div className="font-medium">{source.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.type} • {source.url || source.content?.substring(0, 50) || 'No content'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Topics
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.topics?.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removeArrayItem('topics', index)}
                  className="ml-2 text-primary hover:text-primary/80"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="flex-1 p-2 border border-border rounded-lg bg-background"
              placeholder="Add a topic"
            />
            <button
              type="button"
              onClick={() => {
                addArrayItem('topics', newTopic);
                setNewTopic('');
              }}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
            >
              Add
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Requirements
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.requirements?.map((req, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground"
              >
                {req}
                <button
                  type="button"
                  onClick={() => removeArrayItem('requirements', index)}
                  className="ml-2 text-secondary-foreground hover:text-secondary-foreground/80"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              className="flex-1 p-2 border border-border rounded-lg bg-background"
              placeholder="Add a requirement"
            />
            <button
              type="button"
              onClick={() => {
                addArrayItem('requirements', newRequirement);
                setNewRequirement('');
              }}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
            >
              Add
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Difficulty Level
          </label>
          <select
            value={formData.difficulty || 1}
            onChange={(e) => handleInputChange('difficulty', parseInt(e.target.value))}
            className="w-full p-3 border border-border rounded-lg bg-background"
          >
            <option value={1}>Beginner</option>
            <option value={2}>Intermediate</option>
            <option value={3}>Advanced</option>
            <option value={4}>Expert</option>
            <option value={5}>Master</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !formData.text?.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (note ? 'Update Note' : 'Create Note')}
          </button>
        </div>
      </form>

      {showSourceModal && <SourceModal />}
      
      {/* Website Scraper Modal */}
      {showWebsiteScraper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <WebsiteScraper
              noteId={note?.id}
              onSourceAdded={addSource}
              onClose={() => setShowWebsiteScraper(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}