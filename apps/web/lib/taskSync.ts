import { api } from './api';
import { Task } from '../types';
import { isUserAuthenticated, getJwtToken } from './auth';
import { dbUtils } from './database';

export interface TaskSyncResult {
  success: boolean;
  syncedCount: number;
  errorCount: number;
  errors: string[];
}

export async function syncTasksToBackend(): Promise<TaskSyncResult> {
  if (!isUserAuthenticated()) {
    throw new Error('User not authenticated');
  }

  const token = getJwtToken();
  if (!token) {
    throw new Error('No JWT token available');
  }

  const result: TaskSyncResult = {
    success: false,
    syncedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    // Get all local tasks
    const localTasks = await dbUtils.getTasks();
    console.log(`🔄 Syncing ${localTasks.length} tasks to backend...`);

    for (const task of localTasks) {
      try {
        console.log(`🔄 Processing task: ${task.id || 'new'} - ${task.title}`);

        // If task has a string ID (from backend), try to update it
        if (task.id && typeof task.id === 'string') {
          try {
            console.log(`🔄 Checking if task ${task.id} exists in backend...`);
            await api.getTask(task.id);
            console.log(`🔄 Task ${task.id} exists, updating...`);

                         // If it exists, update it
             await api.updateTask(task.id, {
               title: task.title,
               description: task.description,
               priority: task.priority,
               category: task.category,
               completed: task.completed,
               dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
               estimatedMinutes: task.estimatedMinutes,
             } as any);
            console.log(`✅ Task ${task.id} updated successfully`);
            result.syncedCount++;
          } catch (error: any) {
            if (error.message?.includes('404') || error.message?.includes('not found')) {
              console.log(`🔄 Task ${task.id} not found in backend, creating new...`);
                             // Task doesn't exist, create it
               const response = await api.createTask({
                 title: task.title,
                 description: task.description,
                 priority: task.priority,
                 category: task.category,
                 completed: task.completed,
                 dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
                 estimatedMinutes: task.estimatedMinutes,
               } as any);
               
               if (response.success && response.data) {
                 // Update local task with backend ID
                 await dbUtils.updateTask(parseInt(task.id), { id: response.data.id } as any);
                 console.log(`✅ Task created with new ID: ${response.data.id}`);
                 result.syncedCount++;
               }
            } else {
              throw error;
            }
          }
        } else {
                     // Task doesn't have a backend ID, create it
           console.log(`🔄 Creating new task: ${task.title}`);
           const response = await api.createTask({
             title: task.title,
             description: task.description,
             priority: task.priority,
             category: task.category,
             completed: task.completed,
             dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
             estimatedMinutes: task.estimatedMinutes,
           } as any);
           
           if (response.success && response.data) {
             // Update local task with backend ID
             const taskId = typeof task.id === 'number' ? task.id : 0;
             await dbUtils.updateTask(taskId, { id: response.data.id } as any);
             console.log(`✅ Task created with ID: ${response.data.id}`);
             result.syncedCount++;
           }
        }
      } catch (error: any) {
        console.error(`❌ Failed to sync task ${task.title}:`, error);
        result.errorCount++;
        result.errors.push(`Task "${task.title}": ${error.message}`);
      }
    }

    console.log(`✅ Task sync completed: ${result.syncedCount} synced, ${result.errorCount} errors`);
    result.success = result.errorCount === 0;
    
    if (result.errorCount > 0) {
      throw new Error(`${result.errorCount} tasks failed to sync`);
    }
  } catch (error: any) {
    console.error('❌ Failed to sync tasks to backend:', error);
    result.errors.push(`Sync failed: ${error.message}`);
    throw error;
  }

  return result;
}

export async function loadTasksFromBackend(): Promise<Task[]> {
  if (!isUserAuthenticated()) {
    console.log('⚠️ Not authenticated, skipping backend task load');
    return [];
  }

  try {
    const response = await api.getTasks();
    if (response.success && Array.isArray(response.data)) {
      // Convert API task dates to Date objects for consistency
      const apiTasks = response.data.map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      }));
      
      console.log(`✅ Loaded ${apiTasks.length} tasks from backend`);
      return apiTasks;
    }
  } catch (error) {
    console.error('❌ Failed to load tasks from backend:', error);
  }
  
  return [];
} 