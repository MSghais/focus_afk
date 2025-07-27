# Source Interaction Guide

This guide documents the new AI-powered source interaction features in the Focus AFK Notes module.

## Overview

The source interaction system allows users to:
- **Scrape website content** using exa-js
- **Get AI-powered source suggestions** based on note content
- **Analyze sources** with AI
- **Get insights and recommendations**
- **Find similar sources**
- **Interact with sources** through an AI agent

## Features

### 1. AI Source Suggestions 🆕

**Location**: Note creation/editing form
**How to use**:
1. Click the "💡 AI Suggestions" button in the Sources section
2. Start typing your note content
3. AI will automatically suggest relevant sources as you type
4. Choose search type (All, Articles, Research, Tutorials, Documentation)
5. Select sources and click "Add Selected" or "Add All"

**Features**:
- **Auto-suggestions**: Real-time suggestions as you type
- **Search types**: Filter by content type (articles, research, tutorials, documentation)
- **Relevance scoring**: See how well each source matches your content
- **Topic extraction**: AI identifies key topics from your text
- **Batch selection**: Add multiple sources at once

### 2. Website Scraping

**Location**: Note creation/editing form
**How to use**:
1. Click the "🌐 Scrape Website" button in the Sources section
2. Enter a website URL
3. Click "Scrape" to extract content
4. Review the scraped content and metadata
5. Click "Add to Note" to save as a source

**What gets scraped**:
- Page title
- Main content (configurable length)
- AI-generated highlights
- Metadata (scraped date, word count, etc.)

### 3. AI Source Analysis

**Location**: Note detail view (for website sources)
**Available analyses**:
- **Summary**: Concise overview of the content
- **Key Points**: Main takeaways and important information
- **Questions**: Thoughtful questions based on the content
- **Insights**: Contextual insights and observations

**How to use**:
1. Open a note with website sources
2. Click "Show AI Tools" on any website source
3. Choose an analysis type (Summary, Key Points, Questions, Insights)
4. View the AI-generated analysis

### 4. Source Insights

**Location**: Note detail view (for website sources)
**Features**:
- Key insights and takeaways
- Related topics to explore
- Potential questions for further research
- Contextual relationship to the note

### 5. Similar Sources Discovery

**Location**: Note detail view (for website sources)
**Features**:
- Find similar content across the web
- Discover related articles and resources
- Expand research scope

## Technical Implementation

### Backend API Endpoints

All endpoints are prefixed with `/notes/source-agent/`:

- `POST /scrape-website` - Scrape website content
- `POST /suggest-sources` - Get AI-powered source suggestions 🆕
- `POST /analyze-source` - Analyze source with AI
- `GET /source-insights/:sourceId` - Get source insights
- `GET /similar-sources/:sourceId` - Find similar sources

### Frontend Components

- `SourceAgent.tsx` - Main component for source interaction
- `SourceSuggestions.tsx` - AI-powered source suggestions 🆕
- `SearchTypeSelector.tsx` - Search type filter component 🆕
- `WebsiteScraper.tsx` - Component for scraping websites
- `SourceSuggestionsExample.tsx` - Usage examples 🆕
- Integrated into `NoteDetail.tsx` and `NoteCreateForm.tsx`

### AI Integration

Uses exa-js for:
- Web scraping and content extraction
- **AI-powered source discovery and suggestions** 🆕
- AI-powered analysis and insights
- Similar content discovery
- Contextual recommendations

## Usage Examples

### Example 1: Research Note with AI Suggestions

1. Create a new note about "AI in Education"
2. Click "💡 AI Suggestions" and start typing your content
3. AI will suggest relevant sources as you type:
   - Research papers on educational AI
   - Articles about AI tools in classrooms
   - Tutorials on implementing AI in education
4. Select relevant sources and add them to your note
5. Use AI analysis tools on each source for deeper insights

### Example 2: Learning Note with Interactive Sources

1. Create a note about a programming concept
2. Use AI suggestions to find:
   - Official documentation
   - Tutorial videos and guides
   - Community discussions and examples
3. Use AI analysis to:
   - Summarize complex concepts
   - Generate practice questions
   - Identify related topics to study
   - Find additional learning resources

### Example 3: Content Creation with Source Discovery

1. Start writing content about any topic
2. Let AI suggest authoritative sources
3. Use different search types:
   - **Articles**: For news and current information
   - **Research**: For academic and scientific sources
   - **Tutorials**: For step-by-step guides
   - **Documentation**: For technical references
4. Build a comprehensive source list automatically

## Configuration

### Source Suggestions Options

- `maxResults`: Number of suggestions to return (default: 5)
- `includeContent`: Include full content in suggestions (default: false)
- `searchType`: Filter by content type (default: 'all')
- `autoSuggest`: Enable automatic suggestions (default: true)
- `minTextLength`: Minimum text length for suggestions (default: 20)

### Scraping Options

- `maxCharacters`: Maximum content length (default: 2000)
- `highlightQuery`: Keywords for AI highlighting (default: "AI, technology, productivity")
- `numSentences`: Number of highlight sentences (default: 3)

### Analysis Types

- `summary`: Concise content overview
- `key_points`: Main takeaways
- `questions`: Generated questions
- `insights`: Contextual insights

