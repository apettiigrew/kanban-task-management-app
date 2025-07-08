'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Column, ColumnWithTasks } from '../../types/column'
import { apiRequest, FormError } from '@/lib/form-error-handler'

// Query key factory for columns
export const columnKeys = {
  all: ['columns'] as const,
  lists: () => [...columnKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...columnKeys.lists(), filters] as const,
  details: () => [...columnKeys.all, 'detail'] as const,
  detail: (id: string) => [...columnKeys.details(), id] as const,
  byProject: (projectId: string) => [...columnKeys.all, 'project', projectId] as const,
  byProjectWithTasks: (projectId: string) => [...columnKeys.byProject(projectId), 'withTasks'] as const,
}

// API client functions with enhanced error handling
const fetchColumns = async (projectId?: string): Promise<(Column & { taskCount: number })[]> => {
  const url = projectId ? `/api/columns?projectId=${projectId}` : '/api/columns'
  return apiRequest<(Column & { taskCount: number })[]>(url)
}

const fetchColumn = async (id: string): Promise<Column & { taskCount: number }> => {
  return apiRequest<Column & { taskCount: number }>(`/api/columns/${id}`)
}

const fetchColumnsWithTasks = async (projectId: string): Promise<ColumnWithTasks[]> => {
  return apiRequest<ColumnWithTasks[]>(`/api/columns?projectId=${projectId}&includeTasks=true`)
}

// Query hooks
interface UseColumnsOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
  projectId?: string
}

export const useColumns = (options: UseColumnsOptions = {}) => {
  const { projectId, ...queryOptions } = options
  
  return useQuery({
    queryKey: projectId ? columnKeys.byProject(projectId) : columnKeys.lists(),
    queryFn: () => fetchColumns(projectId),
    enabled: queryOptions.enabled !== false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? true,
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

interface UseColumnOptions extends UseColumnsOptions {
  id: string
}

export const useColumn = ({ id, ...options }: UseColumnOptions) => {
  return useQuery({
    queryKey: columnKeys.detail(id),
    queryFn: () => fetchColumn(id),
    enabled: options.enabled !== false && !!id,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

interface UseColumnsWithTasksOptions extends UseColumnsOptions {
  projectId: string
}

export const useColumnsWithTasks = ({ projectId, ...options }: UseColumnsWithTasksOptions) => {
  return useQuery({
    queryKey: columnKeys.byProjectWithTasks(projectId),
    queryFn: () => fetchColumnsWithTasks(projectId),
    enabled: options.enabled !== false && !!projectId,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    staleTime: options.staleTime ?? 2 * 60 * 1000, // 2 minutes (shorter for tasks)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
} 