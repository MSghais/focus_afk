export interface Task {
  id: number | string;
  title: string;
}

export interface Goal {
  id: number | string;
  name?: string;
  title?: string;
  type?: string;
  description?: string;
  targetDate?: string | Date;
  linkedTaskIds?: (number | string)[];
}

export interface GoalListProps {
  goals: Goal[];
  tasks: Task[];
}

export default function GoalList({ goals = [], tasks = [] }: GoalListProps) {
  if (!goals.length) {
    return <div className="text-center text-gray-400 py-8">No goals yet. Create your first goal!</div>;
  }
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {goals.map(goal => (
        <div key={goal.id} className="p-4 rounded-lg border bg-white dark:bg-gray-900 shadow flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{goal.name || goal.title}</span>
            <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">{goal.type || 'Goal'}</span>
          </div>
          {goal.description && <div className="text-sm text-gray-600 dark:text-gray-300">{goal.description}</div>}
          {goal.targetDate && <div className="text-xs text-gray-500">Target: {goal.targetDate instanceof Date ? goal.targetDate.toLocaleDateString() : goal.targetDate}</div>}
          {goal.linkedTaskIds && goal.linkedTaskIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {goal.linkedTaskIds.map(id => {
                const task = tasks.find(t => t.id === id);
                return task ? (
                  <span key={id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{task.title}</span>
                ) : null;
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 