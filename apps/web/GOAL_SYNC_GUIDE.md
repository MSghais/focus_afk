# Goal Sync to Backend Guide

## Overview

The Focus AFK app now supports syncing goals between the local IndexedDB database and the backend server. This ensures your goals are backed up and accessible across devices.

## How It Works

### Local-First Architecture
- Goals are always created and stored locally first (IndexedDB)
- When authenticated, goals are automatically synced to the backend
- The app works offline-first, with sync happening when online

### Sync Process
1. **Goal Creation**: New goals are saved locally and then sent to backend
2. **Goal Updates**: Changes are applied locally and synced to backend
3. **Goal Deletion**: Removed locally and from backend
4. **Manual Sync**: Use the "Sync to Backend" button to force sync all goals

## Features

### Automatic Sync
- Goals are automatically synced when you're authenticated
- Real-time updates between local and backend storage
- Error handling with retry mechanisms

### Manual Sync
- Click the settings icon in the goals page to access sync options
- Shows detailed progress and error reporting
- Handles conflicts by updating existing goals or creating new ones

### Conflict Resolution
- If a goal exists locally but not on backend → Creates new goal
- If a goal exists on backend but not locally → Updates local goal
- If both exist → Updates backend with local changes

### Data Merging
- The app automatically merges goals from local and backend sources
- Backend goals are preferred in case of conflicts
- Local goals without backend IDs are preserved

## Authentication Required

Goal sync requires authentication. You must:
1. Login to your account
2. Have a valid JWT token
3. Be connected to the internet

## Error Handling

The sync system provides detailed error reporting:
- Shows which goals failed to sync
- Displays specific error messages
- Allows retry of failed operations

## Troubleshooting

### Common Issues

1. **"User not authenticated"**
   - Make sure you're logged in
   - Check if your session is still valid

2. **"No JWT token available"**
   - Try logging out and back in
   - Check your internet connection

3. **"Failed to sync goals"**
   - Check your internet connection
   - Verify the backend server is running
   - Check browser console for detailed errors

### Debug Information

The sync process logs detailed information to the browser console:
- Number of goals being synced
- Individual goal processing status
- Success/failure counts
- Specific error messages

## API Endpoints

The sync system uses these backend endpoints:
- `POST /goals/create` - Create new goal
- `GET /goals/:id` - Get specific goal
- `PUT /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal
- `GET /goals` - Get all goals
- `PUT /goals/:id/progress` - Update goal progress

## Data Structure

Goals are synced with this structure:
```typescript
{
  id: string;           // Backend CUID
  userId: string;       // User ID
  title: string;        // Goal title
  description?: string; // Optional description
  targetDate?: Date;    // Optional target date
  completed: boolean;   // Completion status
  progress: number;     // Progress (0-100)
  category?: string;    // Optional category
  relatedTasks?: number[]; // Related task IDs
  relatedTaskIds?: string[]; // Backend field name
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

## Best Practices

1. **Regular Sync**: Use manual sync periodically to ensure data consistency
2. **Check Errors**: Review error messages to identify sync issues
3. **Backup**: The backend serves as a backup of your local data
4. **Offline Work**: You can work offline and sync when back online
5. **Refresh**: Use the refresh button to merge latest data from both sources

## Integration with Tasks

Goals can be linked to tasks:
- Goals can reference multiple tasks via `relatedTasks` field
- Task completion can affect goal progress
- Sync maintains these relationships across devices 