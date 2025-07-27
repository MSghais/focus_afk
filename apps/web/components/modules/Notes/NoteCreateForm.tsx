'use client';

import { useState } from 'react';
import { Note, NoteSource } from '../../../types';

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
    sources: note?.sources || [],
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
    ...note,
  });

  const [newTopic, setNewTopic] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [showSourceModal, setShowSourceModal] = useState(false);
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
      sources: [...(prev.sources || []), source]
    }));
    setShowSourceModal(false);
    setSourceFormData({ type: 'text', title: '', content: '', url: '' });
  };

  const removeSource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sources: (prev.sources || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text?.trim()) return;
    onSubmit(formData);
  };

  const SourceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="ounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Add Source</h3>
          <button
            onClick={() => setShowSourceModal(false)}
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
                className={`p-4 border rounded-lg text-left transition-colors ${sourceFormData.type === type
                    ? 'border-blue-500'
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
        {/* <div className="mt-6 p-4  dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Source Limit</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {(formData.sources?.length || 0)}/20
            </span>
          </div>
          <div className="mt-2 w-full  dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(((formData.sources?.length || 0) / 20) * 100, 100)}%` }}
            />
          </div>
        </div> */}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => setShowSourceModal(false)}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sources
          </label>
          <button
            type="button"
            onClick={() => setShowSourceModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            + Add Source
          </button>
        </div>

        {/* Main Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Note Content *
          </label>
          <textarea
            value={formData.text || ''}
            onChange={(e) => handleInputChange('text', e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 h-32"
            placeholder="Write your note content here..."
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            placeholder="Brief description of the note"
          />
        </div>

        {/* Sources Section */}
        <div>


          {/* Sources List */}
          <div className="space-y-2">
            {formData.sources?.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {source.type === 'text' && '📄'}
                    {source.type === 'link' && '🔗'}
                    {source.type === 'youtube' && '📺'}
                    {source.type === 'google_drive' && '☁️'}
                  </span>
                  <div>
                    <div className="font-medium">{source.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {source.type} • {source.url || 'No URL'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topics
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.topics?.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removeArrayItem('topics', index)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
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
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              placeholder="Add a topic"
            />
            <button
              type="button"
              onClick={() => {
                addArrayItem('topics', newTopic);
                setNewTopic('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Add
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Requirements
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.requirements?.map((req, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              >
                {req}
                <button
                  type="button"
                  onClick={() => removeArrayItem('requirements', index)}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
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
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              placeholder="Add a requirement"
            />
            <button
              type="button"
              onClick={() => {
                addArrayItem('requirements', newRequirement);
                setNewRequirement('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Add
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty Level
          </label>
          <select
            value={formData.difficulty || 1}
            onChange={(e) => handleInputChange('difficulty', parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          >
            <option value={1}>Beginner</option>
            <option value={2}>Intermediate</option>
            <option value={3}>Advanced</option>
            <option value={4}>Expert</option>
            <option value={5}>Master</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !formData.text?.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (note ? 'Update Note' : 'Create Note')}
          </button>
        </div>
      </form>

      {showSourceModal && <SourceModal />}
    </div>
  );
}