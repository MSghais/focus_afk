# Focus AFK Backend - Enhanced

This enhanced backend provides a complete API for the Focus AFK application with user authentication, session management, and all core features.

## Features

### Authentication & Sessions
- **JWT-based authentication** with access and refresh tokens
- **Session management** with user agent and IP tracking
- **Multiple login methods**: EVM (Ethereum) and StarkNet signature verification
- **Session revocation** (single session or all sessions)
- **Automatic token refresh**

### Core Models
- **User**: Enhanced user model with blockchain addresses
- **Session**: JWT session management
- **Task**: User tasks with priorities, categories, and time tracking
- **Goal**: User goals with progress tracking
- **TimerSession**: General timer sessions
- **TimerFocusSession**: Focus-specific timer sessions
- **TimerBreakSession**: Break sessions with detailed tracking
- **UserSettings**: User preferences and settings

### API Endpoints

#### Authentication
- `POST /auth/evm-login` - Login with Ethereum signature
- `POST /auth/starknet-login` - Login with StarkNet signature
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Logout from current session
- `POST /auth/logout-all` - Logout from all sessions
- `GET /auth/sessions` - Get active sessions
- `GET /auth/me` - Get user profile

#### Tasks
- `POST /focus/tasks` - Create task
- `GET /focus/tasks` - Get tasks (with filters)
- `GET /focus/tasks/:id` - Get specific task
- `PUT /focus/tasks/:id` - Update task
- `DELETE /focus/tasks/:id` - Delete task

#### Goals
- `POST /focus/goals` - Create goal
- `GET /focus/goals` - Get goals (with filters)
- `PUT /focus/goals/:id` - Update goal

#### Timer Sessions
- `POST /focus/timer-sessions` - Create timer session
- `GET /focus/timer-sessions` - Get timer sessions (with filters)
- `POST /focus/timer-break-sessions` - Create break session

#### Settings
- `GET /focus/settings` - Get user settings
- `PUT /focus/settings` - Update user settings

#### Statistics
- `GET /focus/stats/tasks` - Get task statistics
- `GET /focus/stats/focus` - Get focus session statistics

## Database Schema

### Key Relationships
- All models are linked to `User` via `userId`
- `TimerSession` and `TimerFocusSession` can be linked to `Task` and `Goal`
- `UserSettings` has a one-to-one relationship with `User`

### Data Types
- **Timestamps**: All models include `createdAt` and `updatedAt`
- **Arrays**: PostgreSQL arrays for `relatedTaskIds`, `activities`, `persons`
- **Enums**: Priority levels, themes, etc.
- **JSON**: Metadata fields for extensibility

## Security Features

### JWT Implementation
- **Access tokens**: 15-minute expiration
- **Refresh tokens**: 7-day expiration
- **Session tracking**: User agent and IP address logging
- **Token rotation**: New access tokens on refresh

### Signature Verification
- **Ethereum**: Using ethers.js for EIP-191 signature verification
- **StarkNet**: Using starknet.js for signature verification

## Environment Variables

```env
BACKEND_DATABASE_URL=postgresql://user:password@localhost:5432/focus_afk
JWT_SECRET=your-super-secret-jwt-key
```

## Frontend Integration

The frontend can now use the `apiService` to communicate with the backend:

```typescript
import { apiService } from '@/lib/api';

// Login
const result = await apiService.evmLogin(address, signature, message);

// Create task
const task = await apiService.createTask({
  title: 'My Task',
  priority: 'high',
  category: 'work'
});

// Get tasks
const tasks = await apiService.getTasks({ completed: false });
```

## Migration

To apply the database changes:

1. Update the Prisma schema
2. Generate the migration:
   ```bash
   npx prisma migrate dev --name add_focus_models
   ```
3. Apply the migration:
   ```bash
   npx prisma migrate deploy
   ```

## Development

### Running the Backend
```bash
cd apps/backend
npm install
npm run dev
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Reset database (development)
npx prisma migrate reset

# View database
npx prisma studio
```

## API Response Format

All API responses follow this format:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Error Handling

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

## Future Enhancements

- Real-time updates with WebSocket
- File upload for task attachments
- Advanced analytics and reporting
- Team collaboration features
- Mobile app API endpoints 