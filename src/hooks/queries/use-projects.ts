'use client'

import React from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { apiRequest, FormError, parseApiError } from '@/lib/form-error-handler'
import { ProjectWithColumnsAndTasks, TProject } from '@/utils/data'

// Query key factory for projects
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
}

// API client functions with enhanced error handling
const fetchProjects = async (): Promise<TProject[]> => {
  return apiRequest<TProject[]>('/api/projects')
}

const fetchProject = async (id: string): Promise<TProject> => {
  return apiRequest<ProjectWithColumnsAndTasks>(`/api/projects/${id}?includeRelations=true`)
}

const fetchProjectsWithStats = async (): Promise<TProject[]> => {
  return apiRequest<TProject[]>('/api/projects?includeStats=true')
}

// Types for mutation data
interface CreateProjectData {
  title: string
  description?: string | null
}

interface UpdateProjectData {
  title?: string
  description?: string | null
}

const createProject = async (data: CreateProjectData): Promise<TProject> => {
  return apiRequest<TProject>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const updateProject = async ({ id, data }: { id: string; data: UpdateProjectData }): Promise<TProject> => {
  return apiRequest<TProject>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const deleteProject = async (id: string): Promise<void> => {
  return apiRequest<void>(`/api/projects/${id}`, {
    method: 'DELETE',
  })
}

// Hooks
interface UseProjectsOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
}

export const useProjects = (options: UseProjectsOptions = {}) => {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: fetchProjects,
    enabled: options.enabled !== false,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

interface UseProjectOptions extends UseProjectsOptions {
  id: string
}

export const useProject = ({ id, ...options }: UseProjectOptions) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    enabled: options.enabled !== false && !!id,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    staleTime: options.staleTime ?? 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

export const useProjectsWithStats = (options: UseProjectsOptions = {}) => {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: fetchProjectsWithStats,
    enabled: options.enabled !== false,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    staleTime: options.staleTime ?? 2 * 60 * 1000, // 2 minutes (shorter for stats)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof FormError || (error instanceof Error && error.message.includes('4'))) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Enhanced mutation hooks with form error handling
interface UseCreateProjectOptions {
  onSuccess?: (data: TProject) => void
  onError?: (error: FormError) => void
  onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseUpdateProjectOptions {
  onSuccess?: (data: TProject) => void
  onError?: (error: FormError) => void
  onFieldErrors?: (errors: Record<string, string>) => void
}

interface UseDeleteProjectOptions {
  onSuccess?: () => void
  onError?: (error: FormError) => void
}

export const useCreateProject = (options: UseCreateProjectOptions = {}) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createProject,
    onMutate: async (newProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() })
      await queryClient.cancelQueries({ queryKey: projectKeys.stats() })

      // Snapshot the previous values
      const previousProjects = queryClient.getQueryData(projectKeys.lists())
      const previousProjectsWithStats = queryClient.getQueryData(projectKeys.stats())

      // Create optimistic project with temporary ID
      const optimisticProject: TProject = {
        id: `temp-${Date.now()}`,
        title: newProject.title,
        description: newProject.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        columns: [],
        cards: [],
      }

      // Optimistically add the new project to the list
      queryClient.setQueryData(projectKeys.lists(), (oldData: TProject[] | undefined) => {
        if (oldData) {
          return [...oldData, optimisticProject]
        }
        return [optimisticProject]
      })

      // Optimistically add to stats queries if they exist
      queryClient.setQueryData(projectKeys.stats(), (oldData: TProject[] | undefined) => {
        if (oldData) {
          const optimisticProjectWithStats: TProject = {
            ...optimisticProject
          }
          return [...oldData, optimisticProjectWithStats]
        }
        return undefined // Don't create stats data if it doesn't exist
      })

      // Return a context object with the snapshotted values
      return { previousProjects, previousProjectsWithStats, optimisticProject }
    },
    onError: (error: FormError, newProject, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects)
      }
      if (context?.previousProjectsWithStats) {
        queryClient.setQueryData(projectKeys.stats(), context.previousProjectsWithStats)
      }
      
      console.error('Error in useCreateProject:', error)
      
      // Handle field errors separately if callback provided
      if (options.onFieldErrors && error instanceof FormError && Object.keys(error.fieldErrors).length > 0) {
        options.onFieldErrors(error.fieldErrors)
      }
      
      options.onError?.(error)
    },
    onSuccess: (data, newProject, context) => {
      // Replace optimistic project with real data
      queryClient.setQueryData(projectKeys.lists(), (oldData: TProject[] | undefined) => {
        if (oldData && context?.optimisticProject) {
          return oldData.map(project => 
            project.id === context.optimisticProject.id ? data : project
          )
        }
        return oldData
      })

      // Update stats queries with real data
      queryClient.setQueryData(projectKeys.stats(), (oldData: TProject[] | undefined) => {
        if (oldData && context?.optimisticProject) {
          const projectWithStats: TProject = {
            ...data,
          }
          return oldData.map(project => 
            project.id === context.optimisticProject.id ? projectWithStats : project
          )
        }
        return oldData
      })

      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      // Call custom onSuccess callback if provided
      options.onSuccess?.(data)
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

export const useUpdateProject = (options: UseUpdateProjectOptions = {}) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateProject,
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() })
      await queryClient.cancelQueries({ queryKey: projectKeys.stats() })

      // Snapshot the previous values
      const previousProject = queryClient.getQueryData(projectKeys.detail(id))
      const previousProjects = queryClient.getQueryData(projectKeys.lists())
      const previousProjectsWithStats = queryClient.getQueryData(projectKeys.stats())

      // Optimistically update to the new value
        queryClient.setQueryData(projectKeys.detail(id), (old: TProject | undefined) => {
        if (!old) return old
        return { ...old, ...data, updatedAt: new Date() }
      })

      queryClient.setQueryData(projectKeys.lists(), (old: TProject[] | undefined) => {
        if (!old) return old
        return old.map(project => 
          project.id === id ? { ...project, ...data, updatedAt: new Date() } : project
        )
      })

      // Optimistically update stats queries if they exist
      queryClient.setQueryData(projectKeys.stats(), (old: TProject[] | undefined) => {
        if (!old) return old
        return old.map(project => 
          project.id === id ? { ...project, ...data, updatedAt: new Date() } : project
        )
      })

      // Return a context object with the snapshotted values
      return { previousProject, previousProjects, previousProjectsWithStats }
    },
    onError: (error: FormError, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id), context.previousProject)
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects)
      }
      if (context?.previousProjectsWithStats) {
        queryClient.setQueryData(projectKeys.stats(), context.previousProjectsWithStats)
      }
      
      console.error('Error in useUpdateProject:', error)
      
      // Handle field errors separately if callback provided
      if (options.onFieldErrors && error instanceof FormError && Object.keys(error.fieldErrors).length > 0) {
        options.onFieldErrors(error.fieldErrors)
      }
      
      options.onError?.(error)
    },
    onSuccess: (data, { id }) => {
      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      options.onSuccess?.(data)
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

export const useDeleteProject = (options: UseDeleteProjectOptions = {}) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() })
      await queryClient.cancelQueries({ queryKey: projectKeys.stats() })

      // Snapshot the previous values
      const previousProject = queryClient.getQueryData(projectKeys.detail(id))
      const previousProjects = queryClient.getQueryData(projectKeys.lists())
      const previousProjectsWithStats = queryClient.getQueryData(projectKeys.stats())

      // Optimistically remove the project from the list
      queryClient.setQueryData(projectKeys.lists(), (old: TProject[] | undefined) => {
        if (!old) return old
        return old.filter(project => project.id !== id)
      })

      // Optimistically remove from stats queries if they exist
                queryClient.setQueryData(projectKeys.stats(), (old: TProject[] | undefined) => {
        if (!old) return old
        return old.filter(project => project.id !== id)
      })

      // Remove the individual project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })

      // Return a context object with the snapshotted values
      return { previousProject, previousProjects, previousProjectsWithStats, deletedId: id }
    },
    onError: (error: FormError, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects)
      }
      if (context?.previousProjectsWithStats) {
        queryClient.setQueryData(projectKeys.stats(), context.previousProjectsWithStats)
      }
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id), context.previousProject)
      }
      
      console.error('Error in useDeleteProject:', error)
      options.onError?.(error)
    },
    onSuccess: () => {
      // Invalidate and refetch all project-related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      options.onSuccess?.()
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

// Utility hook for checking if any projects are being modified
export const useInvalidateProjects = () => {
  const queryClient = useQueryClient()
  
  return React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: projectKeys.all })
  }, [queryClient])
}

