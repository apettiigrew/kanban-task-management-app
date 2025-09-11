import { z } from 'zod'

// Base column schema
export const columnSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Column title is required').max(50, 'Column title must be less than 50 characters'),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  projectId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for creating a new column
export const createColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50, 'Column title must be less than 50 characters'),
  projectId: z.string().cuid(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
})

// Schema for updating a column
export const updateColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50, 'Column title must be less than 50 characters'),
})

// Schema for reordering columns
export const reorderColumnsSchema = z.object({
  projectId: z.string().cuid(),
  columnOrders: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().int().min(0),
  })).min(1, 'At least one column order must be provided'),
})

// Schema for copying a column
export const copyColumnSchema = z.object({
  title: z.string().min(1, 'List title is required').max(50, 'List title must be less than 50 characters'),
  columnId: z.string().cuid(),
  projectId: z.string().cuid(),
})

// Schema for moving a column to a different board
export const moveColumnSchema = z.object({
  columnId: z.string().cuid(),
  targetProjectId: z.string().cuid(),
  position: z.number().int().min(1, 'Position must be at least 1'),
})

// Schema for repositioning a column within the same board
export const repositionColumnSchema = z.object({
  columnId: z.string().cuid(),
  position: z.number().int().min(1, 'Position must be at least 1'),
})

// Schema for column with tasks
export const columnWithTasksSchema = columnSchema.extend({
  tasks: z.array(z.object({
    id: z.string().cuid(),
    title: z.string(),
    order: z.number(),
    labels: z.array(z.string()),
    dueDate: z.date().nullable(),
  })).optional(),
  _count: z.object({
    tasks: z.number(),
  }).optional(),
})

// Type exports
export type Column = z.infer<typeof columnSchema>
export type CreateColumn = z.infer<typeof createColumnSchema>
export type UpdateColumn = z.infer<typeof updateColumnSchema>
export type ReorderColumns = z.infer<typeof reorderColumnsSchema>
export type CopyColumn = z.infer<typeof copyColumnSchema>
export type MoveColumn = z.infer<typeof moveColumnSchema>
export type RepositionColumn = z.infer<typeof repositionColumnSchema>
export type ColumnWithTasks = z.infer<typeof columnWithTasksSchema>
