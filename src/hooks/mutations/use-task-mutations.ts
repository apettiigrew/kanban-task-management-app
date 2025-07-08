'use client'

import { apiRequest, FormError } from '@/lib/form-error-handler'
import { CreateTask, DeleteTask, MoveTask, ReorderTasks, Task, UpdateTask } from '@/lib/validations/task'
import { ProjectWithColumnsAndTasks } from '@/utils/data'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '../queries/use-projects'

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

// Enhanced mutation hooks with form error handling and optimistic updates
interface UseCreateTaskOptions {
    onSuccess?: (data: Task) => void
    onError?: (error: FormError) => void
    onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseUpdateTaskOptions {
    onSuccess?: (data: Task) => void
    onError?: (error: FormError) => void
    onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseDeleteTaskOptions {
    onSuccess?: () => void
    onError?: (error: FormError) => void
}

interface UseMoveTaskOptions {
    onSuccess?: () => void
    onError?: (error: FormError) => void
}

interface UseReorderTasksOptions {
    onSuccess?: () => void
    onError?: (error: FormError) => void
}


export const useCreateTask = (options: UseCreateTaskOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['createTask'],
        mutationFn: createTask,
        onMutate: async (newTask) => {

            // get snapshot of preivous state
            const previousProject = queryClient.getQueryData(projectKeys.detail(newTask.projectId))

            const optimisticTask: CreateTask & { id: string, createdAt: Date, updatedAt: Date } = {
                id: "temp",
                title: newTask.title,
                description: newTask.description || "",
                order: newTask.order,
                projectId: newTask.projectId,
                columnId: newTask.columnId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            // Optimistically add the new task to various query caches
            queryClient.setQueryData(projectKeys.detail(newTask.projectId), (oldData: ProjectWithColumnsAndTasks) => {
                const column = oldData.columns.find(column => column.id === newTask.columnId)
                if (column) {
                    const newCards = [...column.cards, optimisticTask]
                    const newColumn = { ...column, cards: newCards }
                    const newColumns = oldData.columns.map(column => column.id === newTask.columnId ? newColumn : column)
                    return { ...oldData, columns: newColumns }
                }

                return oldData
            })

            return {
                previousProject
            }
        },
        onError: (error: FormError, newTask, context) => {


            // Handle errors through options
            if (error.fieldErrors && options.onFieldErrors) {
                options.onFieldErrors(error.fieldErrors)
            } else if (options.onError) {
                options.onError(error)
            }
        },
        onSuccess: (data, variables, context) => {
            //Replace optimistic task with real data in all caches
            queryClient.setQueryData(projectKeys.detail(variables.projectId), (oldData: ProjectWithColumnsAndTasks) => {
                const column = oldData.columns.find(column => column.id === variables.columnId)
                if (column) {
                    const newCards = column.cards.map(card => card.id === "temp" ? data : card)
                    const newColumn = { ...column, cards: newCards }
                    const newColumns = oldData.columns.map(column => column.id === variables.columnId ? newColumn : column)
                    return { ...oldData, columns: newColumns }
                }
                return oldData
            })

            if (options.onSuccess) {
                options.onSuccess(data)
            }
        },
    })
}

export const useUpdateTask = (options: UseUpdateTaskOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['updateTask'],
        mutationFn: updateTask,
        onMutate: async (updatedTask) => {
            // Get snapshot of previous state
            const previousProject = queryClient.getQueryData(projectKeys.detail(updatedTask.projectId))

            // Optimistically update the task
            queryClient.setQueryData(projectKeys.detail(updatedTask.projectId), (oldData: ProjectWithColumnsAndTasks) => {
                const column = oldData.columns.find(column => column.id === updatedTask.columnId)
                if (column) {
                    const newCards = column.cards.map(card =>
                        card.id === updatedTask.id ? { ...card, ...updatedTask } : card
                    )
                    const newColumn = { ...column, cards: newCards }
                    const newColumns = oldData.columns.map(column =>
                        column.id === updatedTask.columnId ? newColumn : column
                    )
                    return { ...oldData, columns: newColumns }
                }
                return oldData
            })

            return { previousProject }
        },
        onError: (error: FormError, variables, context) => {
            // Revert to previous state on error
            if (context?.previousProject) {
                queryClient.setQueryData(projectKeys.detail(variables.projectId), context.previousProject)
            }

            if (error.fieldErrors && options.onFieldErrors) {
                options.onFieldErrors(error.fieldErrors)
            } else if (options.onError) {
                options.onError(error)
            }
        },
        onSuccess: (data, variables) => {
            // Replace optimistic update with real data
            queryClient.setQueryData(projectKeys.detail(variables.projectId), (oldData: ProjectWithColumnsAndTasks) => {
                const column = oldData.columns.find(column => column.id === variables.columnId)
                if (column) {
                    const newCards = column.cards.map(card =>
                        card.id === variables.id ? data : card
                    )
                    const newColumn = { ...column, cards: newCards }
                    const newColumns = oldData.columns.map(column =>
                        column.id === variables.columnId ? newColumn : column
                    )
                    return { ...oldData, columns: newColumns }
                }
                return oldData
            })

            if (options.onSuccess) {
                options.onSuccess(data)
            }
        },
    })
}

