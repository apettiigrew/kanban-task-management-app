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

interface MoveColumnData {
  columnId: string
  targetProjectId: string
  position: number
}

interface RepositionColumnData {
  columnId: string
  position: number
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

const moveColumn = async (data: MoveColumnData): Promise<TColumn & { taskCount: number }> => {
  return apiRequest<TColumn & { taskCount: number }>(`/api/columns/${data.columnId}/move`, {
    method: 'POST',
    body: JSON.stringify({
      columnId: data.columnId,
      targetProjectId: data.targetProjectId,
      position: data.position,
    }),
  })
}

const repositionColumn = async (data: RepositionColumnData): Promise<TColumn & { taskCount: number }> => {
  return apiRequest<TColumn & { taskCount: number }>(`/api/columns/${data.columnId}/reposition`, {
    method: 'PUT',
    body: JSON.stringify({
      columnId: data.columnId,
      position: data.position,
    }),
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

export const useMoveColumn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['moveColumn'],
    mutationFn: moveColumn,
    onMutate: async (variables) => {
      // Find the source project by looking for the column in all projects
      const allProjects = queryClient.getQueriesData({ queryKey: projectKeys.all })
      let sourceProjectId = ''
      let sourceProject = null
      
      for (const [, project] of allProjects) {
        if (project && (project as any).columns) {
          const columnExists = (project as any).columns.find((col: TColumn) => col.id === variables.columnId)
          if (columnExists) {
            sourceProjectId = (project as any).id
            sourceProject = project
            break
          }
        }
      }

      if (!sourceProjectId || !sourceProject) {
        // If we can't find the column in the cache, we'll let the API call handle it
        // This is common in test environments where the cache might not be populated
        return { 
          previousSourceProject: null, 
          previousTargetProject: null, 
          sourceProjectId: '', 
          targetProjectId: variables.targetProjectId 
        }
      }

      // Cancel any outgoing refetches for both source and target projects
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(sourceProjectId) })
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(variables.targetProjectId) })
      
      // Snapshot the previous values
      const previousSourceProject = queryClient.getQueryData(projectKeys.detail(sourceProjectId))
      const previousTargetProject = queryClient.getQueryData(projectKeys.detail(variables.targetProjectId))

      // Get the column being moved from source project
      const columnToMove = (sourceProject as any)?.columns?.find((col: TColumn) => col.id === variables.columnId)
      
      if (!columnToMove) {
        throw new Error('Column not found in source project')
      }

      // Optimistically update source project (remove the column)
      queryClient.setQueryData(projectKeys.detail(sourceProjectId), (oldProject: any) => {
        if (!oldProject) return oldProject
        return {
          ...oldProject,
          columns: oldProject.columns.filter((col: TColumn) => col.id !== variables.columnId)
        }
      })

      // Optimistically update target project (add the column at new position)
      queryClient.setQueryData(projectKeys.detail(variables.targetProjectId), (oldProject: any) => {
        if (!oldProject) return oldProject
        
        const updatedColumn = {
          ...columnToMove,
          projectId: variables.targetProjectId,
          order: variables.position - 1, // Convert 1-based position to 0-based order
        }

        // Insert at the correct position and update orders for other columns
        const newColumns = [...oldProject.columns]
        newColumns.splice(variables.position - 1, 0, updatedColumn)
        
        // Update orders for all columns
        const reorderedColumns = newColumns.map((col: TColumn, index: number) => ({
          ...col,
          order: index
        }))

        return {
          ...oldProject,
          columns: reorderedColumns
        }
      })

      // Return context for rollback
      return { 
        previousSourceProject, 
        previousTargetProject, 
        sourceProjectId, 
        targetProjectId: variables.targetProjectId 
      }
    },
    onError: (err, variables, context) => {
      // Rollback both projects on error
      if (context?.previousSourceProject && context.sourceProjectId) {
        queryClient.setQueryData(projectKeys.detail(context.sourceProjectId), context.previousSourceProject)
      }
      if (context?.previousTargetProject && context.targetProjectId) {
        queryClient.setQueryData(projectKeys.detail(context.targetProjectId), context.previousTargetProject)
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate both projects to ensure data consistency
      if (data) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.targetProjectId) })
        // Also invalidate all projects to find the source project
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
      }
    }
  })
}

