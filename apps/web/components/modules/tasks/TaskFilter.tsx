'use client';

import { useState, useEffect } from 'react';
import { Task } from '../../../types';
import { Icon } from '../../small/icons';
import styles from '../../../styles/components/task-filter.module.scss';

export interface TaskFilterOptions {
  // Date filters
  dueDateFilter: 'all' | 'overdue' | 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'no-due-date';
  createdDateFilter: 'all' | 'today' | 'yesterday' | 'this-week' | 'this-month';
  
  // Status filters
  priorityFilter: 'all' | 'low' | 'medium' | 'high';
  completionFilter: 'all' | 'completed' | 'incomplete';
  archivedFilter: 'all' | 'archived' | 'not-archived';
  
  // Search
  searchQuery: string;
  
  // Sort options
  sortBy: 'priority' | 'dueDate' | 'createdAt' | 'title' | 'custom';
  sortOrder: 'asc' | 'desc';
  
  // Custom order (for user-defined priority)
  customOrder: string[];
}

interface TaskFilterProps {
  tasks: Task[];
  onFilterChange: (filteredTasks: Task[]) => void;
  customOrder?: string[];
  onCustomOrderChange?: (order: string[]) => void;
  className?: string;
}

const defaultFilterOptions: TaskFilterOptions = {
  dueDateFilter: 'all',
  createdDateFilter: 'all',
  priorityFilter: 'all',
  completionFilter: 'all',
  archivedFilter: 'all',
  searchQuery: '',
  sortBy: 'priority',
  sortOrder: 'desc',
  customOrder: []
};