export const useDeleteTask = (options: UseDeleteTaskOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['deleteTask'],
        mutationFn: deleteTask,
        onMutate: async ({ id, projectId, columnId }) => {
            // Get snapshot of previous state
            const previousProject = queryClient.getQueryData(projectKeys.detail(projectId))

            // Optimistically remove the task
            queryClient.setQueryData(projectKeys.detail(projectId), (oldData: ProjectWithColumnsAndTasks) => {
                const column = oldData.columns.find(column => column.id === columnId)
                if (column) {
                    const newCards = column.cards.filter(card => card.id !== id)
                    const newColumn = { ...column, cards: newCards }

                    const newColumns = oldData.columns.map(column =>
                        column.id === columnId ? newColumn : column
                    )
                    return { ...oldData, columns: newColumns }
                }
                return oldData
            })

            return { previousProject, projectId }
        },
        onError: (error: FormError, taskId, context) => {
            // Revert to previous state on error
            if (context?.previousProject && context?.projectId) {
                queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
            }

            if (options.onError) {
                options.onError(error)
            }
        },
        onSuccess: (data, taskId, context) => {
            // Invalidate related queries to ensure consistency
            if (context?.projectId) {
                queryClient.invalidateQueries({ queryKey: projectKeys.detail(context.projectId) })
            }

            if (options.onSuccess) {
                options.onSuccess()
            }
        },
    })
}

export const useMoveTask = (options: UseMoveTaskOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['moveTask'],
        mutationFn: moveTask,
        onMutate: async (moveData) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(moveData.projectId) })

            // Get snapshot of previous state
            const previousProject = queryClient.getQueryData(projectKeys.detail(moveData.projectId))

            // Optimistically update the cache
            queryClient.setQueryData(projectKeys.detail(moveData.projectId), (oldData: ProjectWithColumnsAndTasks) => {
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

            if (options.onError) {
                options.onError(error)
            }
        },
        onSuccess: (data, moveData, context) => {
            // Update with server response
            queryClient.setQueryData(projectKeys.detail(moveData.projectId), (oldData: ProjectWithColumnsAndTasks) => {
                if (!oldData) return oldData
                return {
                    ...oldData,
                    columns: moveData.columns
                }
            })

            if (options.onSuccess) {
                options.onSuccess()
            }
        },
    })
}

export const useReorderTasks = (options: UseReorderTasksOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['reorderTasks'],
        mutationFn: reorderTasks,
        onMutate: async (reorderData) => {
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(reorderData.projectId) })

            // Get snapshot of previous state
            const previousProject = queryClient.getQueryData(projectKeys.detail(reorderData.projectId))

            // Optimistically reorder tasks within the column
            queryClient.setQueryData(projectKeys.detail(reorderData.projectId), (oldData: ProjectWithColumnsAndTasks) => {
                return { ...oldData, columns: reorderData.columns }
            })

            return { previousProject, projectId: reorderData.projectId }
        },
        onError: (error: FormError, reorderData, context) => {
            // Revert to previous state on error
            if (context?.previousProject && context?.projectId) {
                queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
            }

            if (options.onError) {
                options.onError(error)
            }
        },
        onSuccess: (data, reorderData, context) => {
            // Invalidate related queries to ensure consistency
            if (context?.projectId) {
                queryClient.invalidateQueries({ queryKey: projectKeys.detail(context.projectId) })
            }

            if (options.onSuccess) {
                options.onSuccess()
            }
        },
    })
}

