'use client'

import { apiRequest, FormError } from '@/lib/form-error-handler'
import { CreateChecklist, CreateChecklistItem, UpdateChecklist, UpdateChecklistItem, Checklist, ChecklistItem } from '@/lib/validations/checklist'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '../queries/use-projects'
import { ProjectWithColumnsAndTasks } from '@/utils/data'

// API client functions for mutations
const createChecklist = async (data: CreateChecklist): Promise<Checklist> => {
    return apiRequest<Checklist>('/api/checklists', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

const updateChecklist = async (data: UpdateChecklist): Promise<Checklist> => {
    return apiRequest<Checklist>(`/api/checklists/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

const deleteChecklist = async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/checklists/${id}`, {
        method: 'DELETE',
    })
}

const createChecklistItem = async (data: CreateChecklistItem): Promise<ChecklistItem> => {
    return apiRequest<ChecklistItem>('/api/checklist-items', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

const updateChecklistItem = async (data: UpdateChecklistItem): Promise<ChecklistItem> => {
    return apiRequest<ChecklistItem>(`/api/checklist-items/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

const deleteChecklistItem = async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/checklist-items/${id}`, {
        method: 'DELETE',
    })
}

const reorderChecklists = async (data: { 
    cardId: string;
    checklistOrders: { id: string; order: number }[] 
}): Promise<void> => {
    return apiRequest<void>('/api/checklists/reorder', {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

// Type definitions for mutation options
interface UseCreateChecklistOptions {
    onSuccess?: (data: Checklist) => void
    onError?: (error: FormError) => void
    onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseUpdateChecklistOptions {
    onSuccess?: (data: Checklist) => void
    onError?: (error: FormError) => void
    onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseDeleteChecklistOptions {
    onSuccess?: () => void
    onError?: (error: FormError) => void
}

interface UseCreateChecklistItemOptions {
    onSuccess?: (data: ChecklistItem) => void
    onError?: (error: FormError) => void
    onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseUpdateChecklistItemOptions {
    onSuccess?: (data: ChecklistItem) => void
    onError?: (error: FormError) => void
    onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseDeleteChecklistItemOptions {
    onSuccess?: () => void
    onError?: (error: FormError) => void
}

interface UseReorderChecklistsOptions {
    onSuccess?: () => void
    onError?: (error: FormError) => void
}

// Create checklist mutation
export const useCreateChecklist = (options: UseCreateChecklistOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['createChecklist'],
        mutationFn: createChecklist,
        onSuccess: (data, variables) => {
            // Find the card in the project data and get projectId
            let projectId: string | null = null
            
            // Get all project queries and find the one containing this card
            const queryCache = queryClient.getQueryCache()
            queryCache.findAll({ queryKey: ['projects'] }).forEach(query => {
                const projectData = query.state.data as ProjectWithColumnsAndTasks
                if (projectData?.columns) {
                    for (const column of projectData.columns) {
                        if (column.cards?.some(card => card.id === variables.cardId)) {
                            projectId = projectData.id
                            break
                        }
                    }
                }
            })

            if (projectId) {
                queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
            }

            if (options.onSuccess) {
                options.onSuccess(data)
            }
        },
        onError: (error: FormError) => {
            if (error.fieldErrors && options.onFieldErrors) {
                options.onFieldErrors(error.fieldErrors)
            } else if (options.onError) {
                options.onError(error)
            }
        },
    })
}

// Update checklist mutation
export const useUpdateChecklist = (options: UseUpdateChecklistOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['updateChecklist'],
        mutationFn: updateChecklist,
        onSuccess: (data) => {
            // Invalidate all project queries since we don't know which project this belongs to
            queryClient.invalidateQueries({ queryKey: ['projects'] })

            if (options.onSuccess) {
                options.onSuccess(data)
            }
        },
        onError: (error: FormError) => {
            if (error.fieldErrors && options.onFieldErrors) {
                options.onFieldErrors(error.fieldErrors)
            } else if (options.onError) {
                options.onError(error)
            }
        },
    })
}

// Delete checklist mutation
export const useDeleteChecklist = (options: UseDeleteChecklistOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['deleteChecklist'],
        mutationFn: deleteChecklist,
        onSuccess: () => {
            if (options.onSuccess) {
                options.onSuccess()
            }
        },
        onError: (error: FormError) => {
            if (options.onError) {
                options.onError(error)
            }
        },
    })
}

// Create checklist item mutation
export const useCreateChecklistItem = (options: UseCreateChecklistItemOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['createChecklistItem'],
        mutationFn: createChecklistItem,
        onSuccess: (data) => {
            // Invalidate all project queries
            queryClient.invalidateQueries({ queryKey: ['projects'] })

            if (options.onSuccess) {
                options.onSuccess(data)
            }
        },
        onError: (error: FormError) => {
            if (error.fieldErrors && options.onFieldErrors) {
                options.onFieldErrors(error.fieldErrors)
            } else if (options.onError) {
                options.onError(error)
            }
        },
    })
}

// Update checklist item mutation
export const useUpdateChecklistItem = (options: UseUpdateChecklistItemOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['updateChecklistItem'],
        mutationFn: updateChecklistItem,
        onSuccess: (data) => {
            // Invalidate all project queries
            queryClient.invalidateQueries({ queryKey: ['projects'] })

            if (options.onSuccess) {
                options.onSuccess(data)
            }
        },
        onError: (error: FormError) => {
            if (error.fieldErrors && options.onFieldErrors) {
                options.onFieldErrors(error.fieldErrors)
            } else if (options.onError) {
                options.onError(error)
            }
        },
    })
}

// Delete checklist item mutation
export const useDeleteChecklistItem = (options: UseDeleteChecklistItemOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['deleteChecklistItem'],
        mutationFn: deleteChecklistItem,
        onSuccess: () => {
            // Invalidate all project queries
            queryClient.invalidateQueries({ queryKey: ['projects'] })

            if (options.onSuccess) {
                options.onSuccess()
            }
        },
        onError: (error: FormError) => {
            if (options.onError) {
                options.onError(error)
            }
        },
    })
}

// Reorder checklists mutation
export const useReorderChecklists = (options: UseReorderChecklistsOptions = {}) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['reorderChecklists'],
        mutationFn: reorderChecklists,
        onSuccess: () => {
            // Invalidate all project queries
            queryClient.invalidateQueries({ queryKey: ['projects'] })

            if (options.onSuccess) {
                options.onSuccess()
            }
        },
        onError: (error: FormError) => {
            if (options.onError) {
                options.onError(error)
            }
        },
    })
}