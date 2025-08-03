import { z } from 'zod'

// Base schemas
export const checklistItemSchema = z.object({
  id: z.string().cuid(),
  text: z.string().min(1, 'Item text is required'),
  isCompleted: z.boolean().default(false),
  order: z.number().int().default(0),
  checklistId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const checklistSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Checklist title is required'),
  order: z.number().int().default(0),
  cardId: z.string().cuid(),
  items: z.array(checklistItemSchema).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Create schemas
export const createChecklistSchema = z.object({
  title: z.string().min(1, 'Checklist title is required').max(200, 'Title too long'),
  cardId: z.string().cuid('Invalid card ID'),
  order: z.number().int().min(0).default(0),
})

export const createChecklistItemSchema = z.object({
  text: z.string().min(1, 'Item text is required').max(500, 'Text too long'),
  checklistId: z.string().cuid('Invalid checklist ID'),
  order: z.number().int().min(0).default(0),
  isCompleted: z.boolean().default(false),
})

// Update schemas
export const updateChecklistSchema = z.object({
  id: z.string().cuid('Invalid checklist ID'),
  title: z.string().min(1, 'Checklist title is required').max(200, 'Title too long').optional(),
  order: z.number().int().min(0).optional(),
})

export const updateChecklistItemSchema = z.object({
  id: z.string().cuid('Invalid item ID'),
  text: z.string().min(1, 'Item text is required').max(500, 'Text too long').optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
})

// Delete schemas
export const deleteChecklistSchema = z.object({
  id: z.string().cuid('Invalid checklist ID'),
})

export const deleteChecklistItemSchema = z.object({
  id: z.string().cuid('Invalid item ID'),
})

// Type exports
export type Checklist = z.infer<typeof checklistSchema>
export type ChecklistItem = z.infer<typeof checklistItemSchema>
export type CreateChecklist = z.infer<typeof createChecklistSchema>
export type CreateChecklistItem = z.infer<typeof createChecklistItemSchema>
export type UpdateChecklist = z.infer<typeof updateChecklistSchema> & { oldTitle: string }
export type UpdateChecklistItem = z.infer<typeof updateChecklistItemSchema>
export type DeleteChecklist = z.infer<typeof deleteChecklistSchema>
export type DeleteChecklistItem = z.infer<typeof deleteChecklistItemSchema> 