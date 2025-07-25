import { api } from './api';
import { dbUtils } from './database';
import { TimerSession } from '../types';
import { isUserAuthenticated, getJwtToken } from './auth';

export interface TimerSyncResult {
  success: boolean;
  syncedSessions: number;
  errors: string[];
}

/**
 * Sync local timer sessions to backend
 */
export async function syncTimerSessionsToBackend(): Promise<TimerSyncResult> {
  const result: TimerSyncResult = {
    success: false,
    syncedSessions: 0,
    errors: [],
  };

  if (!isUserAuthenticated()) {
    result.errors.push('User not authenticated');
    return result;
  }

  try {
    const token = getJwtToken();
    if (!token) {
      result.errors.push('No authentication token available');
      return result;
    }

    // Get all local sessions that haven't been synced
    const localSessions = await dbUtils.getSessions();
    const unsyncedSessions = localSessions.filter(session => !session.syncedToBackend);

    console.log(`🔄 Syncing ${unsyncedSessions.length} timer sessions to backend`);

    for (const session of unsyncedSessions) {
      try {
        const sessionData = {
          taskId: session.taskId,
          goalId: session.goalId,
          type: session.type as 'focus' | 'break' | 'deep',
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          completed: session.completed,
          notes: session.notes,
        };

        const response = await api.createTimerSession(sessionData);
        
        if (response.success && response.data) {
          // Mark as synced in local DB
          const sessionId = typeof session.id === 'string' ? parseInt(session.id) : session.id;
          await dbUtils.updateSession(sessionId!, {
            syncedToBackend: true,
            backendId: response.data.id,
          });
          result.syncedSessions++;
          console.log(`✅ Synced timer session ${session.id} to backend`);
        } else {
          result.errors.push(`Failed to sync session ${session.id}: ${response.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error syncing session ${session.id}: ${errorMessage}`);
        console.error(`❌ Failed to sync timer session ${session.id}:`, error);
      }
    }

    result.success = result.errors.length === 0;
    console.log(`🔄 Timer sync completed: ${result.syncedSessions} sessions synced, ${result.errors.length} errors`);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Sync failed: ${errorMessage}`);
    console.error('❌ Timer sync failed:', error);
    return result;
  }
}

/**
 * Load timer sessions from backend and merge with local data
 */
export async function loadTimerSessionsFromBackend(): Promise<TimerSyncResult> {
  const result: TimerSyncResult = {
    success: false,
    syncedSessions: 0,
    errors: [],
  };

  if (!isUserAuthenticated()) {
    result.errors.push('User not authenticated');
    return result;
  }

  try {
    const token = getJwtToken();
    if (!token) {
      result.errors.push('No authentication token available');
      return result;
    }

    // Get sessions from backend
    const response = await api.getTimerSessions();
    
    if (response.success && response.data) {
      const backendSessions = response.data;
      console.log(`🔄 Loading ${backendSessions.length} timer sessions from backend`);

      // Get local sessions
      const localSessions = await dbUtils.getSessions();
      
      // Create a map of local sessions by backend ID for quick lookup
      const localSessionsByBackendId = new Map<string, TimerSession>();
      localSessions.forEach(session => {
        if (session.backendId) {
          localSessionsByBackendId.set(session.backendId, session);
        }
      });

      for (const backendSession of backendSessions) {
        try {
          const existingLocal = localSessionsByBackendId.get(backendSession.id!);
          
          if (!existingLocal) {
                         // This session doesn't exist locally, add it
             const sessionData = {
               userId: backendSession.userId || '',
               taskId: backendSession.taskId,
               goalId: backendSession.goalId,
               type: backendSession.type,
               startTime: backendSession.startTime,
               endTime: backendSession.endTime,
               duration: backendSession.duration,
               completed: backendSession.completed,
               notes: backendSession.notes,
               syncedToBackend: true,
               backendId: backendSession.id,
             };

             await dbUtils.addSession(sessionData);
            result.syncedSessions++;
            console.log(`✅ Added backend session ${backendSession.id} to local DB`);
          } else {
                         // Session exists locally, check if backend is more recent
             const backendUpdated = new Date(backendSession.updatedAt || backendSession.createdAt);
             const localUpdated = new Date(existingLocal.updatedAt || existingLocal.createdAt);
             
             if (backendUpdated > localUpdated) {
               // Backend is more recent, update local
               const sessionId = typeof existingLocal.id === 'string' ? parseInt(existingLocal.id) : existingLocal.id;
               await dbUtils.updateSession(sessionId!, {
                taskId: backendSession.taskId,
                goalId: backendSession.goalId,
                type: backendSession.type,
                startTime: backendSession.startTime,
                endTime: backendSession.endTime,
                duration: backendSession.duration,
                completed: backendSession.completed,
                notes: backendSession.notes,
                syncedToBackend: true,
              });
              result.syncedSessions++;
              console.log(`✅ Updated local session ${existingLocal.id} from backend`);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Error processing backend session ${backendSession.id}: ${errorMessage}`);
          console.error(`❌ Failed to process backend session ${backendSession.id}:`, error);
        }
      }

      result.success = result.errors.length === 0;
      console.log(`🔄 Timer load completed: ${result.syncedSessions} sessions processed, ${result.errors.length} errors`);
    } else {
      result.errors.push(`Failed to load sessions from backend: ${response.error || 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Load failed: ${errorMessage}`);
    console.error('❌ Timer load failed:', error);
    return result;
  }
}

