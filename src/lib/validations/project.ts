import { z } from 'zod'

// Base project schema
export const projectSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Project title is required').max(100, 'Project title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for creating a new project
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100, 'Project title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
})

// Schema for updating a project
export const updateProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100, 'Project title must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
})

// Schema for project with related data
export const projectWithRelationsSchema = projectSchema.extend({
  columns: z.array(z.object({
    id: z.string().cuid(),
    title: z.string(),
    order: z.number(),
    _count: z.object({
      tasks: z.number(),
    }).optional(),
  })).optional(),
  _count: z.object({
    tasks: z.number(),
    columns: z.number(),
  }).optional(),
})

// Type exports
export type Project = z.infer<typeof projectSchema>
export type CreateProject = z.infer<typeof createProjectSchema>
export type UpdateProject = z.infer<typeof updateProjectSchema>
export type ProjectWithRelations = z.infer<typeof projectWithRelationsSchema>
