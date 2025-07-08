'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Task, TaskWithRelations } from '@/lib/validations/task'
import { apiRequest, FormError } from '@/lib/form-error-handler'

// Query key factory for tasks
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  byProject: (projectId: string) => [...taskKeys.all, 'project', projectId] as const,
  byColumn: (columnId: string) => [...taskKeys.all, 'column', columnId] as const,
  byProjectAndColumn: (projectId: string, columnId: string) => [...taskKeys.all, 'project', projectId, 'column', columnId] as const,
  withRelations: (filters?: Record<string, unknown>) => [...taskKeys.all, 'withRelations', filters] as const,
}

// API client functions with enhanced error handling
const fetchTasks = async (options?: {
  projectId?: string
  columnId?: string
  includeRelations?: boolean
}): Promise<Task[] | TaskWithRelations[]> => {
  const params = new URLSearchParams()
  
  if (options?.projectId) params.append('projectId', options.projectId)
  if (options?.columnId) params.append('columnId', options.columnId)
  if (options?.includeRelations) params.append('includeRelations', 'true')
  
  const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`
  return apiRequest<Task[] | TaskWithRelations[]>(url)
}

const fetchTask = async (id: string, includeRelations?: boolean): Promise<Task | TaskWithRelations> => {
  const params = new URLSearchParams()
  if (includeRelations) params.append('includeRelations', 'true')
  
  const url = `/api/tasks/${id}${params.toString() ? `?${params.toString()}` : ''}`
  return apiRequest<Task | TaskWithRelations>(url)
}

const fetchTasksByProject = async (projectId: string, includeRelations?: boolean): Promise<Task[] | TaskWithRelations[]> => {
  return fetchTasks({ projectId, includeRelations })
}

const fetchTasksByColumn = async (columnId: string, includeRelations?: boolean): Promise<Task[] | TaskWithRelations[]> => {
  return fetchTasks({ columnId, includeRelations })
}

const fetchTasksByProjectAndColumn = async (
  projectId: string, 
  columnId: string, 
  includeRelations?: boolean
): Promise<Task[] | TaskWithRelations[]> => {
  return fetchTasks({ projectId, columnId, includeRelations })
}

// Query hooks
interface UseTasksOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
  includeRelations?: boolean
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const { includeRelations, ...queryOptions } = options
  
  return useQuery({
    queryKey: includeRelations ? taskKeys.withRelations() : taskKeys.lists(),
    queryFn: () => fetchTasks({ includeRelations }),
    enabled: queryOptions.enabled !== false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? true,
    staleTime: queryOptions.staleTime ?? 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

interface UseTaskOptions extends UseTasksOptions {
  id: string
}

export const useTask = ({ id, ...options }: UseTaskOptions) => {
  const { includeRelations, ...queryOptions } = options
  
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => fetchTask(id, includeRelations),
    enabled: queryOptions.enabled !== false && !!id,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? true,
    staleTime: queryOptions.staleTime ?? 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

interface UseTasksByProjectOptions extends UseTasksOptions {
  projectId: string
}

export const useTasksByProject = ({ projectId, ...options }: UseTasksByProjectOptions) => {
  const { includeRelations, ...queryOptions } = options
  
  return useQuery({
    queryKey: taskKeys.byProject(projectId),
    queryFn: () => fetchTasksByProject(projectId, includeRelations),
    enabled: queryOptions.enabled !== false && !!projectId,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? true,
    staleTime: queryOptions.staleTime ?? 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

interface UseTasksByColumnOptions extends UseTasksOptions {
  columnId: string
}

export const useTasksByColumn = ({ columnId, ...options }: UseTasksByColumnOptions) => {
  const { includeRelations, ...queryOptions } = options
  
  return useQuery({
    queryKey: taskKeys.byColumn(columnId),
    queryFn: () => fetchTasksByColumn(columnId, includeRelations),
    enabled: queryOptions.enabled !== false && !!columnId,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? true,
    staleTime: queryOptions.staleTime ?? 1 * 60 * 1000, // 1 minute (more frequent for column tasks)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

interface UseTasksByProjectAndColumnOptions extends UseTasksOptions {
  projectId: string
  columnId: string
}

export const useTasksByProjectAndColumn = ({ 
  projectId, 
  columnId, 
  ...options 
}: UseTasksByProjectAndColumnOptions) => {
  const { includeRelations, ...queryOptions } = options
  
  return useQuery({
    queryKey: taskKeys.byProjectAndColumn(projectId, columnId),
    queryFn: () => fetchTasksByProjectAndColumn(projectId, columnId, includeRelations),
    enabled: queryOptions.enabled !== false && !!projectId && !!columnId,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? true,
    staleTime: queryOptions.staleTime ?? 1 * 60 * 1000, // 1 minute (more frequent for specific filters)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
} 