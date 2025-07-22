import { useState } from 'react';

export interface Task {
  id: number | string;
  title: string;
}

export interface GoalCreateProps {
  tasks: Task[];
  onCreate?: (goal: GoalFormData) => void;
  onCancel?: () => void;
}

export interface GoalFormData {
  name: string;
  type: string;
  description: string;
  targetDate: string;
  linkedTaskIds: (number | string)[];
}

const GOAL_TYPES = ["Goal", "KPI", "Aim"];

export default function GoalCreate({ tasks = [], onCreate, onCancel }: GoalCreateProps) {
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>(GOAL_TYPES[0] || "");
  const [description, setDescription] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [linkedTaskIds, setLinkedTaskIds] = useState<(number | string)[]>([]);

  const handleTaskToggle = (taskId: number | string) => {
    setLinkedTaskIds((prev: (number | string)[]) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate && onCreate({ name, type, description, targetDate, linkedTaskIds });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md p-4 rounded-lg shadow flex flex-col gap-4 mx-auto">
      <h2 className="text-xl font-bold mb-2">Create Goal / KPI / Aim</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input type="text" className="w-full p-2 border rounded-md" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select className="w-full p-2 border rounded-md" value={type} onChange={e => setType(e.target.value)}>
          {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea className="w-full p-2 border rounded-md" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Target Date</label>
        <input type="date" className="w-full p-2 border rounded-md" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Link Tasks</label>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {tasks.length === 0 && <span className="text-xs text-gray-400">No tasks available</span>}
          {tasks.map(task => (
            <label key={task.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={linkedTaskIds.includes(task.id)} onChange={() => handleTaskToggle(task.id)} />
              <span>{task.title}</span>
            </label>
          ))}
        </div>
        {linkedTaskIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {linkedTaskIds.map(id => {
              const task = tasks.find(t => t.id === id);
              return task ? (
                <span key={id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{task.title}</span>
              ) : null;
            })}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex-1">Create</button>
        <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex-1" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
} 