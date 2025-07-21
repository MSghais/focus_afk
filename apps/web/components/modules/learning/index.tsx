'use client';

import { useState } from 'react';
import { useFocusAFKStore } from '../../../lib/store';
import { Goal, Task } from '../../../lib/database';

export default function Goals() {
    const { goals, tasks, loading, addGoal, updateGoal, deleteGoal, updateGoalProgress } = useFocusAFKStore();
    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        targetDate: '',
        category: '',
        progress: 0
    });
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.title.trim()) return;

        await addGoal({
            title: newGoal.title,
            description: newGoal.description || undefined,
            targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined,
            completed: false,
            progress: newGoal.progress,
            category: newGoal.category || undefined,
            relatedTasks: []
        });

        setNewGoal({
            title: '',
            description: '',
            targetDate: '',
            category: '',
            progress: 0
        });
        setShowAddForm(false);
    };

    const handleUpdateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGoal || !editingGoal.id) return;

        await updateGoal(editingGoal.id, {
            title: editingGoal.title,
            description: editingGoal.description,
            targetDate: editingGoal.targetDate,
            progress: editingGoal.progress,
            category: editingGoal.category
        });

        setEditingGoal(null);
    };

    const handleDeleteGoal = async (id: number) => {
        if (confirm('Are you sure you want to delete this goal?')) {
            await deleteGoal(id);
        }
    };

    const handleProgressChange = async (goalId: number, progress: number) => {
        await updateGoalProgress(goalId, progress);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString();
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 60) return 'bg-blue-500';
        if (progress >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getDaysUntilTarget = (targetDate: Date) => {
        const today = new Date();
        const target = new Date(targetDate);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading.goals) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-lg">Loading goals...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Goals</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    {showAddForm ? 'Cancel' : 'Add Goal'}
                </button>
            </div>

            {/* Add Goal Form */}
            {showAddForm && (
                <form onSubmit={handleAddGoal} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input
                                type="text"
                                value={newGoal.title}
                                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                placeholder="Goal title"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input
                                type="text"
                                value={newGoal.category}
                                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                placeholder="Work, Personal, etc."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Target Date</label>
                            <input
                                type="date"
                                value={newGoal.targetDate}
                                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Initial Progress (%)</label>
                            <input
                                type="number"
                                value={newGoal.progress}
                                onChange={(e) => setNewGoal({ ...newGoal, progress: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 border rounded-md"
                                min="0"
                                max="100"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={newGoal.description}
                                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                rows={3}
                                placeholder="Goal description (optional)"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Add Goal
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Goals List */}
            <div className="flex-1 overflow-y-auto">
                {goals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">No goals yet</p>
                        <p className="text-sm">Create your first goal to start tracking progress!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {goals.map((goal) => (
                            <div
                                key={goal.id}
                                className={`p-4 border rounded-lg transition-all ${
                                    goal.completed ? 'bg-green-50 border-green-200' : 'bg-white hover:shadow-md'
                                }`}
                            >
                                {editingGoal?.id === goal.id ? (
                                    <form onSubmit={handleUpdateGoal} className="space-y-3">
                                        <input
                                            type="text"
                                            value={editingGoal.title}
                                            onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                                            className="w-full p-2 border rounded-md font-medium"
                                            required
                                        />
                                        <textarea
                                            value={editingGoal.description || ''}
                                            onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                                            className="w-full p-2 border rounded-md text-sm"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editingGoal.category || ''}
                                                onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value })}
                                                className="p-2 border rounded-md text-sm"
                                                placeholder="Category"
                                            />
                                            <input
                                                type="date"
                                                value={editingGoal.targetDate ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value ? new Date(e.target.value) : undefined })}
                                                className="p-2 border rounded-md text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingGoal(null)}
                                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className={`font-medium ${goal.completed ? 'line-through' : ''}`}>
                                                        {goal.title}
                                                    </h3>
                                                    {goal.category && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                                                            {goal.category}
                                                        </span>
                                                    )}
                                                    {goal.completed && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>
                                                {goal.description && (
                                                    <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {goal.targetDate && (
                                                        <span>
                                                            Target: {formatDate(goal.targetDate)}
                                                            {getDaysUntilTarget(goal.targetDate) > 0 && (
                                                                <span className="ml-1 text-orange-600">
                                                                    ({getDaysUntilTarget(goal.targetDate)} days left)
                                                                </span>
                                                            )}
                                                            {getDaysUntilTarget(goal.targetDate) < 0 && (
                                                                <span className="ml-1 text-red-600">
                                                                    (Overdue)
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                    <span>Created: {formatDate(goal.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => setEditingGoal(goal)}
                                                    className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGoal(goal.id!)}
                                                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Progress</span>
                                                <span className="text-sm text-gray-600">{goal.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(goal.progress)}`}
                                                    style={{ width: `${goal.progress}%` }}
                                                ></div>
                                            </div>
                                            {!goal.completed && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleProgressChange(goal.id!, Math.max(0, goal.progress - 10))}
                                                        className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                                    >
                                                        -10%
                                                    </button>
                                                    <button
                                                        onClick={() => handleProgressChange(goal.id!, Math.min(100, goal.progress + 10))}
                                                        className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                                    >
                                                        +10%
                                                    </button>
                                                    <button
                                                        onClick={() => handleProgressChange(goal.id!, 100)}
                                                        className="px-2 py-1 text-xs bg-green-200 hover:bg-green-300 rounded text-green-700"
                                                    >
                                                        Complete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}