'use client';

import { useState } from 'react';
import { NoteSource } from '../../../types';
import api from '../../../lib/api';

interface WebsiteScraperProps {
  noteId?: string;
  onSourceAdded?: (source: NoteSource) => void;
  onClose?: () => void;
}

export default function WebsiteScraper({ noteId, onSourceAdded, onClose }: WebsiteScraperProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedContent, setScrapedContent] = useState<any>(null);

  const handleScrapeWebsite = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.scrapeWebsite({
        url: url.trim(),
        noteId,
        maxCharacters: 2000,
        highlightQuery: 'AI, technology, productivity, focus',
        numSentences: 3
      });

      if (response.success && response.data) {
        setScrapedContent(response.data);
        if (onSourceAdded && response.data.source) {
          onSourceAdded(response.data.source);
        }
      } else {
        throw new Error('Failed to scrape website');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape website');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToNote = () => {
    if (scrapedContent?.source && onSourceAdded) {
      onSourceAdded(scrapedContent.source);
      setUrl('');
      setScrapedContent(null);
      setError(null);
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🌐 Scrape Website</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label htmlFor="website-url" className="text-sm font-medium">
          Website URL
        </label>
        <div className="flex space-x-2">
          <input
            id="website-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleScrapeWebsite}
            disabled={isLoading || !url.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Scraping...</span>
              </div>
            ) : (
              'Scrape'
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Scraped Content Preview */}
      {scrapedContent && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Scraped Content</h4>
            <button
              onClick={handleAddToNote}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Add to Note
            </button>
          </div>

          <div className="space-y-3">
            {/* Title */}
            {scrapedContent.scrapedContent?.title && (
              <div>
                <h5 className="text-sm font-medium text-muted-foreground">Title</h5>
                <p className="text-sm">{scrapedContent.scrapedContent.title}</p>
              </div>
            )}

            {/* Content Preview */}
            {scrapedContent.scrapedContent?.text && (
              <div>
                <h5 className="text-sm font-medium text-muted-foreground">Content Preview</h5>
                <div className="text-sm bg-muted p-3 rounded max-h-32 overflow-y-auto">
                  {scrapedContent.scrapedContent.text.length > 300
                    ? `${scrapedContent.scrapedContent.text.substring(0, 300)}...`
                    : scrapedContent.scrapedContent.text
                  }
                </div>
              </div>
            )}

            {/* Highlights */}
            {scrapedContent.scrapedContent?.highlights && scrapedContent.scrapedContent.highlights.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-muted-foreground">Highlights</h5>
                <div className="space-y-1">
                  {scrapedContent.scrapedContent.highlights.map((highlight: string, index: number) => (
                    <div key={index} className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {scrapedContent.source?.metadata && (
              <div>
                <h5 className="text-sm font-medium text-muted-foreground">Metadata</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Scraped at: {new Date(scrapedContent.source.metadata.scrapedAt).toLocaleString()}</p>
                  <p>Word count: {scrapedContent.source.metadata.wordCount}</p>
                  <p>Scraped by: {scrapedContent.source.metadata.scrapedBy}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 