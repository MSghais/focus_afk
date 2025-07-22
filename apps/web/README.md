# Focus AFK - Web Application

A comprehensive focus and productivity application built with Next.js, featuring task management, goal tracking, and focus timer functionality.

## Features

### 🎯 Task Management
- Create, edit, and delete tasks
- Set priorities (low, medium, high)
- Add categories and due dates
- Track completion status
- Estimate and track actual time spent

### 🎯 Goal Tracking
- Set long-term goals with progress tracking
- Visual progress bars
- Target dates and deadline tracking
- Category organization
- Link goals to tasks

### ⏱️ Focus Timer
- Customizable Pomodoro timer
- Break timer functionality
- Task and goal integration
- Session tracking and statistics
- Browser notifications

### 📊 Dashboard
- Overview of tasks, goals, and focus sessions
- Productivity statistics
- Recent activity tracking
- Quick action buttons
- Weekly focus charts

### ⚙️ Settings
- Timer duration preferences
- Auto-start options
- Notification settings
- Theme customization (light/dark/auto)
- Data management

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS, CSS Modules
- **Authentication**: Privy
- **UI Components**: Custom components with modern design

## Database Schema

### Tasks
```typescript
interface Task {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedMinutes?: number;
  actualMinutes?: number;
}
```

### Goals
```typescript
interface Goal {
  id?: number;
  title: string;
  description?: string;
  targetDate?: Date;
  completed: boolean;
  progress: number; // 0-100
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  relatedTasks?: number[]; // Task IDs
}
```

### Timer Sessions
```typescript
interface TimerSession {
  id?: number;
  taskId?: number;
  goalId?: number;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completed: boolean;
  notes?: string;
  createdAt: Date;
}
```

### User Settings
```typescript
interface UserSettings {
  id?: number;
  defaultFocusDuration: number; // in minutes
  defaultBreakDuration: number; // in minutes
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  updatedAt: Date;
}
```

## State Management

The application uses Zustand for state management with the following structure:

- **Tasks**: CRUD operations, filtering, statistics
- **Goals**: CRUD operations, progress tracking
- **Timer**: Session management, countdown logic
- **Settings**: User preferences, theme management
- **UI**: Navigation state, loading states

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Persistence

All data is stored locally in the browser using IndexedDB (via Dexie.js). This means:
- No server required
- Data persists between sessions
- Works offline
- Data is private and secure

## Key Components

- **Database Layer** (`lib/database.ts`): Dexie configuration and utility functions
- **Store** (`lib/store.ts`): Zustand store with all application state and actions
- **Modules**: Feature-specific components (Tasks, Goals, Timer, Dashboard, Settings)
- **Providers**: Store initialization and authentication

## Development

The application follows a modular architecture:
- Each feature has its own module in `components/modules/`
- Shared utilities in `lib/`
- Database operations abstracted through `dbUtils`
- State management centralized in Zustand store

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow the established naming conventions
4. Test database operations thoroughly
5. Ensure responsive design for mobile and desktop
