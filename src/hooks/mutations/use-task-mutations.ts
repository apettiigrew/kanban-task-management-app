'use client'

import { projectKeys } from '@/hooks/queries/use-projects'
import { apiRequest, FormError } from '@/lib/form-error-handler'
import { CreateTask, DeleteTask, MoveTask, MoveAllCards, ReorderTasks, Task, UpdateTask } from '@/lib/validations/task'
import { TCard } from '@/models/card'
import { TProject } from '@/models/project'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleInvalidate } from './invalidation-scheduler'

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

const moveAllCards = async (data: MoveAllCards): Promise<{ movedCount: number; sourceColumnId: string; targetColumnId: string; movedCards: Task[] }> => {
    return apiRequest<{ movedCount: number; sourceColumnId: string; targetColumnId: string; movedCards: Task[] }>('/api/tasks/move-all', {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

interface MutationBehaviorOptions {
    enableOptimisticUpdate?: boolean
    autoInvalidate?: boolean
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
                    createdAt: new Date(),
                }


                return {
                    ...oldData,
                    columns: oldData.columns.map(column => {
                        if (column.id === newTask.columnId) {
                            // Copy cards to avoid mutation
                            const updatedCards = [...column.cards]

                            // Insert new card at the desired position
                            updatedCards.splice(newTask.order, 0, optimisticTask)

                            // Reassign order to every card
                            const reOrderedCards = updatedCards.map((card, index) => ({
                                ...card,
                                order: index
                            }))

                            return {
                                ...column,
                                cards: reOrderedCards
                            }
                        }

                        // All other columns remain unchanged
                        return column
                    })
                }
            })
            
            return { previousProject, projectId: newTask.projectId }
        },
        onError: (error: FormError, newTask, context) => {
            // Revert to previous state on error
            if (context?.previousProject && context?.projectId) {
                queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
            }
        },
        onSettled: (data, error, newTask) => {
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

export const useDeleteTask = (options: MutationBehaviorOptions = {}) => {
    const queryClient = useQueryClient()
    const { enableOptimisticUpdate = true, autoInvalidate = true } = options

    return useMutation({
        mutationKey: ['deleteTask'],
        mutationFn: deleteTask,
        onMutate: async (variables: DeleteTask) => {
            if (!enableOptimisticUpdate) {
                return { previousProject: undefined, variables }
            }

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
                        cards: column.cards?.filter((card) => card.id !== variables.id)
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
            if (!autoInvalidate) {
                return
            }
            scheduleInvalidate(queryClient, projectKeys.detail(variables.projectId))
        }
    })
}


export const useMoveTask = (options: MutationBehaviorOptions = {}) => {
    const queryClient = useQueryClient()
    const { enableOptimisticUpdate = true, autoInvalidate = true } = options

    return useMutation({
        mutationKey: ['moveTask'],
        mutationFn: moveTask,
        onMutate: async (moveData) => {
            if (!enableOptimisticUpdate) {
                return { previousProject: undefined, projectId: moveData.projectId }
            }

            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(moveData.projectId) })

            // Snapshot the previous value for rollback
            const previousProject = queryClient.getQueryData(projectKeys.detail(moveData.projectId))

            // Optimistically update the cache with patched column order snapshots
            queryClient.setQueryData(projectKeys.detail(moveData.projectId), (oldData: TProject | undefined) => {
                if (!oldData) return oldData

                const patchMap = new Map(moveData.columnPatches.map((patch) => [patch.id, patch.cards]))
                const cardMap = new Map<string, TCard>()
                oldData.columns.forEach((column) => {
                    column.cards.forEach((card) => cardMap.set(String(card.id), card))
                })

                return {
                    ...oldData,
                    columns: oldData.columns.map((column) => {
                        const patch = patchMap.get(column.id)
                        if (!patch) {
                            return column
                        }

                        const cards = patch
                            .map((cardPatch) => {
                                const existing = cardMap.get(cardPatch.id)
                                if (!existing) {
                                    return null
                                }
                                return {
                                    ...existing,
                                    columnId: column.id,
                                    order: cardPatch.order,
                                }
                            })
                            .filter((card): card is TCard => Boolean(card))

                        return { ...column, cards }
                    })
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
        onSettled: (data, error, variables) => {
            if (!autoInvalidate) {
                return
            }
            scheduleInvalidate(queryClient, projectKeys.detail(variables.projectId))
        }
    })
}

export const useReorderTasks = (options: MutationBehaviorOptions = {}) => {
    const queryClient = useQueryClient()
    const { enableOptimisticUpdate = true, autoInvalidate = true } = options

    return useMutation({
        mutationKey: ['reorderTasks'],
        mutationFn: reorderTasks,
        onMutate: async (reorderData) => {
            if (!enableOptimisticUpdate) {
                return { previousProject: undefined, projectId: reorderData.projectId }
            }

            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(reorderData.projectId) })

            // Get snapshot of previous state
            const previousProject = queryClient.getQueryData(projectKeys.detail(reorderData.projectId))

            // Optimistically reorder tasks within the target column
            queryClient.setQueryData(projectKeys.detail(reorderData.projectId), (oldData: TProject | undefined) => {
                if (!oldData) return oldData
                const orderMap = new Map(reorderData.taskOrders.map((taskOrder) => [taskOrder.id, taskOrder.order]))

                return {
                    ...oldData,
                    columns: oldData.columns.map((column) => {
                        if (column.id !== reorderData.columnId) {
                            return column
                        }

                        const cards = [...column.cards]
                            .map((card) => ({
                                ...card,
                                order: orderMap.get(String(card.id)) ?? card.order,
                            }))
                            .sort((a, b) => a.order - b.order)

                        return {
                            ...column,
                            cards,
                        }
                    })
                }
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
            if (!autoInvalidate) {
                return
            }
            scheduleInvalidate(queryClient, projectKeys.detail(reorderData.projectId))
        },
    })
}

export const useMoveAllCards = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['moveAllCards'],
        mutationFn: moveAllCards,
        onMutate: async (moveData: MoveAllCards) => {
            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: projectKeys.detail(moveData.projectId) })

            // Snapshot the previous value for rollback
            const previousProject = queryClient.getQueryData(projectKeys.detail(moveData.projectId))

            // Optimistically move all cards from source to target column
            queryClient.setQueryData(projectKeys.detail(moveData.projectId), (oldData: TProject | undefined) => {
                if (!oldData) return oldData

                return {
                    ...oldData,
                    columns: oldData.columns.map(column => {
                        if (column.id === moveData.sourceColumnId) {
                            // Remove all cards from source column
                            return {
                                ...column,
                                cards: []
                            }
                        } else if (column.id === moveData.targetColumnId) {
                            // Get cards from source column
                            const sourceColumn = oldData.columns.find(col => col.id === moveData.sourceColumnId)
                            const sourceCards = sourceColumn?.cards || []
                            
                            // Get current highest order in target column
                            const targetCards = column.cards || []
                            const maxOrder = targetCards.length > 0 
                                ? Math.max(...targetCards.map(card => card.order))
                                : -1

                            // Add source cards to target column with updated orders
                            const movedCards = sourceCards.map((card, index) => ({
                                ...card,
                                columnId: moveData.targetColumnId,
                                order: maxOrder + 1 + index
                            }))

                            return {
                                ...column,
                                cards: [...targetCards, ...movedCards]
                            }
                        }
                        return column
                    })
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
            scheduleInvalidate(queryClient, projectKeys.detail(moveData.projectId))
        },
    })
}


