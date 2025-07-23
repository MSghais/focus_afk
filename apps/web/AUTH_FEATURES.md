# JWT Authentication & Task Backup Features

## Overview

This document describes the new JWT authentication persistence and task backup functionality that has been implemented in the Focus AFK application.

## Features Implemented

### 1. JWT Token Persistence

**Problem**: Users had to re-authenticate every time they refreshed the page or reopened the browser.

**Solution**: JWT tokens are now automatically persisted in localStorage and restored on app startup.

#### Key Components:

- **`apps/web/lib/auth.ts`**: Centralized auth utilities for localStorage management
- **`apps/web/store/auth.ts`**: Enhanced auth store with initialization and logout functions
- **`apps/web/providers/StoreProvider.tsx`**: Automatically initializes auth state on app startup

#### How it works:

1. When a user logs in, JWT token and user data are saved to localStorage
2. On app startup, the auth state is automatically restored from localStorage
3. If the token is valid, the user remains authenticated without needing to login again
4. Logout properly clears all localStorage data

### 2. Enhanced Task Backup to Backend

**Problem**: Tasks were only stored locally, with no backup to the backend even when users were authenticated.

**Solution**: Tasks are now automatically synced to the backend when users are authenticated with a valid JWT.

#### Key Components:

- **Enhanced `apps/web/store/store.ts`**: Task operations now include backend sync
- **Updated `apps/web/lib/api.ts`**: Improved JWT token handling
- **Enhanced `apps/web/components/modules/tasks/index.tsx`**: Added manual sync button

#### How it works:

1. **Automatic Sync**: When users add, update, or delete tasks, they're automatically synced to the backend if authenticated
2. **Manual Sync**: Users can manually sync all local tasks to the backend using the "Sync to Backend" button
3. **Error Handling**: Failed syncs are logged but don't prevent local operations
4. **Authentication Check**: All backend operations verify JWT token validity

### 3. Improved API Service

**Problem**: Inconsistent JWT token handling across the application.

**Solution**: Centralized JWT token management with fallback to localStorage.

#### Key Features:

- **Automatic Token Retrieval**: API service automatically gets JWT tokens from auth store or localStorage
- **Consistent Authentication**: All API calls use the same authentication mechanism
- **Error Handling**: Proper 401 error handling for expired/invalid tokens

## Usage

### For Users

1. **Login**: Use the wallet login in the profile section
2. **Automatic Persistence**: Your session will persist across browser refreshes
3. **Task Backup**: Tasks are automatically backed up to the backend when you're logged in
4. **Manual Sync**: Use the "Sync to Backend" button in the tasks page to manually sync all tasks
5. **Logout**: Use the logout button to clear your session and localStorage

### For Developers

#### Checking Authentication Status

```typescript
import { isUserAuthenticated, getJwtToken } from '../lib/auth';

// Check if user is authenticated
if (isUserAuthenticated()) {
  // User is logged in
}

// Get JWT token
const token = getJwtToken();
```

#### Making Authenticated API Calls

```typescript
import { api } from '../lib/api';

// API calls automatically include JWT token if available
const response = await api.createTask(taskData);
```

#### Adding Backend Sync to New Features

```typescript
// In your store actions
const addNewItem = async (item) => {
  // Always save locally
  await dbUtils.addItem(item);
  
  // Sync to backend if authenticated
  if (isUserAuthenticated()) {
    try {
      const token = getJwtToken();
      if (token) {
        await api.createItem(item);
        console.log('✅ Item synced to backend');
      }
    } catch (err) {
      console.error('❌ Failed to sync item to backend:', err);
    }
  }
};
```

## Technical Details

### localStorage Keys

The following keys are used for auth persistence:

- `token`: JWT token
- `user`: User object (JSON stringified)
- `evmAddress`: User's EVM address
- `starknetAddress`: User's Starknet address
- `loginType`: Login type ("ethereum" or "starknet")
- `isAuthenticated`: Authentication status

### Error Handling

- **Invalid Tokens**: 401 errors trigger automatic logout
- **Network Errors**: Failed backend syncs don't prevent local operations
- **Corrupted localStorage**: Automatically cleared and user prompted to login again

### Security Considerations

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Tokens are automatically included in API requests
- Logout properly clears all stored data
- No sensitive data is logged to console

## Testing

Use the AuthDebug component in the mentor module to test:

1. Authentication status
2. JWT token availability
3. localStorage persistence
4. API connectivity

## Future Improvements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Offline Sync**: Queue failed syncs and retry when online
3. **Conflict Resolution**: Handle conflicts between local and backend data
4. **Encrypted Storage**: Encrypt sensitive data in localStorage
5. **Session Management**: Track multiple sessions and devices 