import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

export class CreateTaskTool extends StructuredTool {
  name = 'create_task';
  description = 'Create a new task for the user';
  schema = z.object({
    title: z.string().describe('The title of the task'),
    description: z.string().optional().describe('Optional description of the task'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level of the task'),
    category: z.string().optional().describe('Category for organizing the task'),
    dueDate: z.string().optional().describe('Due date in ISO format'),
    estimatedMinutes: z.number().optional().describe('Estimated time to complete in minutes'),
    goalId: z.string().optional().describe('ID of the goal this task relates to')
  });

  constructor(private prisma: PrismaClient) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const task = await this.prisma.task.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority || 'medium',
          category: input.category,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          estimatedMinutes: input.estimatedMinutes,
          goalIds: input.goalId ? [input.goalId] : [],
          userId: 'user-id', // This should be passed from context
          completed: false
        }
      });

      return JSON.stringify({
        success: true,
        task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class UpdateTaskTool extends StructuredTool {
  name = 'update_task';
  description = 'Update an existing task';
  schema = z.object({
    taskId: z.string().describe('ID of the task to update'),
    title: z.string().optional().describe('New title for the task'),
    description: z.string().optional().describe('New description for the task'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('New priority level'),
    category: z.string().optional().describe('New category'),
    dueDate: z.string().optional().describe('New due date in ISO format'),
    completed: z.boolean().optional().describe('Whether the task is completed'),
    estimatedMinutes: z.number().optional().describe('New estimated time in minutes'),
    actualMinutes: z.number().optional().describe('Actual time spent in minutes')
  });

  constructor(private prisma: PrismaClient) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const { taskId, ...updates } = input;
      
      const task = await this.prisma.task.update({
        where: { id: taskId },
        data: {
          ...updates,
          dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
          updatedAt: new Date()
        }
      });

      return JSON.stringify({
        success: true,
        task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          completed: task.completed,
          dueDate: task.dueDate
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class DeleteTaskTool extends StructuredTool {
  name = 'delete_task';
  description = 'Delete a task';
  schema = z.object({
    taskId: z.string().describe('ID of the task to delete')
  });

  constructor(private prisma: PrismaClient) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      await this.prisma.task.delete({
        where: { id: input.taskId }
      });

      return JSON.stringify({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class GetTasksTool extends StructuredTool {
  name = 'get_tasks';
  description = 'Get tasks for the user with optional filtering';
  schema = z.object({
    completed: z.boolean().optional().describe('Filter by completion status'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
    category: z.string().optional().describe('Filter by category'),
    goalId: z.string().optional().describe('Filter by goal ID'),
    limit: z.number().optional().describe('Maximum number of tasks to return')
  });

  constructor(private prisma: PrismaClient) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const where: any = {
        userId: 'user-id' // This should be passed from context
      };

      if (input.completed !== undefined) where.completed = input.completed;
      if (input.priority) where.priority = input.priority;
      if (input.category) where.category = input.category;
      if (input.goalId) where.goalIds = { has: input.goalId };

      const tasks = await this.prisma.task.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { updatedAt: 'desc' }
        ],
        take: input.limit || 20
      });

      return JSON.stringify({
        success: true,
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          category: task.category,
          completed: task.completed,
          dueDate: task.dueDate,
          estimatedMinutes: task.estimatedMinutes,
          actualMinutes: task.actualMinutes
        }))
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class ToggleTaskCompleteTool extends StructuredTool {
  name = 'toggle_task_complete';
  description = 'Toggle the completion status of a task';
  schema = z.object({
    taskId: z.string().describe('ID of the task to toggle'),
    completed: z.boolean().describe('Whether to mark as completed or not')
  });

  constructor(private prisma: PrismaClient) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const task = await this.prisma.task.update({
        where: { id: input.taskId },
        data: {
          completed: input.completed,
          updatedAt: new Date()
        }
      });

      return JSON.stringify({
        success: true,
        task: {
          id: task.id,
          title: task.title,
          completed: task.completed
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 