export const useRepositionColumn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['repositionColumn'],
    mutationFn: repositionColumn,
    onMutate: async (variables) => {
      // Find the project by looking for the column in all projects
      const allProjects = queryClient.getQueriesData({ queryKey: projectKeys.all })
      let projectId = ''
      let project = null
      
      for (const [, proj] of allProjects) {
        if (proj && (proj as any).columns) {
          const columnExists = (proj as any).columns.find((col: TColumn) => col.id === variables.columnId)
          if (columnExists) {
            projectId = (proj as any).id
            project = proj
            break
          }
        }
      }

      if (!projectId || !project) {
        // If we can't find the column in the cache, we'll let the API call handle it
        // This is common in test environments where the cache might not be populated
        return { 
          previousProject: null, 
          projectId: '' 
        }
      }

      // Cancel any outgoing refetches for the project
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) })
      
      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(projectId))

      // Get the column being repositioned
      const columnToMove = (project as any)?.columns?.find((col: TColumn) => col.id === variables.columnId)
      
      if (!columnToMove) {
        throw new Error('Column not found in project')
      }

      // Optimistically update the project with new column order
      queryClient.setQueryData(projectKeys.detail(projectId), (oldProject: any) => {
        if (!oldProject) return oldProject
        
        // Remove the column from its current position
        const columnsWithoutMoved = oldProject.columns.filter((col: TColumn) => col.id !== variables.columnId)
        
        // Insert at the new position
        const newColumns = [...columnsWithoutMoved]
        newColumns.splice(variables.position - 1, 0, columnToMove)
        
        // Update orders for all columns
        const reorderedColumns = newColumns.map((col: TColumn, index: number) => ({
          ...col,
          order: index
        }))

        return {
          ...oldProject,
          columns: reorderedColumns
        }
      })

      // Return context for rollback
      return { 
        previousProject, 
        projectId 
      }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProject && context.projectId) {
        queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate the project to ensure data consistency
      if (data) {
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
      }
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
    isMoving: queryClient.isMutating({ mutationKey: ['moveColumn'] }) > 0,
    isRepositioning: queryClient.isMutating({ mutationKey: ['repositionColumn'] }) > 0,
  }
}

// Enhanced mutation state hook with more detailed states
export const useColumnMutationStatesDetailed = () => {
  const queryClient = useQueryClient()

  const getMutationState = (mutationKey: string[]) => {
    const mutations = queryClient.getMutationState({ mutationKey })
    if (mutations.length === 0) return 'IDLE'
    
    const mutation = mutations[0]
    if (mutation.status === 'pending') return 'LOADING'
    if (mutation.status === 'success') return 'SUCCESS'
    if (mutation.status === 'error') return 'ERROR'
    
    return 'IDLE'
  }

  const getQueryState = (queryKey: string[]) => {
    const query = queryClient.getQueryState(queryKey)
    if (!query) return 'IDLE'
    
    if (query.isFetching && query.dataUpdatedAt > 0) return 'REFRESHING'
    if (query.isStale) return 'STALE'
    if (query.isFetching) return 'LOADING'
    if (query.error) return 'ERROR'
    if (query.data) return 'SUCCESS'
    
    return 'IDLE'
  }

  return {
    createColumn: getMutationState(['createColumn']),
    updateColumn: getMutationState(['updateColumn']),
    deleteColumn: getMutationState(['deleteColumn']),
    reorderColumns: getMutationState(['reorderColumns']),
    copyColumn: getMutationState(['copyColumn']),
    moveColumn: getMutationState(['moveColumn']),
    repositionColumn: getMutationState(['repositionColumn']),
    // Query states for background updates
    projects: getQueryState(['projects']),
  }
}

// Hook to check if any column mutation is in progress
export const useIsAnyColumnMutationPending = () => {
  const queryClient = useQueryClient()
  
  const mutationKeys = [
    ['createColumn'],
    ['updateColumn'],
    ['deleteColumn'],
    ['reorderColumns'],
    ['copyColumn'],
    ['moveColumn'],
    ['repositionColumn'],
  ]
  
  return mutationKeys.some(key => 
    queryClient.isMutating({ mutationKey: key }) > 0
  )
}

// Hook to check specific project query states
export const useProjectQueryState = (projectId: string) => {
  const queryClient = useQueryClient()
  
  const query = queryClient.getQueryState(projectKeys.detail(projectId))
  if (!query) return 'IDLE'
  
  if (query.isFetching && query.dataUpdatedAt > 0) return 'REFRESHING'
  if (query.isStale) return 'STALE'
  if (query.isFetching) return 'LOADING'
  if (query.error) return 'ERROR'
  if (query.data) return 'SUCCESS'
  
  return 'IDLE'
}

// Hook to invalidate project queries
export const useInvalidateProjectQueries = () => {
  const queryClient = useQueryClient()
  
  return {
    invalidateProject: (projectId: string) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
    },
    invalidateAllProjects: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
    invalidateProjectsList: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    }
  }
}

