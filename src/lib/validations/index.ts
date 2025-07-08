// Export all validation schemas
export * from './project'
export * from './column'
export * from './task'

// Common validation utilities
import { z } from 'zod'

// Common schemas used across multiple models
export const idSchema = z.string().cuid()
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc')

// API response schemas
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  })

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })

// Type exports for common schemas
export type Id = z.infer<typeof idSchema>
export type Pagination = z.infer<typeof paginationSchema>
export type SortOrder = z.infer<typeof sortOrderSchema>
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
export type PaginatedResponse<T> = z.infer<ReturnType<typeof paginatedResponseSchema<z.ZodType<T>>>>
