# Timer Sync Test Guide

This guide provides step-by-step instructions to test the timer sync functionality between local storage and the backend.

## Prerequisites

1. Backend server is running on `http://localhost:5000`
2. User is authenticated (has valid JWT token)
3. Frontend app is running on `http://localhost:3000`

## Test Scenarios

### Test 1: Basic Timer Session Creation and Sync

#### Steps:
1. **Start a timer session**
   - Go to the Timer page
   - Select "Deep Focus" mode
   - Click "Start Focus Session"
   - Let it run for 30 seconds
   - Click "End Session"

2. **Verify local storage**
   - Open browser DevTools
   - Go to Application > IndexedDB > FocusAFKDatabase
   - Check `timerSessions` table
   - Verify session exists with `syncedToBackend: false`

3. **Check sync status**
   - Go to Dashboard
   - Look for "Data Sync" section
   - Verify "Online" status is shown
   - Click "Sync Up" button

4. **Verify backend sync**
   - Check browser Network tab
   - Look for POST request to `/timer-sessions`
   - Verify request includes session data
   - Check response for success

5. **Verify local update**
   - Check IndexedDB again
   - Verify session now has `syncedToBackend: true`
   - Verify `backendId` is set

### Test 2: Multiple Sessions Sync

#### Steps:
1. **Create multiple sessions**
   - Create 3-4 timer sessions (mix of focus, deep, break)
   - Don't sync yet

2. **Bulk sync**
   - Go to Dashboard
   - Click "Sync Up"
   - Verify all sessions are synced

3. **Check backend**
   - Use API client (Postman/curl) to GET `/timer-sessions`
   - Verify all sessions are present

### Test 3: Cross-Device Sync

#### Steps:
1. **Create sessions on Device A**
   - Use one browser/device
   - Create 2-3 timer sessions
   - Sync to backend

2. **Load on Device B**
   - Use different browser/device
   - Login with same account
   - Go to Dashboard
   - Click "Sync Down"
   - Verify sessions appear

3. **Verify consistency**
   - Check that session data is identical
   - Verify stats are consistent

### Test 4: Offline Functionality

#### Steps:
1. **Go offline**
   - Disconnect internet
   - Create timer session
   - Verify it saves locally

2. **Go online and sync**
   - Reconnect internet
   - Click "Sync Up"
   - Verify session syncs successfully

### Test 5: Conflict Resolution

#### Steps:
1. **Create session on Device A**
   - Create session and sync

2. **Modify on Device B**
   - Load session on Device B
   - Modify session (add notes, change duration)
   - Sync from Device B

3. **Check Device A**
   - Sync down on Device A
   - Verify changes from Device B appear

### Test 6: Error Handling

#### Steps:
1. **Test authentication error**
   - Clear JWT token
   - Try to sync
   - Verify graceful error handling

2. **Test network error**
   - Disconnect internet
   - Try to sync
   - Verify error message appears

3. **Test invalid data**
   - Manually corrupt session data in IndexedDB
   - Try to sync
   - Verify validation errors

## API Testing

### Test Timer Session Creation

```bash
curl -X POST http://localhost:5000/timer-sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "focus",
    "taskId": "task_123",
    "goalId": "goal_456",
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-01T10:25:00Z",
    "duration": 1500,
    "completed": true,
    "notes": "Test session"
  }'
```

### Test Timer Session Retrieval

```bash
curl -X GET "http://localhost:5000/timer-sessions?completed=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Focus Statistics

```bash
curl -X GET "http://localhost:5000/stats/focus?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Verification

### Check Local IndexedDB

```javascript
// In browser console
const db = new Dexie('FocusAFKDatabase');
db.open().then(() => {
  return db.timerSessions.toArray();
}).then(sessions => {
  console.log('Local sessions:', sessions);
});
```

### Check Backend Database

```sql
-- Connect to your backend database
SELECT * FROM "TimerSession" WHERE "userId" = 'your_user_id' ORDER BY "createdAt" DESC;
```

## Expected Results

### Successful Sync
- ✅ Sessions appear in backend database
- ✅ Local sessions marked as synced
- ✅ No duplicate sessions
- ✅ Stats calculated correctly
- ✅ Cross-device consistency

### Error Scenarios
- ✅ Graceful error handling
- ✅ Local data preserved
- ✅ User-friendly error messages
- ✅ Retry functionality works

## Performance Testing

### Large Dataset Test
1. Create 100+ timer sessions
2. Measure sync time
3. Verify all sessions sync correctly
4. Check memory usage

### Concurrent Sync Test
1. Open multiple browser tabs
2. Create sessions simultaneously
3. Sync from different tabs
4. Verify no conflicts or duplicates

## Debug Information

### Enable Debug Logging
```javascript
// In browser console
localStorage.setItem('debug', 'timer-sync:*');
```

### Check Network Requests
- Open DevTools > Network tab
- Filter by "timer-sessions"
- Monitor request/response data

### Verify Authentication
```javascript
// In browser console
console.log('JWT Token:', localStorage.getItem('jwt_token'));
console.log('Is Authenticated:', isUserAuthenticated());
```

## Common Issues and Solutions

### Issue: Sessions not syncing
**Solution**: Check authentication status and JWT token

### Issue: Duplicate sessions
**Solution**: Verify backendId handling and conflict resolution

### Issue: Sync errors
**Solution**: Check network connectivity and backend status

### Issue: Stats inconsistency
**Solution**: Verify session data integrity and calculation logic

## Test Completion Checklist

- [ ] Basic timer session creation and sync
- [ ] Multiple sessions bulk sync
- [ ] Cross-device sync functionality
- [ ] Offline functionality
- [ ] Conflict resolution
- [ ] Error handling
- [ ] API endpoint testing
- [ ] Database verification
- [ ] Performance testing
- [ ] Debug information collection

## Reporting Issues

When reporting issues, include:
1. Test scenario that failed
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser console logs
5. Network request/response data
6. Database state (local and backend) 