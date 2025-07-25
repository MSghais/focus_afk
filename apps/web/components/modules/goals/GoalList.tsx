import Link from "next/link";
import { useFocusAFKStore } from "../../../store/store";
import { Goal,  Task } from "../../../types";



export interface GoalListProps {
  goals: Goal[];
  tasks: Task[];
}

export default function GoalList({ goals = [], tasks = [] }: GoalListProps) {
  const { setSelectedGoal } = useFocusAFKStore();
  if (!goals.length) {
    return <div className="text-center  py-8">No goals yet. Create your first goal!</div>;
  }
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 text-var(--text-primary)">
      {goals.map(goal => (
        <div key={goal.id} className="p-4 rounded-lg border shadow flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{goal?.title || 'Goal'}</span>
            <span className="px-2 py-1 rounded-full text-xs border border-var(--border) text-var(--text-primary)">{goal?.category || 'Goal'}</span>
          </div>
          {goal.description && <div className="text-sm text-var(--text-primary)">{goal.description}</div>}
          {goal.targetDate && <div className="text-xs text-var(--text-primary)">Target: {goal.targetDate instanceof Date ? goal.targetDate.toLocaleDateString() : goal.targetDate}</div>}
          {/* {goal.linkedTaskIds && goal.linkedTaskIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1"
              onClick={() => setSelectedGoal(goal)}
            >
              {goal.linkedTaskIds.map(id => {
                const task = tasks.find(t => t.id === id);
                return task ? (
                  <span key={id} className="px-2 py-1  rounded-full text-xs text-var(--text-primary)">{task.title}</span>
                ) : null;
              })}
            </div>
          )} */}

          <div className="flex flex-row gap-2">
            <Link href={`/goals/${goal?.id}`} className="text-var(--text-primary) bg-var(--background) px-4 py-2 rounded-md border border-var(--border)">View</Link>
          </div>
        </div>
      ))}
    </div>
  );
} 