"use client"

import { apiRequest } from '@/lib/form-error-handler'
import { TColumn } from '@/models/column'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '../queries/use-projects'
import { sortColumns as sortColumnsApi } from '@/utils/api-client'
import { SortType } from '@/utils/data'
import { TProject } from '@/models/project'

const isCachedProject = (value: unknown): value is TProject => {
  if (typeof value !== 'object' || value === null) return false
  const o = value as Record<string, unknown>
  return typeof o.id === 'string' && Array.isArray(o.columns)
}

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

interface SortCardsData {
  columnId: string
  projectId: string
  sortType: SortType
}

interface SortColumnsData {
  projectId: string
  sortType: SortType
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

const sortCards = async (data: SortCardsData): Promise<unknown> => {
  return apiRequest<unknown>(`/api/columns/${data.columnId}/sort`, {
    method: 'POST',
    body: JSON.stringify({
      sortType: data.sortType,
    }),
  })
}

const sortColumns = async (data: SortColumnsData): Promise<unknown> => {
  return sortColumnsApi(data.projectId, data.sortType)
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
      queryClient.setQueryData(projectKeys.detail(variables.projectId), (oldProject: TProject | undefined) => {
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
      let sourceProject: TProject | null = null
      
      for (const [, project] of allProjects) {
        if (!isCachedProject(project)) continue
        const columnExists = project.columns.find((col: TColumn) => col.id === variables.columnId)
        if (columnExists) {
          sourceProjectId = project.id
          sourceProject = project
          break
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
      const columnToMove = sourceProject.columns.find((col: TColumn) => col.id === variables.columnId)
      
      if (!columnToMove) {
        throw new Error('Column not found in source project')
      }

      // Optimistically update source project (remove the column)
      queryClient.setQueryData(projectKeys.detail(sourceProjectId), (oldProject: TProject | undefined) => {
        if (!oldProject) return oldProject
        return {
          ...oldProject,
          columns: oldProject.columns.filter((col: TColumn) => col.id !== variables.columnId)
        }
      })

      // Optimistically update target project (add the column at new position)
      queryClient.setQueryData(projectKeys.detail(variables.targetProjectId), (oldProject: TProject | undefined) => {
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
      let project: TProject | null = null
      
      for (const [, proj] of allProjects) {
        if (!isCachedProject(proj)) continue
        const columnExists = proj.columns.find((col: TColumn) => col.id === variables.columnId)
        if (columnExists) {
          projectId = proj.id
          project = proj
          break
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
      const columnToMove = project.columns.find((col: TColumn) => col.id === variables.columnId)
      
      if (!columnToMove) {
        throw new Error('Column not found in project')
      }

      // Optimistically update the project with new column order
      queryClient.setQueryData(projectKeys.detail(projectId), (oldProject: TProject | undefined) => {
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
    onSettled: (data, _error, _variables) => {
      // Invalidate the project to ensure data consistency
      if (data) {
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
      }
    }
  })
}

export const useSortCards = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['sortCards'],
    mutationFn: sortCards,
    onMutate: async (variables) => {
      

      // Cancel any outgoing refetches for the project
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(variables.projectId) })
      
      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(variables.projectId)) as TProject


      if (!previousProject) {
        return { 
          previousProject: null, 
          projectId: variables.projectId 
        }
      }

      // Get the column being sorted
      const columnToSort = previousProject?.columns?.find((col: TColumn) => col.id === variables.columnId)
      
      if (!columnToSort || !columnToSort.cards || columnToSort.cards.length < 2) {
        // If column has fewer than 2 cards, no sorting needed
        return { 
          previousProject, 
          projectId: variables.projectId 
        }
      }

      // Sort cards based on sort type
      const sortedCards = [...columnToSort.cards]
      
      switch (variables.sortType) {
        case 'newest-first':
          sortedCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'oldest-first':
          sortedCards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          break
        case 'alphabetical':
          sortedCards.sort((a, b) => a.title.localeCompare(b.title))
          break
      }

      // Update card orders optimistically
      const updatedCards = sortedCards.map((card, index) => ({
        ...card,
        order: index
      }))

      // Optimistically update the project with sorted cards
      queryClient.setQueryData(projectKeys.detail(variables.projectId), (oldProject: TProject | undefined) => {
        if (!oldProject) return oldProject
        
        return {
          ...oldProject,
          columns: oldProject.columns.map((col: TColumn) => 
            col.id === variables.columnId 
              ? { ...col, cards: updatedCards }
              : col
          )
        }
      })

      // Return context for rollback
      return { 
        previousProject, 
        projectId: variables.projectId 
      }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProject && context.projectId) {
        queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
      }
    },
    onSettled: (data, _error, _variables) => {
      // Invalidate the project to ensure data consistency
      if (data) {
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
      }
    }
  })
}

export const useSortColumns = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['sortColumns'],
    mutationFn: sortColumns,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for the project
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(variables.projectId) })
      
      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(variables.projectId))

      if (!isCachedProject(previousProject)) {
        return { 
          previousProject: null, 
          projectId: variables.projectId 
        }
      }

      const project = previousProject
      const columns = project.columns

      if (columns.length < 2) {
        // If project has fewer than 2 columns, no sorting needed
        return { 
          previousProject, 
          projectId: variables.projectId 
        }
      }

      // Sort columns based on sort type
      const sortedColumns = [...columns]
      
      switch (variables.sortType) {
        case 'newest-first':
          sortedColumns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'oldest-first':
          sortedColumns.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          break
        case 'alphabetical':
          sortedColumns.sort((a, b) => a.title.localeCompare(b.title))
          break
      }

      // Update column orders optimistically
      const updatedColumns = sortedColumns.map((column, index) => ({
        ...column,
        order: index
      }))

      // Optimistically update the project with sorted columns
      queryClient.setQueryData(projectKeys.detail(variables.projectId), (oldProject: TProject | undefined) => {
        if (!oldProject) return oldProject
        
        return {
          ...oldProject,
          columns: updatedColumns
        }
      })

      // Return context for rollback
      return { 
        previousProject, 
        projectId: variables.projectId 
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousProject && context.projectId) {
        queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
      }
    },
    onSettled: (data, error, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
      }
    }
  })
}
