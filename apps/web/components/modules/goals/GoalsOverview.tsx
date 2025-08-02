'use client';
import { useEffect, useState } from 'react';
import GoalList from './GoalList';
import GoalCreate, { Task as CreateTask } from './GoalCreate';
import { useFocusAFKStore } from '../../../store/store';
import { ButtonPrimary } from '../../small/buttons';
import { Goal, Task } from '../../../types';
import { useUIStore } from '../../../store/uiStore';
import { isUserAuthenticated } from '../../../lib/auth';
import { Icon } from '../../small/icons';
export interface GoalsOverviewProps {}

function normalizeTask(task: Task): any {
  return {
    ...task,
    id: task.id ?? '',
    title: task.title,
  };
}

function normalizeGoal(goal: Goal): any {
  return {
    ...goal,
    id: goal.id ?? '',
    name: goal.title,
    title: goal.title,
    type: goal.category,
    description: goal.description,
    targetDate: goal.targetDate,
    linkedTaskIds: goal.relatedTasks ?? [],
  };
}

export default function GoalsOverview({}: GoalsOverviewProps) {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { goals, tasks, addGoal, loadGoals, loadTasks, syncGoalsToBackend } = useFocusAFKStore();
  const { showModal, showToast } = useUIStore();

  useEffect(() => {
    loadGoals();
    loadTasks();
  }, [loadGoals, loadTasks]);

  const handleCreate = async (goal: Goal) => {
    const newGoal = await addGoal({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      completed: false,
      progress: 0,
      category: goal.category,
      relatedTasks: goal.relatedTasks,
    });
    if( newGoal ) {
      showToast( {message: "Goal created successfully", type: "success"} );
    }
    setShowCreate(false);
    await loadGoals();
  };

  const handleSyncToBackend = async () => {
    if (!isUserAuthenticated()) {
      alert('Please login first to sync goals to the backend');
      return;
    }

    setSyncing(true);
    setError(null);
    try {
      const result = await syncGoalsToBackend();
      if (result.success) {
        alert(`Goals synced to backend successfully! ${result.syncedCount} goals synced.`);
      } else {
        setError(`Sync completed with errors: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Failed to sync goals:', error);
      setError(`Failed to sync goals to backend: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshGoals = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadGoals();
      await loadTasks();
    } catch (error: any) {
      setError(`Failed to refresh goals: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const normalizedTasks = tasks.map(normalizeTask);
  const normalizedGoals = goals.map(normalizeGoal);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Goals / KPIs / Aims</h1>
        <div className="flex gap-2">
          <button
            onClick={() => showModal(<div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Goals</h1>
              <p className="text-sm text-gray-500">
                Manage your goals, KPIs, and aims. Sync with backend to backup your data.
              </p>
              <button
                onClick={handleRefreshGoals}
                disabled={refreshing}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 flex items-center gap-2"
                title="Refresh goals from local and API"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
                <Icon name="refresh" />
              </button>
              {isUserAuthenticated() && (
                <button
                  onClick={handleSyncToBackend}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Sync to Backend'}
                </button>
              )}
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-secondary)] transition"
              >
                {showCreate ? 'Cancel' : 'Add Goal'}
              </button>
            </div>)}
          >
            <Icon name="settings" />
          </button>
          <ButtonPrimary
            className="px-4 py-2 bg-var(--brand-primary) rounded-lg hover:bg-var(--brand-secondary) transition"
            onClick={() => setShowCreate(v => !v)}
          >
            {showCreate ? 'Back to List' : 'Add Goal'}
          </ButtonPrimary>
        </div>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {showCreate ? (
        <GoalCreate tasks={normalizedTasks} onCreate={handleCreate} onCancel={() => setShowCreate(false)} />
      ) : (
        <GoalList goals={normalizedGoals} tasks={normalizedTasks} />
      )}
    </div>
  );
} 