# Timer Sync Guide

This guide explains how timer sessions are synchronized between local IndexedDB storage and the backend database in the Focus AFK application.

## Overview

The timer sync system ensures that:
- Timer sessions are saved locally for offline functionality
- Sessions are synced to the backend when the user is authenticated
- Stats and progress are consistent across devices
- The app works offline-first with sync when online

## Architecture

### Local Storage (IndexedDB)
- Timer sessions are stored locally using Dexie.js
- Each session includes sync metadata (`syncedToBackend`, `backendId`)
- Sessions work offline and sync when connection is restored

### Backend API
- RESTful endpoints for timer session CRUD operations
- Authentication required for all operations
- Supports filtering by task, goal, date range, etc.

### Sync Strategy
- **Offline-first**: All operations work locally
- **Background sync**: Sessions sync to backend when authenticated
- **Conflict resolution**: Backend data takes precedence for conflicts
- **Incremental sync**: Only unsynced sessions are sent to backend

## Database Schema

### TimerSession Type
```typescript
interface TimerSession {
  id?: string;
  type: 'focus' | 'deep' | 'break';
  userId: string;
  taskId?: string;
  goalId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Sync fields
  syncedToBackend?: boolean;
  backendId?: string;
  
  // Break-specific fields
  isHavingFun?: boolean;
  activities?: string[];
  persons?: string[];
  location?: string;
  weather?: string;
  mood?: string;
  energyLevel?: string;
  productivityLevel?: string;
}
```

## API Endpoints

### Create Timer Session
```http
POST /timer-sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "focus",
  "taskId": "task_123",
  "goalId": "goal_456",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T10:25:00Z",
  "duration": 1500,
  "completed": true,
  "notes": "Deep work session"
}
```

### Get Timer Sessions
```http
GET /timer-sessions?taskId=task_123&completed=true&startDate=2024-01-01
Authorization: Bearer <token>
```

### Update Timer Session
```http
PUT /timer-sessions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "duration": 1800,
  "completed": true,
  "notes": "Updated session notes"
}
```

### Delete Timer Session
```http
DELETE /timer-sessions/:id
Authorization: Bearer <token>
```

### Get Focus Statistics
```http
GET /stats/focus?days=7
Authorization: Bearer <token>
```

## Sync Functions

### `syncTimerSessionsToBackend()`
- Finds all local sessions with `syncedToBackend: false`
- Sends them to the backend API
- Updates local sessions with `syncedToBackend: true` and `backendId`
- Returns sync result with success status and error details

### `loadTimerSessionsFromBackend()`
- Fetches all sessions from backend
- Compares with local sessions using `backendId`
- Adds new sessions from backend to local storage
- Updates local sessions if backend is more recent
- Returns load result with processed count and errors

### `updateTimerSessionInBackend(sessionId, updates)`
- Updates a specific session in the backend
- Requires the session to have a `backendId`
- Returns success/failure status

### `deleteTimerSessionFromBackend(sessionId)`
- Deletes a session from the backend
- Requires the session to have a `backendId`
- Returns success/failure status

## Usage in Components

### TimerDeepFocus Component
```typescript
const handleStop = async () => {
  logClickedEvent('timer_deep_focus_end');
  setIsRunning(false);
  await stopTimeFocus(true, taskId, Number(goalId), elapsedSeconds);
  
  // Sync to backend
  try {
    await syncTimerSessionsToBackend();
  } catch (error) {
    console.error('Failed to sync timer session to backend:', error);
  }
};
```

### TimerGoals Component
```typescript
const handleStop = async () => {
  logClickedEvent('timer_goals_end');
  await stopTimer();
  
  // Sync to backend
  try {
    await syncTimerSessionsToBackend();
  } catch (error) {
    console.error('Failed to sync timer session to backend:', error);
  }
};
```

### TimerBreak Component
```typescript
const handleStop = async () => {
  logClickedEvent('timer_break_end');
  setIsRunning(false);
  
  // Update local session
  if (breakSessionId !== null) {
    await dbUtils.updateSession(breakSessionId, {
      endTime: new Date().toISOString(),
      duration: elapsedSeconds,
      completed: true,
    });
  }
  
  // Sync to backend
  try {
    await syncTimerSessionsToBackend();
  } catch (error) {
    console.error('Failed to sync timer session to backend:', error);
  }
};
```

## Store Integration

### Timer Actions
The store includes timer sync methods:
- `syncTimerSessionsToBackend()`: Sync local sessions to backend
- `loadTimerSessionsFromBackend()`: Load sessions from backend

### Automatic Sync
Timer sessions are automatically synced when:
- A timer session is completed (stopTimeFocus, stopTimer)
- User manually triggers sync
- App initializes and user is authenticated

## Error Handling

### Network Errors
- Sync failures are logged but don't break the app
- Sessions remain in local storage for offline use
- Retry mechanism can be implemented for failed syncs

### Authentication Errors
- Sync is skipped if user is not authenticated
- No error is thrown, app continues to work offline

### Data Validation
- Invalid session data is filtered out
- Backend validation errors are logged
- Local data integrity is maintained

## Statistics and Analytics

### Local Stats
- Focus time calculations use local session data
- Real-time stats work offline
- Historical data is preserved locally

### Backend Stats
- `getFocusStatsFromBackend()` fetches aggregated stats
- Can be used to show cross-device statistics
- Falls back to local stats if backend is unavailable

## Best Practices

### Performance
- Sync in background to avoid blocking UI
- Batch sync operations when possible
- Use incremental sync to minimize data transfer

### User Experience
- Show sync status indicators
- Provide manual sync options
- Handle offline scenarios gracefully

### Data Integrity
- Validate session data before sync
- Handle conflicts consistently
- Preserve local data during sync failures

## Testing

### Sync Testing
1. Create timer sessions offline
2. Authenticate and verify sync
3. Test conflict resolution
4. Verify cross-device consistency

### Error Testing
1. Test with network failures
2. Test with authentication errors
3. Test with invalid data
4. Verify offline functionality

## Future Enhancements

### Planned Features
- Real-time sync using WebSockets
- Conflict resolution UI
- Sync progress indicators
- Bulk sync operations
- Sync scheduling and retry logic

### Performance Optimizations
- Compression for large datasets
- Incremental sync improvements
- Background sync optimization
- Cache management

## Troubleshooting

### Common Issues
1. **Sessions not syncing**: Check authentication status
2. **Duplicate sessions**: Verify backendId handling
3. **Sync failures**: Check network connectivity
4. **Data conflicts**: Review conflict resolution logic

### Debug Information
- Enable console logging for sync operations
- Check browser network tab for API calls
- Verify IndexedDB data integrity
- Monitor authentication state

## Migration Guide

### From Local-Only to Sync
1. Add sync fields to existing sessions
2. Mark all existing sessions as synced
3. Implement gradual sync for large datasets
4. Test sync functionality thoroughly

### Version Compatibility
- Ensure backward compatibility with local-only data
- Handle missing sync fields gracefully
- Provide migration scripts if needed 