import { z } from 'zod'

// common validation patterns
export const commonValidations = {
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  position: z.number().int().min(0, 'Position must be a non-negative integer'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}

// Project schemas
export const projectSchemas = {
  create: z.object({
    name: commonValidations.name.max(100, 'Project name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  }),
  update: z.object({
    name: commonValidations.name.max(100, 'Project name must be less than 100 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  }),
  params: z.object({
    id: commonValidations.id,
  }),
}

// Column schemas
export const columnSchemas = {
  create: z.object({
    name: commonValidations.name.max(100, 'Column name must be less than 100 characters'),
    position: commonValidations.position.optional(),
  }),
  update: z.object({
    name: commonValidations.name.max(100, 'Column name must be less than 100 characters').optional(),
    position: commonValidations.position.optional(),
  }),
  bulkUpdate: z.object({
    columns: z.array(z.object({
      id: commonValidations.id,
      name: commonValidations.name.max(100, 'Column name must be less than 100 characters').optional(),
      position: commonValidations.position.optional(),
    })).min(1, 'At least one column update is required'),
  }),
  deleteQuery: z.object({
    force: z.string().optional().transform(val => val === 'true'),
  }),
  params: z.object({
    id: commonValidations.id,
    columnId: commonValidations.id,
  }),
}

// Task schemas
export const taskSchemas = {
  create: z.object({
    title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
    description: commonValidations.description,
    columnId: commonValidations.id,
    position: commonValidations.position.optional(),
  }),
  update: z.object({
    title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters').optional(),
    description: commonValidations.description,
    columnId: commonValidations.id.optional(),
    position: commonValidations.position.optional(),
  }),
  bulkUpdate: z.object({
    tasks: z.array(z.object({
      id: commonValidations.id,
      title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters').optional(),
      description: commonValidations.description,
      columnId: commonValidations.id.optional(),
      position: commonValidations.position.optional(),
    })).min(1, 'At least one task update is required'),
  }),
  params: z.object({
    id: commonValidations.id,
    taskId: commonValidations.id,
  }),
}

// Auth schemas
export const authSchemas = {
  signIn: z.object({
    email: commonValidations.email,
    password: commonValidations.password,
  }),
  signUp: z.object({
    email: commonValidations.email,
    password: commonValidations.password,
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  }),
  resetPassword: z.object({
    email: commonValidations.email,
  }),
}

// Query parameter schemas
export const querySchemas = {
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  }).refine(data => data.page > 0, { message: 'Page must be greater than 0' })
    .refine(data => data.limit > 0 && data.limit <= 100, { message: 'Limit must be between 1 and 100' }),
  
  search: z.object({
    query: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'position']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
}

// Parameter schemas for URL parameters
export const paramSchemas = {
  projectParams: z.object({
    id: commonValidations.id,
  }),
  columnParams: z.object({
    id: commonValidations.id,
    columnId: commonValidations.id,
  }),
  taskParams: z.object({
    id: commonValidations.id,
    taskId: commonValidations.id,
  }),
}

// Export all schemas for easy access
export const validationSchemas = {
  project: projectSchemas,
  column: columnSchemas,
  task: taskSchemas,
  auth: authSchemas,
  query: querySchemas,
  params: paramSchemas,
  common: commonValidations,
}
