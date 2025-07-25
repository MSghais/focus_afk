# Timer Sync System Guide

## Overview

The timer sync system provides seamless synchronization between local IndexedDB storage and the backend database, ensuring your focus sessions are available across all devices while maintaining offline functionality.

## Features

- **Offline-First**: All timer sessions are stored locally in IndexedDB
- **Automatic Sync**: Sessions sync to backend when online and authenticated
- **Duplicate Detection**: Intelligent merging prevents duplicate sessions
- **Conflict Resolution**: Backend data takes precedence in conflicts
- **Real-time Status**: Visual indicators show sync status for each session

## Architecture

### Data Flow

```
Local Timer Session Created
           ↓
    Stored in IndexedDB
           ↓
    Marked as unsynced
           ↓
    Sync to Backend (when online)
           ↓
    Marked as synced + backendId
```

### Merge Strategy

1. **Backend Priority**: Backend sessions take precedence over local duplicates
2. **Unique Identification**: Sessions identified by `backendId` or `local_${id}`
3. **Duplicate Removal**: Local sessions with backend equivalents are skipped
4. **Conflict Resolution**: Most recent data wins in case of conflicts

## API Functions

### Core Sync Functions

#### `mergeTimerSessionsFromLocalAndBackend()`
Merges timer sessions from local and backend storage, removing duplicates.

```typescript
const result = await mergeTimerSessionsFromLocalAndBackend();
// Returns: { sessions, localCount, backendCount, mergedCount, duplicatesRemoved }
```

#### `syncTimerSessionsToBackend()`
Syncs unsynced local sessions to the backend.

```typescript
const result = await syncTimerSessionsToBackend();
// Returns: { success, syncedSessions, errors }
```

#### `loadTimerSessionsFromBackend()`
Loads sessions from backend and merges with local data.

```typescript
const result = await loadTimerSessionsFromBackend();
// Returns: { success, syncedSessions, errors }
```

### Store Actions

#### `store.mergeTimerSessionsFromLocalAndBackend()`
Store action that merges sessions and updates the store state.

#### `store.syncTimerSessionsToBackend()`
Store action that syncs local sessions to backend.

#### `store.loadTimerSessionsFromBackend()`
Store action that loads sessions from backend.

## Usage Examples

### Basic Usage

```typescript
import { useFocusAFKStore } from '../store/store';

const { mergeTimerSessionsFromLocalAndBackend } = useFocusAFKStore();

// Merge sessions on app initialization
useEffect(() => {
  mergeTimerSessionsFromLocalAndBackend();
}, []);
```

### Manual Sync

```typescript
const handleManualSync = async () => {
  try {
    const result = await mergeTimerSessionsFromLocalAndBackend();
    console.log(`Merged ${result.mergedCount} sessions`);
    console.log(`Removed ${result.duplicatesRemoved} duplicates`);
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

### Sync After Timer Completion

```typescript
const handleTimerStop = async () => {
  // Stop timer logic...
  
  // Sync to backend
  try {
    await syncTimerSessionsToBackend();
  } catch (error) {
    console.error('Failed to sync timer session:', error);
  }
};
```

## Data Models

### TimerSession Interface

```typescript
interface TimerSession {
  id: string | number;
  userId: string;
  taskId?: string;
  goalId?: string;
  type: 'focus' | 'break' | 'deep';
  startTime: string;
  endTime?: string;
  duration: number;
  completed: boolean;
  notes?: string[];
  syncedToBackend?: boolean;  // Sync status
  backendId?: string;         // Backend session ID
  createdAt?: string;
  updatedAt?: string;
}
```

### Sync Result Interface

```typescript
interface MergedTimerSessionsResult {
  sessions: TimerSession[];
  localCount: number;
  backendCount: number;
  mergedCount: number;
  duplicatesRemoved: number;
}
```

## UI Components

### Dashboard Sync Status

The dashboard shows sync status with:
- Online/Offline indicator
- Last sync time
- Error messages
- Merge statistics
- Manual sync buttons

### Session List with Sync Indicators

Each session shows:
- Sync status (☁️ Synced / 📱 Local)
- Session type and duration
- Completion status
- Associated task/goal

## Error Handling

### Common Errors

1. **Authentication Required**
   ```typescript
   if (!isUserAuthenticated()) {
     console.warn('User not authenticated, skipping sync');
     return;
   }
   ```

2. **Network Errors**
   ```typescript
   try {
     await syncTimerSessionsToBackend();
   } catch (error) {
     console.error('Network error during sync:', error);
     // Continue with local-only mode
   }
   ```

3. **Duplicate Conflicts**
   ```typescript
   // Handled automatically by merge function
   // Backend sessions take precedence
   ```

### Fallback Strategy

1. **Offline Mode**: App continues working with local data
2. **Sync Retry**: Failed syncs are retried on next sync attempt
3. **Graceful Degradation**: UI shows sync status but doesn't block functionality

## Testing

### Test Scenarios

1. **Create timer session offline**
   - Session should be stored locally
   - Should sync when online

2. **Create duplicate sessions**
   - Merge should remove duplicates
   - Backend should take precedence

3. **Network interruption**
   - App should continue working locally
   - Sync should resume when online

4. **Authentication changes**
   - Sync should work with valid auth
   - Should gracefully handle auth errors

### Debug Endpoints

```typescript
// Check user authentication status
const debugResult = await api.debugUser();
console.log('User exists:', debugResult.data.userExists);
```

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**: Multiple sessions synced in sequence
2. **Incremental Sync**: Only unsynced sessions are processed
3. **Efficient Merging**: Map-based lookup for duplicate detection
4. **Lazy Loading**: Sessions loaded on demand

### Memory Management

1. **Session Limits**: Large session lists are paginated
2. **Cleanup**: Old sessions can be archived
3. **Indexing**: Efficient database queries with proper indexes

## Troubleshooting

### Common Issues

1. **Sessions not syncing**
   - Check authentication status
   - Verify network connectivity
   - Check backend endpoint availability

2. **Duplicate sessions**
   - Run manual merge to clean up
   - Check sync status indicators
   - Verify backendId assignments

3. **Sync errors**
   - Check browser console for error details
   - Verify backend API responses
   - Check authentication token validity

### Debug Commands

```typescript
// Check sync status
const sessions = await dbUtils.getSessions();
const unsynced = sessions.filter(s => !s.syncedToBackend);
console.log('Unsynced sessions:', unsynced.length);

// Force sync
await syncTimerSessionsToBackend();

// Check merge results
const result = await mergeTimerSessionsFromLocalAndBackend();
console.log('Merge stats:', result);
```

## Future Enhancements

1. **Real-time Sync**: WebSocket-based live synchronization
2. **Conflict Resolution UI**: User choice for conflict resolution
3. **Sync History**: Track sync operations and results
4. **Advanced Filtering**: Filter sessions by sync status
5. **Bulk Operations**: Batch sync operations for better performance 