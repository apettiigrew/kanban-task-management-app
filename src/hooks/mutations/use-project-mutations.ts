'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, FormError } from '@/lib/form-error-handler'
import { TProject } from '@/models/project'
import { projectKeys } from '@/hooks/queries/use-projects'

// Types for mutation data
interface UpdateProjectTitleData {
  title: string
}

// API client function for updating project title only
const updateProjectTitle = async ({ id, data }: { id: string; data: UpdateProjectTitleData }): Promise<TProject> => {
  return apiRequest<TProject>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Hook for updating project title without optimistic updates
interface UseUpdateProjectTitleOptions {
  onSuccess?: (data: TProject) => void
  onError?: (error: FormError) => void
}

export const useUpdateProjectTitle = (options: UseUpdateProjectTitleOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProjectTitle,
    onSuccess: (data, { id }) => {
      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })

      options.onSuccess?.(data)
    },
    onError: (error: FormError) => {
      console.error('Error in useUpdateProjectTitle:', error)
      options.onError?.(error)
    },
    retry: (failureCount, error) => {
      // Don't retry on form validation errors
      if (error instanceof FormError) {
        return false
      }
      return failureCount < 2
    },
  })
}

// Re-export the type for convenience
export type { UpdateProjectTitleData }
