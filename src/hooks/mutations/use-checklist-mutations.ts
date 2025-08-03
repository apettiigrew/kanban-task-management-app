'use client'

import { apiRequest, FormError } from '@/lib/form-error-handler'
import { Checklist, ChecklistItem, CreateChecklist, CreateChecklistItem, UpdateChecklist, UpdateChecklistItem } from '@/lib/validations/checklist'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
    return useMutation({
        mutationKey: ['createChecklist'],
        mutationFn: createChecklist,
    })
}

// Update checklist mutation
export const useUpdateChecklist = () => {
    return useMutation({
        mutationKey: ['updateChecklist'],
        mutationFn: updateChecklist
    })
}

// Delete checklist mutation
export const useDeleteChecklist = () => {
    return useMutation({
        mutationKey: ['deleteChecklist'],
        mutationFn: deleteChecklist,
    })
}

// Reorder checklists mutation
export const useReorderChecklists = () => {
    return useMutation({
        mutationKey: ['reorderChecklists'],
        mutationFn: reorderChecklists
    })
}

// Create checklist item mutation
export const useCreateChecklistItem = () => {
    return useMutation({
        mutationKey: ['createChecklistItem'],
        mutationFn: createChecklistItem,
    })
}

// Update checklist item mutation
export const useUpdateChecklistItem = () => {
    return useMutation({
        mutationKey: ['updateChecklistItem'],
        mutationFn: updateChecklistItem,
    })
}

// Delete checklist item mutation
export const useDeleteChecklistItem = () => {
    return useMutation({
        mutationKey: ['deleteChecklistItem'],
        mutationFn: deleteChecklistItem,
    })
}

// Reorder checklist items mutation
export const useReorderChecklistItems = () => {
    return useMutation({
        mutationKey: ['reorderChecklistItems'],
        mutationFn: reorderChecklistItems,
    })
}