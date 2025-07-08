import { z } from 'zod'

// Base task schema
export const taskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  labels: z.array(z.string().max(30, 'Label must be less than 30 characters')).default([]),
  dueDate: z.date().optional().nullable(),
  projectId: z.string().cuid(),
  columnId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for creating a new task
export const createTaskSchema = z.object({

  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  projectId: z.string().cuid(),
  columnId: z.string().cuid(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
})



// Schema for updating a task
export const updateTaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  columnId: z.string().cuid(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  projectId: z.string().cuid(),
})

export const deleteTaskSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  columnId: z.string().cuid(),
})

// Schema for moving a task (drag and drop)
export const moveTaskSchema = z.object({
  taskId: z.string().cuid(),
  sourceColumnId: z.string().cuid(),
  destinationColumnId: z.string().cuid(),
  destinationOrder: z.number().int().min(0, 'Order must be a non-negative integer'),
  projectId: z.string().cuid(),
  columns: z.array(z.object({
    id: z.string().cuid(),
    title: z.string(),
    cards: z.array(
      createTaskSchema.extend({
        id: z.string().cuid()
      })
    ),
  })).min(1, 'At least one column must be provided'),
})

// Schema for reordering tasks within a column
export const reorderTasksSchema = z.object({
  columnId: z.string().cuid(),
  projectId: z.string().cuid(),
  taskOrders: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().int().min(0),
  })).min(1, 'At least one task order must be provided'),
  columns: z.array(z.object({
    id: z.string().cuid(),
    title: z.string(),
    cards: createTaskSchema.array(),
  })).min(1, 'At least one column must be provided'),
})


// Schema for task with relations
export const taskWithRelationsSchema = taskSchema.extend({
  project: z.object({
    id: z.string().cuid(),
    title: z.string(),
  }).optional(),
  column: z.object({
    id: z.string().cuid(),
    title: z.string(),
  }).optional(),
})

// Type exports 
export type Task = z.infer<typeof taskSchema>
export type CreateTask = z.infer<typeof createTaskSchema>
export type UpdateTask = z.infer<typeof updateTaskSchema>
export type DeleteTask = z.infer<typeof deleteTaskSchema>
export type MoveTask = z.infer<typeof moveTaskSchema>
export type ReorderTasks = z.infer<typeof reorderTasksSchema>
export type TaskWithRelations = z.infer<typeof taskWithRelationsSchema>
