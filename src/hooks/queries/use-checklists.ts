'use client'

import { apiRequest, FormError } from '@/lib/form-error-handler'
import { TChecklist } from '@/models/checklist'
import { useQuery } from '@tanstack/react-query'

// Query key factory for checklists
export const checklistKeys = {
  all: ['checklists'] as const,
  lists: () => [...checklistKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...checklistKeys.lists(), filters] as const,
  details: () => [...checklistKeys.all, 'detail'] as const,
  detail: (id: string) => [...checklistKeys.details(), id] as const,
  byCard: (cardId: string) => [...checklistKeys.all, 'card', cardId] as const,
}

// Fetch checklists for a specific card
const fetchChecklistsByCard = async (cardId: string): Promise<TChecklist[]> => {
  const params = new URLSearchParams({ cardId })
  return apiRequest<TChecklist[]>(`/api/checklists?${params.toString()}`)
}

// Options interface for the hook
interface UseChecklistsByCardOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
}

// Hook to fetch checklists for a specific card
export const useChecklistsByCard = (cardId: string, options: UseChecklistsByCardOptions = {}) => {
  return useQuery({
    queryKey: checklistKeys.byCard(cardId),
    queryFn: () => fetchChecklistsByCard(cardId),
    enabled: Boolean(cardId) && (options.enabled !== false),
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    staleTime:0 , 
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
} 