'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, FormError } from '@/lib/form-error-handler'
import { columnKeys } from '../queries/use-columns'
import { projectKeys } from '../queries/use-projects'
import { ProjectWithColumnsAndTasks, TColumn } from '@/utils/data'

// Types for mutation data
interface CreateColumnData {
  title: string
  projectId: string
  order?: number
}

interface UpdateColumnData {
  id: string
  title: string
  projectId: string
}

interface ReorderColumnsData {
  projectId: string
  columnOrders: Array<{
    id: string
    order: number
  }>
}

// API client functions for mutations
const createColumn = async (data: CreateColumnData): Promise<TColumn & { taskCount: number }> => {
  return apiRequest<TColumn & { taskCount: number }>('/api/columns', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const updateColumn = async (data: UpdateColumnData): Promise<TColumn & { taskCount: number }> => {
  return apiRequest<TColumn & { taskCount: number }>(`/api/columns/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const deleteColumn = async (data: { id: string, projectId: string }): Promise<void> => {
  return apiRequest<void>(`/api/columns/${data.id}`, {
    method: 'DELETE',
  })
}

const reorderColumns = async (data: ReorderColumnsData): Promise<void> => {
  return apiRequest<void>('/api/columns', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Enhanced mutation hooks with form error handling and optimistic updates
interface UseCreateColumnOptions {
  onSuccess?: (data: TColumn & { taskCount: number }) => void
  onError?: (error: FormError) => void
  onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseUpdateColumnOptions {
  onSuccess?: (data: TColumn & { taskCount: number }) => void
  onError?: (error: FormError) => void
  onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseDeleteColumnOptions {
  onSuccess?: () => void
  onError?: (error: FormError) => void
}

interface UseReorderColumnsOptions {
  onSuccess?: () => void
  onError?: (error: FormError) => void
}

export const useCreateColumn = (options: UseCreateColumnOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['createColumn'],
    mutationFn: createColumn,
    onError: (error: FormError) => {
      if (error.fieldErrors && options.onFieldErrors) {
        options.onFieldErrors(error.fieldErrors)
      } else if (options.onError) {
        options.onError(error)
      }
    },
    onSuccess: (data, variables) => {
      if (options.onSuccess) {
        options.onSuccess(data)
      }
    },
  })
}

export const useUpdateColumn = (options: UseUpdateColumnOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['updateColumn'],
    mutationFn: updateColumn,
    onMutate: async ({ id, title, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) })

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(projectId))

      // Optimistically update the column
      queryClient.setQueryData(projectKeys.detail(projectId), (old: ProjectWithColumnsAndTasks) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map(col => 
            col.id === id 
              ? { ...col, title } 
              : col
          )
        }
      })

      return { previousProject }
    },
    onError: (error: FormError, { id, title, projectId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(projectId), context.previousProject)
      }

      if (error.fieldErrors && options.onFieldErrors) {
        options.onFieldErrors(error.fieldErrors)
      } else if (options.onError) {
        options.onError(error)
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.projectId) })

      if (options.onSuccess) {
        options.onSuccess(data)
      }
    },
  })
}

export const useDeleteColumn = (options: UseDeleteColumnOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['deleteColumn'],
    mutationFn: deleteColumn,
    onError: (error: FormError, data) => {
      if (options.onError) {
        options.onError(error)
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
      if (options.onSuccess) {
        options.onSuccess()
      }
    },
  })
}

export const useReorderColumns = (options: UseReorderColumnsOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['reorderColumns'],
    mutationFn: reorderColumns,
    onError: (error: FormError, data) => {
      if (options.onError) {
        options.onError(error)
      }
    },
    onSuccess: (result, data) => {
      queryClient.refetchQueries({ queryKey: projectKeys.detail(data.projectId) })
      if (options.onSuccess) {
        options.onSuccess()
      }
    },
  })
}

// Utility hooks for mutation states
export const useColumnMutationStates = () => {
  const queryClient = useQueryClient()

  return {
    isCreating: queryClient.isMutating({ mutationKey: ['createColumn'] }) > 0,
    isUpdating: queryClient.isMutating({ mutationKey: ['updateColumn'] }) > 0,
    isDeleting: queryClient.isMutating({ mutationKey: ['deleteColumn'] }) > 0,
    isReordering: queryClient.isMutating({ mutationKey: ['reorderColumns'] }) > 0,
  }
}

