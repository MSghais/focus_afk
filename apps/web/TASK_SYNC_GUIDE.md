# Task Sync to Backend Guide

## Overview

The Focus AFK app now supports syncing tasks between the local IndexedDB database and the backend server. This ensures your tasks are backed up and accessible across devices.

## How It Works

### Local-First Architecture
- Tasks are always created and stored locally first (IndexedDB)
- When authenticated, tasks are automatically synced to the backend
- The app works offline-first, with sync happening when online

### Sync Process
1. **Task Creation**: New tasks are saved locally and then sent to backend
2. **Task Updates**: Changes are applied locally and synced to backend
3. **Task Deletion**: Removed locally and from backend
4. **Manual Sync**: Use the "Sync to Backend" button to force sync all tasks

## Features

### Automatic Sync
- Tasks are automatically synced when you're authenticated
- Real-time updates between local and backend storage
- Error handling with retry mechanisms

### Manual Sync
- Click the "Sync to Backend" button in the tasks page
- Shows detailed progress and error reporting
- Handles conflicts by updating existing tasks or creating new ones

### Conflict Resolution
- If a task exists locally but not on backend → Creates new task
- If a task exists on backend but not locally → Updates local task
- If both exist → Updates backend with local changes

## Authentication Required

Task sync requires authentication. You must:
1. Login to your account
2. Have a valid JWT token
3. Be connected to the internet

## Error Handling

The sync system provides detailed error reporting:
- Shows which tasks failed to sync
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

3. **"Failed to sync tasks"**
   - Check your internet connection
   - Verify the backend server is running
   - Check browser console for detailed errors

### Debug Information

The sync process logs detailed information to the browser console:
- Number of tasks being synced
- Individual task processing status
- Success/failure counts
- Specific error messages

## API Endpoints

The sync system uses these backend endpoints:
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get specific task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `GET /tasks` - Get all tasks

## Data Structure

Tasks are synced with this structure:
```typescript
{
  id: string;           // Backend CUID
  title: string;        // Task title
  description?: string; // Optional description
  completed: boolean;   // Completion status
  priority: 'low' | 'medium' | 'high';
  category?: string;    // Optional category
  dueDate?: Date;       // Optional due date
  estimatedMinutes?: number; // Optional time estimate
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

## Best Practices

1. **Regular Sync**: Use manual sync periodically to ensure data consistency
2. **Check Errors**: Review error messages to identify sync issues
3. **Backup**: The backend serves as a backup of your local data
4. **Offline Work**: You can work offline and sync when back online 