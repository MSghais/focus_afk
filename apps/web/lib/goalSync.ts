import { api } from './api';
import { Goal } from '../types';
import { isUserAuthenticated, getJwtToken } from './auth';
import { dbUtils } from './database';

export interface GoalSyncResult {
  success: boolean;
  syncedCount: number;
  errorCount: number;
  errors: string[];
}

export async function syncGoalsToBackend(): Promise<GoalSyncResult> {
  if (!isUserAuthenticated()) {
    throw new Error('User not authenticated');
  }

  const token = getJwtToken();
  if (!token) {
    throw new Error('No JWT token available');
  }

  const result: GoalSyncResult = {
    success: false,
    syncedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    // Get all local goals
    const localGoals = await dbUtils.getGoals();
    console.log(`🔄 Syncing ${localGoals.length} goals to backend...`);

    for (const goal of localGoals) {
      try {
        console.log(`🔄 Processing goal: ${goal.id || 'new'} - ${goal.title}`);

        // If goal has a string ID (from backend), try to update it
        if (goal.id && typeof goal.id === 'string') {
          try {
            console.log(`🔄 Checking if goal ${goal.id} exists in backend...`);
            await api.getGoal(goal.id);
            console.log(`🔄 Goal ${goal.id} exists, updating...`);

                         // If it exists, update it
             await api.updateGoal(goal.id, {
               title: goal.title,
               description: goal.description,
               targetDate: goal.targetDate ? goal.targetDate.toISOString() : undefined,
               completed: goal.completed,
               progress: goal.progress,
               category: goal.category,
               relatedTaskIds: (goal.relatedTasks || []).map(id => id.toString()),
             } as any);
            console.log(`✅ Goal ${goal.id} updated successfully`);
            result.syncedCount++;
          } catch (error: any) {
            if (error.message?.includes('404') || error.message?.includes('not found')) {
              console.log(`🔄 Goal ${goal.id} not found in backend, creating new...`);
              // Goal doesn't exist, create it
              const response = await api.createGoal({
                title: goal.title,
                description: goal.description,
                targetDate: goal.targetDate ? goal.targetDate.toISOString() : undefined,
                completed: goal.completed,
                progress: goal.progress,
                category: goal.category,
                relatedTaskIds: (goal.relatedTasks || []).map(id => id.toString()),
              } as any);
              
              if (response.success && response.data) {
                // Update local goal with backend ID
                await dbUtils.updateGoal(parseInt(goal.id), { id: response.data.id } as any);
                console.log(`✅ Goal created with new ID: ${response.data.id}`);
                result.syncedCount++;
              }
            } else {
              throw error;
            }
          }
        } else {
          // Goal doesn't have a backend ID, create it
          console.log(`🔄 Creating new goal: ${goal.title}`);
          const response = await api.createGoal({
            title: goal.title,
            description: goal.description,
            targetDate: goal.targetDate ? goal.targetDate.toISOString() : undefined,
            completed: goal.completed,
            progress: goal.progress,
            category: goal.category,
            relatedTaskIds: (goal.relatedTasks || []).map(id => id.toString()),
          } as any);
          
          if (response.success && response.data) {
            // Update local goal with backend ID
            const goalId = typeof goal.id === 'number' ? goal.id : 0;
            await dbUtils.updateGoal(goalId, { id: response.data.id } as any);
            console.log(`✅ Goal created with ID: ${response.data.id}`);
            result.syncedCount++;
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed to sync goal ${goal.title}:`, error);
        result.errorCount++;
        result.errors.push(`Goal "${goal.title}": ${error.message}`);
      }
    }

    console.log(`✅ Goal sync completed: ${result.syncedCount} synced, ${result.errorCount} errors`);
    result.success = result.errorCount === 0;
    
    if (result.errorCount > 0) {
      throw new Error(`${result.errorCount} goals failed to sync`);
    }
  } catch (error: any) {
    console.error('❌ Failed to sync goals to backend:', error);
    result.errors.push(`Sync failed: ${error.message}`);
    throw error;
  }

  return result;
}

export async function loadGoalsFromBackend(): Promise<Goal[]> {
  if (!isUserAuthenticated()) {
    console.log('⚠️ Not authenticated, skipping backend goal load');
    return [];
  }

  try {
    const response = await api.getGoals();
    if (response.success && Array.isArray(response.data)) {
      // Convert API goal dates to Date objects for consistency
      const apiGoals = response.data.map((g: any) => ({
        ...g,
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
        createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
        updatedAt: g.updatedAt ? new Date(g.updatedAt) : new Date(),
        relatedTasks: g.relatedTaskIds || g.relatedTasks || [],
      }));
      
      console.log(`✅ Loaded ${apiGoals.length} goals from backend`);
      return apiGoals;
    }
  } catch (error) {
    console.error('❌ Failed to load goals from backend:', error);
  }
  
  return [];
}

export async function mergeGoalsFromLocalAndBackend(): Promise<Goal[]> {
  try {
    // Load local goals
    const localGoals = await dbUtils.getGoals();
    console.log(`📱 Loaded ${localGoals.length} local goals`);

    // Load backend goals if authenticated
    let backendGoals: Goal[] = [];
    if (isUserAuthenticated()) {
      backendGoals = await loadGoalsFromBackend();
      console.log(`☁️ Loaded ${backendGoals.length} backend goals`);
    }

    // Merge goals, preferring backend versions for conflicts
    const mergedGoals: Goal[] = [];
    const seenIds = new Set<string>();

    // Add backend goals first (preferred)
    for (const goal of backendGoals) {
      if (goal.id) {
        const idStr = goal.id.toString();
        seenIds.add(idStr);
        mergedGoals.push(goal);
      }
    }

    // Add local goals that don't exist in backend
    for (const goal of localGoals) {
      if (goal.id) {
        const idStr = goal.id.toString();
        if (!seenIds.has(idStr)) {
          mergedGoals.push(goal);
          seenIds.add(idStr);
        }
      } else {
        // Local goal without ID, add it
        mergedGoals.push(goal);
      }
    }

    console.log(`🔄 Merged ${mergedGoals.length} total goals`);
    return mergedGoals;
  } catch (error) {
    console.error('❌ Failed to merge goals:', error);
    // Fallback to local goals only
    return await dbUtils.getGoals();
  }
} 