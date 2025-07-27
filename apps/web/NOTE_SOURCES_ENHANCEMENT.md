# Note Sources Enhancement

## Overview

This enhancement introduces structured note sources to replace the previous string-based approach, allowing for better differentiation and handling of different source types in the Focus AFK application.

## Changes Made

### 1. Backend Schema Changes

#### New NoteSource Model
```sql
CREATE TABLE "note_sources" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "note_sources_pkey" PRIMARY KEY ("id")
);
```

#### Supported Source Types
- `text` - Pasted text content
- `link` - Website links
- `youtube` - YouTube videos
- `google_drive` - Google Drive files
- `file` - File uploads
- `website` - General website references

### 2. Frontend UI Implementation

#### Source Type Selection
The UI provides a visual interface for selecting source types with:
- **Text Sources**: Text area for pasting content
- **Link Sources**: URL input field
- **YouTube Sources**: YouTube URL input with validation
- **Google Drive Sources**: Options for Docs, Slides, etc.

#### Visual Indicators
Each source type has a distinct emoji icon:
- 📄 Text sources
- 🔗 Link sources  
- 📺 YouTube sources
- ☁️ Google Drive sources

### 3. API Endpoints

#### Enhanced Endpoints
- `POST /notes` - Create note with structured sources
- `GET /notes` - Retrieve notes with included sources
- `GET /notes/:id` - Get specific note with sources
- `PUT /notes/:id` - Update note and sources
- `DELETE /notes/:id` - Delete note and associated sources
- `GET /notes/sources` - Get all sources with type grouping
- `GET /notes/sources/:type` - Get sources by specific type

#### Response Format
```json
{
  "sources": [
    {
      "id": "source-id",
      "type": "youtube",
      "title": "Video Title",
      "url": "https://youtube.com/watch?v=...",
      "content": null,
      "fileType": null,
      "fileSize": null,
      "metadata": {}
    }
  ],
  "sourcesByType": {
    "youtube": [...],
    "text": [...],
    "link": [...]
  },
  "totalSources": 5
}
```

### 4. Validation Schema

#### Zod Validation
```typescript
const noteSourceSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['text', 'link', 'youtube', 'google_drive', 'file', 'website']),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  url: z.string().url().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  metadata: z.any().optional(),
});
```

## Usage Examples

### Creating a Note with Sources

```typescript
const noteData = {
  text: "My research notes",
  description: "Notes about AI and machine learning",
  topics: ["AI", "Machine Learning"],
  noteSources: [
    {
      type: "youtube",
      title: "Introduction to AI",
      url: "https://youtube.com/watch?v=abc123"
    },
    {
      type: "text",
      title: "Research Paper Summary",
      content: "This paper discusses the latest developments..."
    },
    {
      type: "link",
      title: "AI Research Blog",
      url: "https://example.com/ai-research"
    }
  ]
};

const response = await api.createNote(noteData);
```

### Retrieving Sources by Type

```typescript
// Get all YouTube sources
const youtubeSources = await api.getNoteSourcesByType('youtube');

// Get all sources grouped by type
const allSources = await api.getNoteSources();
console.log(allSources.sourcesByType.youtube); // YouTube sources
console.log(allSources.sourcesByType.text);    // Text sources
```

### Updating Note Sources

```typescript
const updatedNote = {
  ...existingNote,
  noteSources: [
    ...existingSources,
    {
      type: "google_drive",
      title: "Presentation Slides",
      url: "https://drive.google.com/file/d/...",
      metadata: { fileType: "presentation" }
    }
  ]
};

const response = await api.updateNote(noteId, updatedNote);
```

## Migration Strategy

### Backward Compatibility
- The old `sources: string[]` field is maintained for backward compatibility
- Existing string sources are automatically migrated to structured sources
- New notes can use either format during transition

### Migration Script
```bash
# Run the migration script
node scripts/migrate-note-sources.js
```

This script:
1. Creates the new `note_sources` table
2. Migrates existing string sources to structured format
3. Preserves all existing data

## UI Components

### NoteCreateForm
- Enhanced source modal with type selection
- Dynamic form fields based on source type
- Visual source type indicators
- Source management (add/remove)

### NotebookView
- Source sidebar with type filtering
- Source preview with metadata
- Source editing capabilities
- Source relationship management

### NoteDetail
- Source display with type icons
- Source content preview
- Copy to clipboard functionality
- Source metadata display

## Benefits

1. **Better Organization**: Sources are categorized by type
2. **Rich Metadata**: Each source type can have specific metadata
3. **Enhanced Search**: Filter and search by source type
4. **Improved UX**: Visual indicators and type-specific forms
5. **Extensibility**: Easy to add new source types
6. **Data Integrity**: Proper validation and constraints

## Future Enhancements

1. **File Upload**: Direct file upload support
2. **Source Analytics**: Track source usage and engagement
3. **Source Recommendations**: AI-powered source suggestions
4. **Source Sharing**: Share sources between notes
5. **Source Versioning**: Track changes to sources over time
6. **Source Validation**: Automatic URL validation and content extraction

## Testing

### Manual Testing Checklist
- [ ] Create note with different source types
- [ ] Update note sources
- [ ] Delete note (verify cascade deletion)
- [ ] Filter sources by type
- [ ] Validate source type constraints
- [ ] Test backward compatibility
- [ ] Verify UI displays correctly

### API Testing
```bash
# Test source creation
curl -X POST /notes \
  -H "Authorization: Bearer <token>" \
  -d '{"text":"Test","noteSources":[{"type":"youtube","title":"Test","url":"https://youtube.com/watch?v=test"}]}'

# Test source retrieval
curl -X GET /notes/sources \
  -H "Authorization: Bearer <token>"

# Test source filtering
curl -X GET /notes/sources/youtube \
  -H "Authorization: Bearer <token>"
``` 