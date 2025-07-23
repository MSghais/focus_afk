'use client';
import { useEffect, useState } from 'react';
import GoalList, { Goal as LocalGoal, Task as LocalTask } from './GoalList';
import GoalCreate, { GoalFormData, Task as CreateTask } from './GoalCreate';
import { useFocusAFKStore } from '../../../store/store';
  import { ButtonPrimary } from '../../small/buttons';
import { Goal, Task } from '../../../types';
export interface GoalsOverviewProps {}

function normalizeTask(task: Task): LocalTask {
  return {
    ...task,
    id: task.id ?? '',
    title: task.title,
  };
}

function normalizeGoal(goal: Goal): LocalGoal {
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
  const { goals, tasks, addGoal, loadGoals, loadTasks } = useFocusAFKStore();

  useEffect(() => {
    loadGoals();
    loadTasks();
  }, [loadGoals, loadTasks]);

  const handleCreate = async (goal: GoalFormData) => {
    await addGoal({
      title: goal.name,
      description: goal.description,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
      completed: false,
      progress: 0,
      category: goal.type,
      relatedTasks: goal.linkedTaskIds.map(id => typeof id === 'string' ? parseInt(id) : id),
    });
    setShowCreate(false);
    await loadGoals();
  };

  const normalizedTasks = tasks.map(normalizeTask);
  const normalizedGoals = goals.map(normalizeGoal);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Goals / KPIs / Aims</h1>
        <ButtonPrimary
          className="px-4 py-2 bg-var(--brand-primary) rounded-lg hover:bg-var(--brand-secondary) transition"
          onClick={() => setShowCreate(v => !v)}
        >
          {showCreate ? 'Back to List' : 'Add Goal'}
        </ButtonPrimary>
      </div>
      {showCreate ? (
        <GoalCreate tasks={normalizedTasks} onCreate={handleCreate} onCancel={() => setShowCreate(false)} />
      ) : (
        <GoalList goals={normalizedGoals} tasks={normalizedTasks} />
      )}
    </div>
  );
} 