/**
 * Update a timer session in the backend
 */
export async function updateTimerSessionInBackend(sessionId: number, updates: Partial<TimerSession>): Promise<boolean> {
  if (!isUserAuthenticated()) {
    console.warn('⚠️ User not authenticated, skipping backend update');
    return false;
  }

  try {
    const token = getJwtToken();
    if (!token) {
      console.warn('⚠️ No authentication token available, skipping backend update');
      return false;
    }

    // Get the session to find its backend ID
    const session = await dbUtils.getSession(sessionId);
    if (!session || !session.backendId) {
      console.warn(`⚠️ Session ${sessionId} not found or not synced to backend`);
      return false;
    }

    const response = await api.updateTimerSession(session.backendId, updates);
    
    if (response.success) {
      console.log(`✅ Updated timer session ${sessionId} in backend`);
      return true;
    } else {
      console.error(`❌ Failed to update timer session ${sessionId} in backend:`, response.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating timer session ${sessionId} in backend:`, error);
    return false;
  }
}

/**
 * Delete a timer session from the backend
 */
export async function deleteTimerSessionFromBackend(sessionId: number): Promise<boolean> {
  if (!isUserAuthenticated()) {
    console.warn('⚠️ User not authenticated, skipping backend delete');
    return false;
  }

  try {
    const token = getJwtToken();
    if (!token) {
      console.warn('⚠️ No authentication token available, skipping backend delete');
      return false;
    }

    // Get the session to find its backend ID
    const session = await dbUtils.getSession(sessionId);
    if (!session || !session.backendId) {
      console.warn(`⚠️ Session ${sessionId} not found or not synced to backend`);
      return false;
    }

    const response = await api.deleteTimerSession(session.backendId);
    
    if (response.success) {
      console.log(`✅ Deleted timer session ${sessionId} from backend`);
      return true;
    } else {
      console.error(`❌ Failed to delete timer session ${sessionId} from backend:`, response.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting timer session ${sessionId} from backend:`, error);
    return false;
  }
}

/**
 * Get focus statistics from backend
 */
export async function getFocusStatsFromBackend(days: number = 7): Promise<{
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  sessionsByDay: { date: string; sessions: number; minutes: number }[];
} | null> {
  if (!isUserAuthenticated()) {
    console.warn('⚠️ User not authenticated, cannot get stats from backend');
    return null;
  }

  try {
    const response = await api.getFocusStats(days);
    
    if (response.success && response.data) {
      console.log(`✅ Retrieved focus stats from backend for ${days} days`);
      return response.data;
    } else {
      console.error(`❌ Failed to get focus stats from backend:`, response.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting focus stats from backend:', error);
    return null;
  }
} 