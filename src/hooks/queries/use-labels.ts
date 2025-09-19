'use client'

import { apiRequest } from '@/lib/form-error-handler'
import { TLabel, TLabelWithChecked } from '@/models/label'
import { useQuery } from '@tanstack/react-query'

// Query key factory for labels
export const labelKeys = {
  all: ['labels'] as const,
  lists: () => [...labelKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...labelKeys.lists(), filters] as const,
  details: () => [...labelKeys.all, 'detail'] as const,
  detail: (id: string) => [...labelKeys.details(), id] as const,
  byProject: (projectId: string) => [...labelKeys.all, 'project', projectId] as const,
  byCard: (cardId: string) => [...labelKeys.all, 'card', cardId] as const,
}

// API client functions with enhanced error handling
const fetchLabels = async (projectId?: string): Promise<TLabel[]> => {
  const url = projectId ? `/api/labels?projectId=${projectId}` : '/api/labels'
  return apiRequest<TLabel[]>(url)
}

const fetchLabel = async (id: string): Promise<TLabel> => {
  return apiRequest<TLabel>(`/api/labels/${id}`)
}

const fetchLabelsWithCheckedStatus = async (cardId: string): Promise<TLabelWithChecked[]> => {
  return apiRequest<TLabelWithChecked[]>(`/api/labels/by-card/${cardId}`)
}

// Query hooks
export const useLabels = (projectId: string) => {
  return useQuery({
    queryKey: labelKeys.byProject(projectId),
    queryFn: () => fetchLabels(projectId),
  })
}

export const useLabel = (id: string) => {
  return useQuery({
    queryKey: labelKeys.detail(id),
    queryFn: () => fetchLabel(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLabelsWithCheckedStatus = (cardId: string) => {
  return useQuery({
    queryKey: labelKeys.byCard(cardId),
    queryFn: () => fetchLabelsWithCheckedStatus(cardId),
    enabled: !!cardId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}



