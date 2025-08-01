'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import TaskCalendarEnhanced from '../../../components/modules/tasks/TaskCalendarEnhanced';
import { Task } from '../../../types';
import { useUIStore } from '../../../store/uiStore';

export default function TasksCalendarPage() {
    const { tasks, loading, updateTask } = useFocusAFKStore();
    const { showToast } = useUIStore();
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

    useEffect(() => {
        // Filter out tasks without due dates for calendar view
        setFilteredTasks(tasks.filter(task => task.dueDate));
    }, [tasks]);

    const handleTaskClick = (task: Task) => {
        // Show task details in a toast for now
        showToast({
            message: task.title,
            description: task.description || 'No description',
            type: 'info',
            duration: 3000
        });
    };

    const handleTaskDrop = async (taskId: string, newDate: Date) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                await updateTask(taskId, {
                    ...task,
                    dueDate: newDate
                });
                
                showToast({
                    message: 'Task moved',
                    description: `Task moved to ${newDate.toLocaleDateString()}`,
                    type: 'success',
                    duration: 2000
                });
            }
        } catch (error) {
            showToast({
                message: 'Error moving task',
                description: 'Failed to update task due date',
                type: 'error',
                duration: 3000
            });
        }
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Task Calendar</h1>
                <p className="text-sm text-gray-500">
                    View and manage your tasks in a calendar format. Drag and drop tasks to reschedule them.
                </p>
                <div className="mt-2 text-sm text-gray-600">
                    Showing {filteredTasks.length} tasks with due dates out of {tasks.length} total tasks
                </div>
            </div>

            <div className="flex-1 min-h-0">
                            <TaskCalendarEnhanced
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onTaskDrop={handleTaskDrop}
                className="h-full"
            />
            </div>
        </div>
    );
} 