## Reusable Components

### SourceSuggestions Component

```tsx
<SourceSuggestions
  text={noteContent}
  onSourcesAdded={(sources) => addSourcesToNote(sources)}
  maxResults={8}
  includeContent={true}
  searchType="research"
  autoSuggest={true}
  minTextLength={30}
/>
```

### SearchTypeSelector Component

```tsx
<SearchTypeSelector
  value={searchType}
  onChange={setSearchType}
/>
```

## Error Handling

The system handles various error scenarios:
- Invalid URLs
- Failed scraping attempts
- Network connectivity issues
- AI service unavailability
- **No relevant sources found** 🆕
- **Text too short for suggestions** 🆕

Users receive clear error messages and can retry operations.

## Future Enhancements

Planned features:
- **Source quality scoring** 🆕
- **Personalized suggestions** based on user history 🆕
- **Source relationship mapping** 🆕
- Support for more source types (PDFs, videos, etc.)
- Advanced filtering and search
- Collaborative source analysis
- Export capabilities
- **Source bookmarking and favorites** 🆕

## Troubleshooting

### Common Issues

1. **No suggestions appear**: Check text length and ensure you have enough content
2. **Suggestions not relevant**: Try changing the search type or adding more specific keywords
3. **Scraping fails**: Check URL validity and ensure the site allows scraping
4. **AI analysis slow**: Large content may take longer to process
5. **No similar sources found**: Try different keywords or content types

### Support

For technical issues, check:
- Backend logs for API errors
- Network connectivity
- exa-js API key configuration
- Prisma database connection
- **Text length requirements for suggestions** 🆕 

## AI Source Suggestions

The AI Source Suggestions feature allows users to get intelligent source recommendations based on their note content using `exa-js`. This feature provides relevant articles, research papers, tutorials, and documentation that can be added as sources to notes.

### Features

- **Manual Search**: Click the search button to get AI-powered source suggestions based on your text
- **Search Type Filtering**: Filter suggestions by type (articles, research, tutorials, documentation, or all)
- **Multiple Selection**: Select individual sources or add all suggestions at once
- **Relevance Scoring**: See relevance scores for each suggestion
- **Content Preview**: Preview source content before adding
- **Easy Integration**: Seamlessly add suggestions to your notes

### Usage

1. **In Note Creation/Editing**:
   - Click the "💡 AI Suggestions" button in the Sources section
   - Select your preferred search type (All, Articles, Research, Tutorials, Documentation)
   - Type your note content (minimum 30 characters)
   - Click "🔍 Search" to get suggestions
   - Select desired sources and click "Add Selected" or "Add All"

2. **Component Usage**:
   ```tsx
   <SourceSuggestions
     text="Your note content here..."
     onSourcesAdded={(sources) => {
       // Handle added sources
       setNoteSources(prev => [...prev, ...sources]);
     }}
     maxResults={8}
     includeContent={true}
     searchType="all"
     minTextLength={30}
   />
   ```

### Backend Implementation

**Endpoint**: `POST /notes/source-agent/suggest-sources`

**Request Body**:
```typescript
{
  text: string;                    // Input text to analyze
  maxResults?: number;            // Maximum number of suggestions (default: 5)
  includeContent?: boolean;       // Include full content in response (default: false)
  searchType?: 'articles' | 'research' | 'tutorials' | 'documentation' | 'all';
}
```

**Response**:
```typescript
{
  suggestions: NoteSource[];      // Array of suggested sources
  query: string;                  // The search query used
  topics: string[];               // Extracted topics from the text
  totalFound: number;             // Total number of sources found
  searchType: string;             // The search type used
}
```

### Frontend Components

#### SourceSuggestions Component

**Location**: `apps/web/components/modules/Notes/SourceSuggestions.tsx`

**Props**:
- `text`: Input text to analyze for suggestions
- `onSourcesAdded`: Callback when sources are added
- `maxResults`: Maximum number of suggestions to show
- `includeContent`: Whether to include full content in suggestions
- `searchType`: Type of sources to search for
- `minTextLength`: Minimum text length required for search
- `className`: Additional CSS classes

**Features**:
- Manual search trigger with button
- Multiple source selection with checkboxes
- Add selected or all sources functionality
- Loading states and error handling
- Relevance score display
- Content preview

#### SearchTypeSelector Component

**Location**: `apps/web/components/modules/Notes/SearchTypeSelector.tsx`

**Props**:
- `value`: Current search type
- `onChange`: Callback when search type changes
- `className`: Additional CSS classes

**Search Types**:
- 🔍 All: Mixed content types
- 📰 Articles: News and blog articles
- 🔬 Research: Academic papers and research
- 📚 Tutorials: How-to guides and tutorials
- 📖 Documentation: Technical documentation

### Integration in NoteCreateForm

The AI suggestions are integrated into the note creation form:

1. **Button Integration**: "💡 AI Suggestions" button in the Sources section
2. **Search Type Control**: SearchTypeSelector component for filtering
3. **Auto-Integration**: Selected sources are automatically added to the note
4. **State Management**: Suggestions are managed within the form's state

### Example Usage

```tsx
// In NoteCreateForm.tsx
{showSourceSuggestions && (
  <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
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
``` 