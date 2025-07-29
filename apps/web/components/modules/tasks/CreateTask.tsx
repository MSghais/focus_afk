'use client';

import { useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import { useEffect } from 'react';

import Link from 'next/link';
import { logClickedEvent } from '../../../lib/analytics';
import { useAuthStore } from '../../../store/auth';
import { isUserAuthenticated } from '../../../lib/auth';
import { ButtonPrimary } from '../../small/buttons';
import { Task } from '../../../types';
import { Icon } from '../../small/icons';
import { useUIStore } from '../../../store/uiStore';

export default function CreateTask({ onNext }: { onNext: () => void }) {
    const { showModal, showToast } = useUIStore();
    const { tasks, loading, addTask, updateTask, deleteTask, toggleTaskComplete, syncTasksToBackend, loadTasks } = useFocusAFKStore();
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
    const [syncing, setSyncing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;


        logClickedEvent('task_add');
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
        onNext && onNext();
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !editingTask.id) return;

        logClickedEvent('task_update');
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

    useEffect(() => {
        handleRefreshTasks();
    }, []);

    const handleDeleteTask = async (id: string | number) => {
        if (confirm('Are you sure you want to delete this task?')) {
            logClickedEvent('task_delete');
            await deleteTask(id);
        }
    };

    const handleSyncToBackend = async () => {
        if (!isUserAuthenticated()) {
            alert('Please login first to sync tasks to the backend');
            return;
        }

        setSyncing(true);
        setError(null);
        try {
            const result = await syncTasksToBackend();
            if (result.success) {
                alert(`Tasks synced to backend successfully! ${result.syncedCount} tasks synced.`);
            } else {
                setError(`Sync completed with errors: ${result.errors.join(', ')}`);
            }
        } catch (error: any) {
            console.error('Failed to sync tasks:', error);
            setError(`Failed to sync tasks to backend: ${error.message}`);
        } finally {
            setSyncing(false);
        }
    };

    // Refresh handler: loads local tasks, then API tasks if authenticated, merges and dedupes
    const handleRefreshTasks = async () => {
        setRefreshing(true);
        setError(null);
        try {
            // Load local tasks
            await loadTasks();
            let localTasks = useFocusAFKStore.getState().tasks;
            let mergedTasks = [...localTasks];
            // If authenticated, fetch API tasks and merge
            if (isUserAuthenticated()) {
                const apiResp = await import('../../../lib/api').then(m => m.api.getTasks());
                if (apiResp.success && Array.isArray(apiResp.data)) {
                    // Convert API task dates to Date objects for consistency
                    const apiTasks = apiResp.data.map((t: any) => ({
                        ...t,
                        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
                        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
                        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
                    }));
                    // Merge and dedupe by title + createdAt (or id if present)
                    const seen = new Set();
                    mergedTasks = [...localTasks];
                    for (const t of apiTasks) {
                        const key = t.id ? `id-${t.id}` : `${t.title}-${t.createdAt?.toISOString?.()}`;
                        if (!mergedTasks.some(lt => (lt.id && t.id && lt.id === t.id) || (lt.title === t.title && lt.createdAt?.toISOString?.() === t.createdAt?.toISOString?.()))) {
                            mergedTasks.push(t);
                        }
                    }
                } else if (apiResp.error) {
                    setError('Failed to fetch tasks from API: ' + apiResp.error);
                }
            }
            // Update the store with merged tasks
            useFocusAFKStore.setState({ tasks: mergedTasks });
        } catch (err: any) {
            setError('Failed to refresh tasks: ' + (err?.message || err));
        } finally {
            setRefreshing(false);
        }
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return 'border-2 border-[var(--afk-danger)] text-[var(--afk-danger)] bg-[var(--afk-danger)]/10';
            case 'medium': return 'border-2 border-[var(--afk-warning)] text-[var(--afk-warning)] bg-[var(--afk-warning)]/10';
            case 'low': return 'border-2 border-[var(--afk-success)] text-[var(--afk-success)] bg-[var(--afk-success)]/10';
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
        <div className="w-full h-full flex flex-col p-2 md:p-6">
            {error && <div className="text-red-600 mb-2">{error}</div>}

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="mb-6 p-2 md:p-4 rounded-lg">
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

        </div >
    );
}