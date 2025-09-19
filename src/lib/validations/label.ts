import { z } from 'zod'

// Base label schema (board level)
export const labelSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Label title is required').max(50, 'Label title must be less than 50 characters'),
  color: z.string().min(1, 'Label color is required').max(20, 'Label color must be less than 20 characters'),
  projectId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Card label schema (card level with checked status)
export const cardLabelSchema = z.object({
  id: z.string().cuid(),
  checked: z.boolean().default(false),
  cardId: z.string().cuid(),
  labelId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for creating a new label at board level
export const createLabelSchema = z.object({
  cardId: z.string().cuid(),
  title: z.string().min(1, 'Label title is required').max(500, 'Label title must be less than 50 characters'),
  color: z.string().min(1, 'Label color is required').max(20, 'Label color must be less than 20 characters'),
  projectId: z.string().cuid(),
})

// Schema for updating a label (title/color at board level)
export const updateLabelSchema = z.object({
  title: z.string().min(1, 'Label title is required').max(50, 'Label title must be less than 50 characters').optional(),
  color: z.string().min(1, 'Label color is required').max(20, 'Label color must be less than 20 characters').optional(),
})

// Schema for creating a card label
export const createCardLabelSchema = z.object({
  cardId: z.string().cuid(),
  labelId: z.string().cuid(),
  checked: z.boolean().default(false),
})

// Schema for updating a card label (checked status)
export const updateCardLabelSchema = z.object({
  checked: z.boolean(),
})

// Type exports
export type Label = z.infer<typeof labelSchema>
export type CardLabel = z.infer<typeof cardLabelSchema>
export type CreateLabel = z.infer<typeof createLabelSchema>
export type UpdateLabel = z.infer<typeof updateLabelSchema>
export type CreateCardLabel = z.infer<typeof createCardLabelSchema>
export type UpdateCardLabel = z.infer<typeof updateCardLabelSchema>
