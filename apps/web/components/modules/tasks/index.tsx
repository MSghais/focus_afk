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
import TaskFilter, { TaskFilterOptions } from './TaskFilter';
import TaskOrderManager from './TaskOrderManager';


interface ITasksOverviewProps {
    isViewGoalsRedirect?: boolean;
}
export default function Tasks({ isViewGoalsRedirect = false }: ITasksOverviewProps) {
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
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [customOrder, setCustomOrder] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

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

    const handleArchiveTask = async (task: Task) => {
        if (!task.id) return;

        logClickedEvent('task_archive');
        await updateTask(task.id, {
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            dueDate: task.dueDate,
            estimatedMinutes: task.estimatedMinutes,
            isArchived: true
        });

        setEditingTask(null);
    };

    useEffect(() => {
        handleRefreshTasks();
    }, []);

    // Update filtered tasks when tasks change
    useEffect(() => {
        setFilteredTasks(tasks);
    }, [tasks]);

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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
                <div className="flex flex-row gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Tasks</h1>
                        <p className="text-sm text-gray-500">
                            Tasks are the core of your focus and productivity. They help you break down your goals into actionable steps.
                        </p>
                    </div>



                </div>
                <div className="flex gap-2">

                    {isViewGoalsRedirect && (
                        <div className="flex flex-col gap-2">
                            <Link href="/goals" className="flex flex-row gap-2 text-sm text-gray-500 shadow-md p-2 rounded-lg hover:bg-gray-100 transition border border-gray-200 max-w-20 max-h-auto text-center">
                                🎯 Goals
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="border border-[var(--brand-primary)] flex items-center gap-2 px-4 py-2 text-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-secondary)] transition"
                    >
                        <Icon name="add" />
                        Add
                    </button>


                    <button
                        onClick={() => {
                            setShowFilters(!showFilters);
                            // setShowAddForm(false);
                            showModal(<div className="mb-6 space-y-4">
                                <TaskFilter
                                    tasks={tasks}
                                    onFilterChange={setFilteredTasks}
                                    customOrder={customOrder}
                                    onCustomOrderChange={setCustomOrder}
                                    className="mb-4"
                                />
                                <TaskOrderManager
                                    tasks={tasks}
                                    onOrderChange={setCustomOrder}
                                    className="mb-4"
                                />
                            </div>)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                    >
                        <Icon name="filter" />
                    </button>

                    <button
                        onClick={() => {
                            const hasCompleted = filteredTasks.some(t => t.completed);
                            const hasArchived = filteredTasks.some(t => t.isArchived);

                            if (hasCompleted || hasArchived) {
                                // Hide completed and archived
                                setFilteredTasks(tasks.filter(t => !t.completed && !t.isArchived));
                            } else {
                                // Show all
                                setFilteredTasks(tasks);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                        title="Toggle completed/archived tasks"
                    >
                        {filteredTasks.some(t => t.completed || t.isArchived) ? '👁️ Hide' : '👁️ Show All'}
                    </button>


                    <button onClick={() =>
                        showModal(<div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold">Tasks</h1>
                            <p className="text-sm text-gray-500">
                                Tasks are the core of your focus and productivity. They help you break down your goals into actionable steps.
                            </p>
                            {/* <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 flex items-center gap-2">
                                <Icon name="refresh" />
                                Refresh
                            </button> */}

                            <button
                                onClick={handleRefreshTasks}
                                disabled={refreshing}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 flex items-center gap-2"
                                title="Refresh tasks from local and API"
                            >
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                                <Icon name="refresh" />

                                <span aria-hidden="true">🔄

                                </span>
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
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-secondary)] transition"
                            >
                                {showAddForm ? 'Cancel' : 'Add Task'}
                            </button>
                        </div>)
                    }>

                        <Icon name="settings" />
                    </button>

                </div>
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}

            {/* Filter Components */}
            {showFilters && (
                <div className="mb-6 space-y-4">
                    <TaskFilter
                        tasks={tasks}
                        onFilterChange={setFilteredTasks}
                        customOrder={customOrder}
                        onCustomOrderChange={setCustomOrder}
                        className="mb-4"
                    />
                    <TaskOrderManager
                        tasks={tasks}
                        onOrderChange={setCustomOrder}
                        className="mb-4"
                    />
                </div>
            )}

            {/* Add Task Form */}
            {showAddForm && (
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
            )}

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto">
                {/* Status Indicator */}
                {filteredTasks.length > 0 && (
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                    Showing {filteredTasks.length} of {tasks.length} tasks
                                </span>
                                {filteredTasks.some(t => t.completed) && (
                                    <span className="px-2 py-1 text-green-800 text-xs rounded-full">
                                        Includes completed
                                    </span>
                                )}
                                {filteredTasks.some(t => t.isArchived) && (
                                    <span className="px-2 py-1 text-orange-800 text-xs rounded-full">
                                        Includes archived
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500">
                                {filteredTasks.filter(t => t.completed).length} completed, {filteredTasks.filter(t => t.isArchived).length} archived
                            </div>
                        </div>
                    </div>
                )}

                {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">
                            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                        </p>
                        <p className="text-sm">
                            {tasks.length === 0 ? 'Create your first task to get started!' : 'Try adjusting your filters or search terms.'}
                        </p>
                    </div>
                ) : (
                    <div
                        className="space-y-4"
                    >
                        {filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className={`p-4 border rounded-lg transition-all ${task.completed
                                        ? 'bg-gray-500 border-gray-200 opacity-90'
                                        : task.isArchived
                                            ? 'bg-gray-500 border-gray-200 opacity-90'
                                            : 'hover:shadow-md'
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

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                value={editingTask?.dueDate?.toISOString().split('T')[0] || ''}
                                                onChange={(e) => setEditingTask({ ...editingTask, dueDate: new Date(e.target.value) } as unknown as Task)}
                                                className="w-full p-2 border rounded-md"
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
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={async () => {
                                                        console.log('toggleTaskComplete', task.id);
                                                        if (task.id) {
                                                            console.log('task.id', task.id);
                                                            const id = typeof task.id === 'string' ? task.id : String(task.id);
                                                            const res = await toggleTaskComplete(id, !task.completed);
                                                            console.log('res', res);

                                                            showToast({
                                                                message: res ? 'Task completed' : 'Task uncompleted',
                                                                description: res ? 'Task completed successfully' : 'Task uncompleted successfully',
                                                                type: 'success',
                                                                duration: 3000
                                                            });
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <h3 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                                                    {task.title}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                {task.category && (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                                        {task.category}
                                                    </span>
                                                )}
                                                {task.completed && (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                                        ✓ Completed
                                                    </span>
                                                )}
                                                {task.isArchived && (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-medium">
                                                        📦 Archived
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
                                        <div
                                            // className="flex flex-wrap gap-2 ml-0 sm:ml-4"
                                            className="grid grid-cols-2 gap-2 ml-0 sm:ml-4"

                                        >
                                            <ButtonPrimary
                                                className="px-2 py-1 text-purple-600 hover:bg-purple-50 rounded text-sm font-medium"
                                            >
                                                <Link
                                                    href={`/deep/${task.id}`}
                                                    className="flex items-center gap-2"
                                                >
                                                    🎯
                                                    Deep
                                                </Link>
                                            </ButtonPrimary>

                                            <button
                                                onClick={() => setEditingTask(task)}
                                                className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 rounded text-sm"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (task.id) {
                                                        handleDeleteTask(task.id);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-2 py-1 hover:bg-red-50 rounded text-sm"
                                            >
                                                🗑️ Delete
                                            </button>
                                            <div>
                                                <button onClick={() => handleArchiveTask(task)}>
                                                    Archive
                                                </button>
                                            </div>
                                        </div>


                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}