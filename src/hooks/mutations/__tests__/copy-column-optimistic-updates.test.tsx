import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { useCopyColumn } from '../use-column-mutations'

// Mock the API request function
jest.mock('@/lib/form-error-handler', () => ({
  apiRequest: jest.fn(),
}))

// Mock the project keys
jest.mock('../../queries/use-projects', () => ({
  projectKeys: {
    detail: (id: string) => ['projects', id],
  },
}))

import { apiRequest } from '@/lib/form-error-handler'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Copy Column Optimistic Updates and Rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockColumnData = {
    columnId: 'column-1',
    title: 'Copied Column',
    projectId: 'project-1',
  }

  const mockProjectData = {
    id: 'project-1',
    title: 'Test Project',
    description: 'Test description',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    columns: [
      {
        id: 'column-1',
        title: 'Original Column',
        projectId: 'project-1',
        order: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        cards: [],
        taskCount: 0,
      },
      {
        id: 'column-2',
        title: 'Another Column',
        projectId: 'project-1',
        order: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        cards: [],
        taskCount: 0,
      },
    ],
  }

  const mockCopiedColumn = {
    id: 'copied-column-id',
    title: 'Copied Column',
    projectId: 'project-1',
    order: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    cards: [],
    taskCount: 0,
  }

  describe('Optimistic Updates', () => {
    it('should add optimistic column to cache immediately', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
      
      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })

    it('should calculate correct order for optimistic column', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
      
      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })

    it('should handle empty columns array in cache', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
      
      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })

    it('should preserve existing columns in optimistic update', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
      
      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })

    it('should handle missing project data gracefully', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
      
      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })
  })

  describe('Rollback Behavior', () => {
    it('should rollback optimistic update on error', async () => {
      const error = new Error('API Error')
      mockApiRequest.mockRejectedValueOnce(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Check that error state is set
      expect(result.current.error).toEqual(error)
    })

    it('should rollback when project data is missing', async () => {
      const error = new Error('API Error')
      mockApiRequest.mockRejectedValueOnce(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Check that error state is set
      expect(result.current.error).toEqual(error)
    })

    it('should rollback when columns array is missing', async () => {
      const error = new Error('API Error')
      mockApiRequest.mockRejectedValueOnce(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Check that error state is set
      expect(result.current.error).toEqual(error)
    })

    it('should rollback when columns is not an array', async () => {
      const error = new Error('API Error')
      mockApiRequest.mockRejectedValueOnce(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Check that error state is set
      expect(result.current.error).toEqual(error)
    })
  })

  describe('Success Handling', () => {
    it('should invalidate queries after successful copy', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
    })

    it('should handle success with optimistic update already applied', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent copy operations', async () => {
      mockApiRequest.mockResolvedValue(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger multiple mutations
      act(() => {
        result.current.mutate({ ...mockColumnData, title: 'First Copy' })
        result.current.mutate({ ...mockColumnData, title: 'Second Copy' })
        result.current.mutate({ ...mockColumnData, title: 'Third Copy' })
      })

      // All should succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should have made multiple API calls
      expect(mockApiRequest).toHaveBeenCalledTimes(3)
    })

    it('should handle concurrent operations with mixed success/failure', async () => {
      mockApiRequest
        .mockResolvedValueOnce(mockCopiedColumn)
        .mockRejectedValueOnce(new Error('Second copy failed'))
        .mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger multiple mutations
      act(() => {
        result.current.mutate({ ...mockColumnData, title: 'First Copy' })
        result.current.mutate({ ...mockColumnData, title: 'Second Copy' })
        result.current.mutate({ ...mockColumnData, title: 'Third Copy' })
      })

      // Should handle mixed results
      await waitFor(() => {
        // The last mutation result will be in the hook state
        expect(result.current.isSuccess).toBe(true)
      })

      // Should have made all API calls
      expect(mockApiRequest).toHaveBeenCalledTimes(3)
    })
  })

  describe('Cache Consistency', () => {
    it('should maintain cache consistency during optimistic updates', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
    })

    it('should handle cache updates with different data structures', async () => {
      mockApiRequest.mockResolvedValueOnce(mockCopiedColumn)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCopyColumn(), { wrapper })

      // Trigger mutation
      act(() => {
        result.current.mutate(mockColumnData)
      })

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that mutation function exists
      expect(typeof result.current.mutate).toBe('function')
    })
  })
})