export default function TaskFilter({ tasks, onFilterChange, customOrder = [], onCustomOrderChange, className = '' }: TaskFilterProps) {
  const [filterOptions, setFilterOptions] = useState<TaskFilterOptions>({
    ...defaultFilterOptions,
    customOrder
  });
  const [isExpanded, setIsExpanded] = useState(true);

  // Apply filters and sorting
  useEffect(() => {
    let filteredTasks = [...tasks];

    // Search filter
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category?.toLowerCase().includes(query)
      );
    }

    // Due date filter
    if (filterOptions.dueDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) {
          return filterOptions.dueDateFilter === 'no-due-date';
        }

        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        switch (filterOptions.dueDateFilter) {
          case 'overdue':
            return dueDateOnly < today && !task.completed;
          case 'today':
            return dueDateOnly.getTime() === today.getTime();
          case 'tomorrow':
            return dueDateOnly.getTime() === tomorrow.getTime();
          case 'this-week':
            return dueDateOnly >= today && dueDateOnly < nextWeek;
          case 'next-week':
            const weekAfterNext = new Date(nextWeek);
            weekAfterNext.setDate(weekAfterNext.getDate() + 7);
            return dueDateOnly >= nextWeek && dueDateOnly < weekAfterNext;
          default:
            return true;
        }
      });
    }

    // Created date filter
    if (filterOptions.createdDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filteredTasks = filteredTasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

        switch (filterOptions.createdDateFilter) {
          case 'today':
            return createdDateOnly.getTime() === today.getTime();
          case 'yesterday':
            return createdDateOnly.getTime() === yesterday.getTime();
          case 'this-week':
            return createdDateOnly >= thisWeek && createdDateOnly <= today;
          case 'this-month':
            return createdDate >= thisMonth;
          default:
            return true;
        }
      });
    }

    // Priority filter
    if (filterOptions.priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filterOptions.priorityFilter);
    }

    // Completion filter
    if (filterOptions.completionFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        filterOptions.completionFilter === 'completed' ? task.completed : !task.completed
      );
    }

    // Archived filter
    if (filterOptions.archivedFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        filterOptions.archivedFilter === 'archived' ? task.isArchived : !task.isArchived
      );
    }

    // Sorting
    filteredTasks.sort((a, b) => {
      let comparison = 0;

      switch (filterOptions.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'custom':
          // Use custom order if available, otherwise fall back to priority
          const aIndex = filterOptions.customOrder.indexOf(a.id || '');
          const bIndex = filterOptions.customOrder.indexOf(b.id || '');
          if (aIndex !== -1 && bIndex !== -1) {
            comparison = aIndex - bIndex;
          } else {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          break;
      }

      return filterOptions.sortOrder === 'asc' ? comparison : -comparison;
    });

    onFilterChange(filteredTasks);
  }, [tasks, filterOptions, onFilterChange]);

  const updateFilter = (updates: Partial<TaskFilterOptions>) => {
    setFilterOptions(prev => {
      const newOptions = { ...prev, ...updates };
      if (updates.customOrder && onCustomOrderChange) {
        onCustomOrderChange(updates.customOrder);
      }
      return newOptions;
    });
  };

  const resetFilters = () => {
    setFilterOptions(defaultFilterOptions);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filterOptions.searchQuery) count++;
    if (filterOptions.dueDateFilter !== 'all') count++;
    if (filterOptions.createdDateFilter !== 'all') count++;
    if (filterOptions.priorityFilter !== 'all') count++;
    if (filterOptions.completionFilter !== 'all') count++;
    if (filterOptions.archivedFilter !== 'all') count++;
    return count;
  };

  return (
    <div className={`${styles.taskFilter} ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="filter" />
          <h3 className="font-medium">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <Icon name={isExpanded ? "chevron-up" : "chevron-down"} />
          </button>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Search Bar - Always visible */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filterOptions.searchQuery}
          onChange={(e) => updateFilter({ searchQuery: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Quick Filters Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => updateFilter({ completionFilter: 'incomplete' })}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filterOptions.completionFilter === 'incomplete'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => updateFilter({ completionFilter: 'completed' })}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filterOptions.completionFilter === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => updateFilter({ archivedFilter: 'archived' })}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filterOptions.archivedFilter === 'archived'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => updateFilter({ dueDateFilter: 'overdue' })}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filterOptions.dueDateFilter === 'overdue'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => updateFilter({ dueDateFilter: 'today' })}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filterOptions.dueDateFilter === 'today'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Due Today
            </button>
            <button
              onClick={() => updateFilter({ priorityFilter: 'high' })}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filterOptions.priorityFilter === 'high'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Priority
            </button>
            <button
              onClick={() => updateFilter({ 
                completionFilter: 'all', 
                archivedFilter: 'all',
                dueDateFilter: 'all',
                createdDateFilter: 'all',
                priorityFilter: 'all'
              })}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filterOptions.completionFilter === 'all' && 
                filterOptions.archivedFilter === 'all' &&
                filterOptions.dueDateFilter === 'all' &&
                filterOptions.createdDateFilter === 'all' &&
                filterOptions.priorityFilter === 'all'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Show All
            </button>
          </div>

          {/* Detailed Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {/* Sort Options */}
               <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <div className="flex gap-2">
                <select
                  value={filterOptions.sortBy}
                  onChange={(e) => updateFilter({ sortBy: e.target.value as any })}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due date</option>
                  <option value="createdAt">Created date</option>
                  <option value="title">Title</option>
                  <option value="custom">Custom order</option>
                </select>
                <button
                  onClick={() => updateFilter({ sortOrder: filterOptions.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                  title={`Sort ${filterOptions.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <Icon name={filterOptions.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc'} />
                </button>
              </div>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <select
                value={filterOptions.dueDateFilter}
                onChange={(e) => updateFilter({ dueDateFilter: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this-week">This week</option>
                <option value="next-week">Next week</option>
                <option value="no-due-date">No due date</option>
              </select>
            </div>

            {/* Created Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <select
                value={filterOptions.createdDateFilter}
                onChange={(e) => updateFilter({ createdDateFilter: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This week</option>
                <option value="this-month">This month</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filterOptions.priorityFilter}
                onChange={(e) => updateFilter({ priorityFilter: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Completion Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterOptions.completionFilter}
                onChange={(e) => updateFilter({ completionFilter: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All tasks</option>
                <option value="incomplete">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Archived Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archived</label>
              <select
                value={filterOptions.archivedFilter}
                onChange={(e) => updateFilter({ archivedFilter: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All tasks</option>
                <option value="not-archived">Not archived</option>
                <option value="archived">Archived</option>
              </select>
            </div>

         
          </div>
        </div>
      )}
    </div>
  );
} 