"use client"

import { apiRequest } from '@/lib/form-error-handler'
import { TColumn } from '@/models/column'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
  return useMutation({
    mutationKey: ['reorderColumns'],
    mutationFn: reorderColumns,
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