// Utility hook for centralized mutation state management
export const useProjectMutationStates = () => {
  const queryClient = useQueryClient()
  
  return {
    // Check if any project mutations are currently pending
    isAnyMutationPending: () => {
      const mutations = queryClient.getMutationCache().getAll()
      return mutations.some(mutation => 
        mutation.state.status === 'pending' &&
        (mutation.options.mutationKey?.includes('projects') || 
         mutation.options.mutationFn === createProject ||
         mutation.options.mutationFn === updateProject ||
         mutation.options.mutationFn === deleteProject)
      )
    },
    
    // Get current mutation states
    getMutationStates: () => {
      const mutations = queryClient.getMutationCache().getAll()
      return {
        creating: mutations.some(m => m.state.status === 'pending' && m.options.mutationFn === createProject),
        updating: mutations.some(m => m.state.status === 'pending' && m.options.mutationFn === updateProject),
        deleting: mutations.some(m => m.state.status === 'pending' && m.options.mutationFn === deleteProject),
      }
    }
  }
}

// Utility hook for invalidating column queries
export const useInvalidateProject = () => {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    invalidateByProject: (projectId: string) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId), refetchType: 'all' })
    
    }
  }
} 

// Re-export the key types for convenience
export type { CreateProjectData, UpdateProjectData }
// 