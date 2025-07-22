import { useState } from 'react';
import GoalList, { Goal, Task } from './GoalList';
import GoalCreate, { GoalFormData } from './GoalCreate';

export interface GoalsOverviewProps {
  goals?: Goal[];
  tasks?: Task[];
}

export default function GoalsOverview({ goals = [], tasks = [] }: GoalsOverviewProps) {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [localGoals, setLocalGoals] = useState<Goal[]>(goals);

  const handleCreate = (goal: GoalFormData) => {
    setLocalGoals(prev => [
      { ...goal, id: Date.now(), linkedTaskIds: goal.linkedTaskIds || [] },
      ...prev
    ]);
    setShowCreate(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Goals / KPIs / Aims</h1>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          onClick={() => setShowCreate(v => !v)}
        >
          {showCreate ? 'Back to List' : 'Add Goal'}
        </button>
      </div>
      {showCreate ? (
        <GoalCreate tasks={tasks} onCreate={handleCreate} onCancel={() => setShowCreate(false)} />
      ) : (
        <GoalList goals={localGoals} tasks={tasks} />
      )}
    </div>
  );
} 