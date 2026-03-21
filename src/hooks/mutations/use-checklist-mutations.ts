'use client'

import { apiRequest, FormError } from '@/lib/form-error-handler'
import { Checklist, ChecklistItem, CreateChecklist, CreateChecklistItem, UpdateChecklist, UpdateChecklistItem } from '@/lib/validations/checklist'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '../queries/use-projects'

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

const reorderChecklistItems = async (data: {
    checklistId: string;
    itemOrders: { id: string; order: number; checklistId: string }[]
}): Promise<void> => {
    return apiRequest<void>('/api/checklist-items/reorder', {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

// Create checklist mutation
export const useCreateChecklist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['createChecklist'],
        mutationFn: createChecklist,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}

// Update checklist mutation
export const useUpdateChecklist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['updateChecklist'],
        mutationFn: updateChecklist,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}

// Delete checklist mutation
export const useDeleteChecklist = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['deleteChecklist'],
        mutationFn: deleteChecklist,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}

// Reorder checklists mutation
export const useReorderChecklists = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['reorderChecklists'],
        mutationFn: reorderChecklists,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}

// Create checklist item mutation
export const useCreateChecklistItem = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['createChecklistItem'],
        mutationFn: createChecklistItem,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}

// Update checklist item mutation
export const useUpdateChecklistItem = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['updateChecklistItem'],
        mutationFn: updateChecklistItem,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}

// Delete checklist item mutation
export const useDeleteChecklistItem = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['deleteChecklistItem'],
        mutationFn: deleteChecklistItem,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}

// Reorder checklist items mutation
export const useReorderChecklistItems = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['reorderChecklistItems'],
        mutationFn: reorderChecklistItems,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all })
        },
    })
}
