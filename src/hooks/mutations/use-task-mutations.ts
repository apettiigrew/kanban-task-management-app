'use client'

import { apiRequest, FormError } from '@/lib/form-error-handler'
import { CreateTask, DeleteTask, MoveTask, ReorderTasks, Task, UpdateTask } from '@/lib/validations/task'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '@/hooks/queries/use-projects'
import { TProject } from '@/models/project'
import { TCard } from '@/models/card'

// API client functions for mutations
const createTask = async (data: CreateTask): Promise<Task> => {
    return apiRequest<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

const updateTask = async (data: UpdateTask): Promise<Task> => {
    return apiRequest<Task>(`/api/tasks/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

const deleteTask = async (data: DeleteTask): Promise<void> => {
    return apiRequest<void>(`/api/tasks/${data.id}`, {
        method: 'DELETE',
    })
}

const moveTask = async (data: MoveTask): Promise<void> => {
    return apiRequest<void>('/api/tasks/move', {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

const reorderTasks = async (data: ReorderTasks): Promise<void> => {
    return apiRequest<void>('/api/tasks', {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export const useCreateTask = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['createTask'],
        mutationFn: createTask,
        onMutate: async (newTask) => {
            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(newTask.projectId) })

            // Snapshot the previous value for rollback
            const previousProject = queryClient.getQueryData(projectKeys.detail(newTask.projectId))

            // Optimistically add the task to the cache
            queryClient.setQueryData(projectKeys.detail(newTask.projectId), (oldData: TProject | undefined) => {
                if (!oldData) return oldData

                // Create optimistic task
                const optimisticTask: TCard = {
                    id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    title: newTask.title,
                    description: newTask.description || '',
                    columnId: newTask.columnId,
                    projectId: newTask.projectId,
                    order: newTask.order,
                    checklists: [],
                    totalChecklistItems: 0,
                    totalCompletedChecklistItems: 0,
                }

                return {
                    ...oldData,
                    columns: oldData.columns.map(column => 
                        column.id === newTask.columnId 
                            ? { ...column, cards: [...column.cards, optimisticTask] }
                            : column
                    )
                }
            })

            console.log("calling mutate inside useCreateTask onMutate");
            return { previousProject, projectId: newTask.projectId }
        },
        onError: (error: FormError, newTask, context) => {
            // Revert to previous state on error
            if (context?.previousProject && context?.projectId) {
                queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
            }
        },
        onSettled: (data, error, newTask) => {
            console.log("calling invalidateQueries inside useCreateTask");
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(newTask.projectId) })
        },
    })
}

export const useUpdateTask = () => {
    return useMutation({
        mutationKey: ['updateTask'],
        mutationFn: updateTask,
    })
}

export const useDeleteTask = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['deleteTask'],
        mutationFn: deleteTask,
        onMutate: async (variables: DeleteTask) => {
            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(variables.projectId) })

            // Snapshot the previous value for rollback
            const previousProject = queryClient.getQueryData(projectKeys.detail(variables.projectId))

            // Optimistically update by removing the task from the cache
            queryClient.setQueryData(projectKeys.detail(variables.projectId), (old: TProject | undefined) => {
                if (!old || !old.columns) return old

                return {
                    ...old,
                    columns: old.columns.map((column) => ({
                        ...column,
                        cards: column.cards?.filter((card) => card.id !== variables.id) || []
                    }))
                }
            })

            // Return a context object with the previous value
            return { previousProject, variables }
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousProject) {
                queryClient.setQueryData(projectKeys.detail(variables.projectId), context.previousProject)
            }
        },
        onSettled: (data, error, variables) => {
            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
        }
    })
}


export const useMoveTask = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['moveTask'],
        mutationFn: moveTask,
        onMutate: async (moveData) => {
            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(moveData.projectId) })

            // Snapshot the previous value for rollback
            const previousProject = queryClient.getQueryData(projectKeys.detail(moveData.projectId))    
            
            // Optimistically update the cache with the new column state
            queryClient.setQueryData(projectKeys.detail(moveData.projectId), (oldData: TProject | undefined) => {
                if (!oldData) return oldData
                return {
                    ...oldData,
                    columns: moveData.columns
                }
            })

            return { previousProject, projectId: moveData.projectId }
        },
        onError: (error: FormError, moveData, context) => {
            // Revert to previous state on error
            if (context?.previousProject && context?.projectId) {
                queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
            }
        },
        onSettled: (data, error, moveData) => {
            // Always refetch after error or success to ensure consistency with server
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(moveData.projectId) })
        },
    })
}

export const useReorderTasks = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['reorderTasks'],
        mutationFn: reorderTasks,
        onMutate: async (reorderData) => {
            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(reorderData.projectId) })

            // Get snapshot of previous state
            const previousProject = queryClient.getQueryData(projectKeys.detail(reorderData.projectId))

            // Optimistically reorder tasks within the column
            queryClient.setQueryData(projectKeys.detail(reorderData.projectId), (oldData: TProject | undefined) => {
                if (!oldData) return oldData
                return { ...oldData, columns: reorderData.columns }
            })

            return { previousProject, projectId: reorderData.projectId }
        },
        onError: (error: FormError, reorderData, context) => {
            // Revert to previous state on error
            if (context?.previousProject && context?.projectId) {
                queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
            }
        },
        onSettled: (data, error, reorderData) => {
            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(reorderData.projectId) })
        },
    })
}


