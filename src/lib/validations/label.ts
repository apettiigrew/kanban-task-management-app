import { z } from 'zod'

// Base label schema
export const labelSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Label title is required').max(50, 'Label title must be less than 50 characters'),
  color: z.string().min(1, 'Label color is required').max(20, 'Label color must be less than 20 characters'),
  checked: z.boolean().default(false),
  projectId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for creating a new label
export const createLabelSchema = z.object({
  title: z.string().min(1, 'Label title is required').max(50, 'Label title must be less than 50 characters'),
  color: z.string().min(1, 'Label color is required').max(20, 'Label color must be less than 20 characters'),
  projectId: z.string().cuid(),
  checked: z.boolean().default(true),
})

// Schema for updating a label (mainly for checking/unchecking)
export const updateLabelSchema = z.object({
  title: z.string().min(1, 'Label title is required').max(50, 'Label title must be less than 50 characters').optional(),
  color: z.string().min(1, 'Label color is required').max(20, 'Label color must be less than 20 characters').optional(),
  checked: z.boolean()
})

// Type exports
export type Label = z.infer<typeof labelSchema>
export type CreateLabel = z.infer<typeof createLabelSchema>
export type UpdateLabel = z.infer<typeof updateLabelSchema>
