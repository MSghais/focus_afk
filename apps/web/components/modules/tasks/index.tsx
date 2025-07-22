'use client';

import { useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import { Task } from '../../../lib/database';
import Link from 'next/link';

export default function Tasks() {
    const { tasks, loading, addTask, updateTask, deleteTask, toggleTaskComplete } = useFocusAFKStore();
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium' as Task['priority'],
        category: '',
        dueDate: '',
        estimatedMinutes: 0
    });
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        await addTask({
            title: newTask.title,
            description: newTask.description || undefined,
            completed: false,
            priority: newTask.priority,
            category: newTask.category || undefined,
            dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
            estimatedMinutes: newTask.estimatedMinutes || undefined
        });

        setNewTask({
            title: '',
            description: '',
            priority: 'medium',
            category: '',
            dueDate: '',
            estimatedMinutes: 0
        });
        setShowAddForm(false);
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !editingTask.id) return;

        await updateTask(editingTask.id, {
            title: editingTask.title,
            description: editingTask.description,
            priority: editingTask.priority,
            category: editingTask.category,
            dueDate: editingTask.dueDate,
            estimatedMinutes: editingTask.estimatedMinutes
        });

        setEditingTask(null);
    };

    const handleDeleteTask = async (id: number) => {
        if (confirm('Are you sure you want to delete this task?')) {
            await deleteTask(id);
        }
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString();
    };

    if (loading.tasks) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-lg">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tasks</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    {showAddForm ? 'Cancel' : 'Add Task'}
                </button>
            </div>

            {/* Add Task Form */}
            {showAddForm && (
                <form onSubmit={handleAddTask} className="mb-6 p-4  rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                placeholder="Task title"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select
                                value={newTask.priority}
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input
                                type="text"
                                value={newTask.category}
                                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                placeholder="Work, Personal, etc."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Due Date</label>
                            <input
                                type="date"
                                value={newTask.dueDate}
                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Estimated Minutes</label>
                            <input
                                type="number"
                                value={newTask.estimatedMinutes}
                                onChange={(e) => setNewTask({ ...newTask, estimatedMinutes: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 border rounded-md"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                rows={3}
                                placeholder="Task description (optional)"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Add Task
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

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto">
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">No tasks yet</p>
                        <p className="text-sm">Create your first task to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`p-4 border rounded-lg transition-all ${
                                    task.completed ? 'bg-gray-50 opacity-75' : 'hover:shadow-md'
                                }`}
                            >
                                {editingTask?.id === task.id ? (
                                    <form onSubmit={handleUpdateTask} className="space-y-3">
                                        <input
                                            type="text"
                                            value={editingTask?.title || ''}
                                            onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value || '' } as Task)}
                                            className="w-full p-2 border rounded-md font-medium"
                                            required
                                        />
                                        <textarea
                                            value={editingTask?.description || ''}
                                            onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value || '' } as Task)}
                                            className="w-full p-2 border rounded-md text-sm"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <select
                                                value={editingTask?.priority}
                                                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] || 'medium' } as Task)}
                                                className="p-2 border rounded-md text-sm"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={editingTask?.category || ''}
                                                onChange={(e) =>
                                                        setEditingTask({ ...editingTask, category: e.target.value || '' } as Task)
                                                }
                                                className="p-2 border rounded-md text-sm"
                                                placeholder="Category"
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
                                                onClick={() => setEditingTask(null)}
                                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={() => toggleTaskComplete(task.id!)}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <h3 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                                                    {task.title}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                {task.category && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                                                        {task.category}
                                                    </span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-gray-600 text-sm mb-2 ml-7">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-gray-500 ml-7">
                                                {task.dueDate && (
                                                    <span>Due: {formatDate(task.dueDate)}</span>
                                                )}
                                                {task.estimatedMinutes && task.estimatedMinutes > 0 && (
                                                    <span>Est: {task.estimatedMinutes}m</span>
                                                )}
                                                <span>Created: {formatDate(task.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Link
                                                href={`/deep/${task.id}`}
                                                className="px-2 py-1 text-purple-600 hover:bg-purple-50 rounded text-sm font-medium"
                                            >
                                                Go DEEP
                                            </Link>
                                            <button
                                                onClick={() => setEditingTask(task)}
                                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id!)}
                                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                            >
                                                Delete
                                            </button>
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