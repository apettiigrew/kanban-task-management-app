'use client'

import { apiRequest } from '@/lib/form-error-handler'
import { CreateTask, DeleteTask, MoveTask, ReorderTasks, Task, UpdateTask } from '@/lib/validations/task'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '@/hooks/queries/use-projects'
import { TProject } from '@/models/project'

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
    return useMutation({
        mutationKey: ['createTask'],
        mutationFn: createTask,
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
    return useMutation({
        mutationKey: ['moveTask'],
        mutationFn: moveTask,
    })
}

export const useReorderTasks = () => {
    return useMutation({
        mutationKey: ['reorderTasks'],
        mutationFn: reorderTasks,
    })
}

