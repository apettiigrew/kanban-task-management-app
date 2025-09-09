"use client"

import { apiRequest } from '@/lib/form-error-handler'
import { TColumn } from '@/models/column'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '../queries/use-projects'

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

interface CopyColumnData {
  title: string
  columnId: string
  projectId: string
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

const copyColumn = async (data: CopyColumnData): Promise<TColumn> => {
  return apiRequest<TColumn & { taskCount: number }>(`/api/columns/${data.columnId}/copy`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}


export const useCreateColumn = () => {
  return useMutation({
    mutationKey: ['createColumn'],
    mutationFn: createColumn,
  })
}

export const useUpdateColumn = () => {
  return useMutation({
    mutationKey: ['updateColumn'],
    mutationFn: updateColumn
  })
}

export const useDeleteColumn = () => {
  return useMutation({
    mutationKey: ['deleteColumn'],
    mutationFn: deleteColumn,
  })
}

export const useReorderColumns = () => {
  const queryClient = useQueryClient()

    return useMutation({
    mutationKey: ['reorderColumns'],
    mutationFn: reorderColumns,
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
    }
  })
}

export const useCopyColumn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['copyColumn'],
    mutationFn: copyColumn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(variables.projectId) })

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(variables.projectId))

      // Optimistically update the cache with a temporary column
      queryClient.setQueryData(projectKeys.detail(variables.projectId), (oldProject: any) => {
        if (!oldProject) return oldProject

        const maxOrder = Math.max(...oldProject.columns.map((col: TColumn) => col.order), -1)
        const tempColumn: TColumn = {
          id: `temp-${Date.now()}`,
          title: variables.title,
          projectId: variables.projectId,
          order: maxOrder + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          cards: oldProject.columns.find((col: TColumn) => col.id === variables.columnId)?.cards || [],
        }

        return {
          ...oldProject,
          columns: [...oldProject.columns, tempColumn]
        }
      })

      // Return a context object with the snapshotted value
      return { previousProject, projectId: variables.projectId, columnId: variables.columnId }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(variables.projectId), context.previousProject)
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
    }
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
    isCopying: queryClient.isMutating({ mutationKey: ['copyColumn'] }) > 0,
  }
}

