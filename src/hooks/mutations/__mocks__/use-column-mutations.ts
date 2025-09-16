// Mock implementation of column mutation hooks for testing

const mockCreateColumn = jest.fn()
const mockUpdateColumn = jest.fn()
const mockDeleteColumn = jest.fn()
const mockReorderColumns = jest.fn()
const mockCopyColumn = jest.fn()
const mockMoveColumn = jest.fn()
const mockRepositionColumn = jest.fn()
const mockSortCards = jest.fn()
const mockSortColumns = jest.fn()

// Mock mutation return type
interface MockMutation<TData = any, TVariables = any> {
  mutate: jest.Mock<void, [TVariables]>
  mutateAsync: jest.Mock<Promise<TData>, [TVariables]>
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  error: any
  data: TData | undefined
  reset: jest.Mock
}

// Default mock implementation
const createMockMutation = <TData = any, TVariables = any>(
  mutationFn = jest.fn()
): MockMutation<TData, TVariables> => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: undefined,
  reset: jest.fn(),
})

export const useCreateColumn = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockCreateColumn)
  
  // Set up default behavior - success case
  mutation.mutate.mockImplementation((variables) => {
    const mockResult = {
      id: 'new-column-id',
      title: variables.title,
      projectId: variables.projectId,
      order: variables.order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      cards: [],
      taskCount: 0,
    }
    
    // Simulate async behavior
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useUpdateColumn = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockUpdateColumn)
  
  mutation.mutate.mockImplementation((variables) => {
    const mockResult = {
      id: variables.id,
      title: variables.title,
      projectId: variables.projectId,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      cards: [],
      taskCount: 0,
    }
    
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useDeleteColumn = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockDeleteColumn)
  
  mutation.mutate.mockImplementation((variables) => {
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess()
      }
    }, 0)
  })
  
  return mutation
})

export const useReorderColumns = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockReorderColumns)
  
  mutation.mutate.mockImplementation((variables) => {
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess()
      }
    }, 0)
  })
  
  return mutation
})

export const useCopyColumn = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockCopyColumn)
  
  mutation.mutate.mockImplementation((variables) => {
    // Set pending state
    mutation.isPending = true
    mutation.isError = false
    mutation.isSuccess = false
    
    const mockResult = {
      id: 'copied-column-id',
      title: variables.title,
      projectId: variables.projectId,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      cards: [],
      taskCount: 0,
    }
    
    setTimeout(() => {
      // Set success state
      mutation.isPending = false
      mutation.isSuccess = true
      mutation.data = mockResult
      
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useMoveColumn = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockMoveColumn)
  
  mutation.mutate.mockImplementation((variables) => {
    // Set pending state
    mutation.isPending = true
    mutation.isError = false
    mutation.isSuccess = false
    
    const mockResult = {
      id: variables.columnId,
      title: 'Moved Column',
      projectId: variables.targetProjectId,
      order: variables.position - 1, // Convert 1-based position to 0-based order
      createdAt: new Date(),
      updatedAt: new Date(),
      cards: [],
      taskCount: 0,
    }
    
    setTimeout(() => {
      // Set success state
      mutation.isPending = false
      mutation.isSuccess = true
      mutation.data = mockResult
      
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useRepositionColumn = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockRepositionColumn)
  
  mutation.mutate.mockImplementation((variables) => {
    // Set pending state
    mutation.isPending = true
    mutation.isError = false
    mutation.isSuccess = false
    
    const mockResult = {
      id: variables.columnId,
      title: 'Repositioned Column',
      projectId: 'project-1', // Same project
      order: variables.position - 1, // Convert 1-based position to 0-based order
      createdAt: new Date(),
      updatedAt: new Date(),
      cards: [],
      taskCount: 0,
    }
    
    setTimeout(() => {
      // Set success state
      mutation.isPending = false
      mutation.isSuccess = true
      mutation.data = mockResult
      
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useSortCards = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockSortCards)
  
  mutation.mutate.mockImplementation((variables) => {
    // Set pending state
    mutation.isPending = true
    mutation.isError = false
    mutation.isSuccess = false
    
    const mockResult = {
      success: true,
      message: 'Cards sorted successfully',
    }
    
    setTimeout(() => {
      // Set success state
      mutation.isPending = false
      mutation.isSuccess = true
      mutation.data = mockResult
      
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useSortColumns = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockSortColumns)
  
  mutation.mutate.mockImplementation((variables) => {
    // Set pending state
    mutation.isPending = true
    mutation.isError = false
    mutation.isSuccess = false
    
    const mockResult = {
      success: true,
      message: 'Columns sorted successfully',
    }
    
    setTimeout(() => {
      // Set success state
      mutation.isPending = false
      mutation.isSuccess = true
      mutation.data = mockResult
      
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useColumnMutationStates = jest.fn(() => ({
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isReordering: false,
  isCopying: false,
  isMoving: false,
  isRepositioning: false,
}))

// Helper functions to control mock behavior in tests
export const __setMockError = (hookName: string, error: any) => {
  const hooks = { useCreateColumn, useUpdateColumn, useDeleteColumn, useReorderColumns, useCopyColumn, useMoveColumn, useRepositionColumn, useSortCards, useSortColumns }
  const hook = hooks[hookName as keyof typeof hooks]
  
  if (hook) {
    hook.mockImplementation((options: any = {}) => {
      const mutation = createMockMutation()
      mutation.mutate.mockImplementation(() => {
        // Set pending state
        mutation.isPending = true
        mutation.isError = false
        mutation.isSuccess = false
        
        setTimeout(() => {
          // Set error state
          mutation.isPending = false
          mutation.isError = true
          mutation.error = error
          
          if (options.onError) {
            options.onError(error)
          }
        }, 0)
      })
      return mutation
    })
  }
}

export const __setMockFieldErrors = (hookName: string, fieldErrors: Record<string, string>) => {
  const hooks = { useCreateColumn, useUpdateColumn, useCopyColumn, useMoveColumn, useRepositionColumn, useSortCards, useSortColumns }
  const hook = hooks[hookName as keyof typeof hooks]
  
  if (hook) {
    hook.mockImplementation((options: any = {}) => {
      const mutation = createMockMutation()
      mutation.mutate.mockImplementation(() => {
        setTimeout(() => {
          if (options.onFieldErrors) {
            options.onFieldErrors(fieldErrors)
          }
        }, 0)
      })
      return mutation
    })
  }
}

export const __resetAllMocks = () => {
  useCreateColumn.mockClear()
  useUpdateColumn.mockClear()
  useDeleteColumn.mockClear()
  useReorderColumns.mockClear()
  useCopyColumn.mockClear()
  useMoveColumn.mockClear()
  useRepositionColumn.mockClear()
  useSortCards.mockClear()
  useSortColumns.mockClear()
  useColumnMutationStates.mockClear()
  mockCreateColumn.mockClear()
  mockUpdateColumn.mockClear()
  mockDeleteColumn.mockClear()
  mockReorderColumns.mockClear()
  mockCopyColumn.mockClear()
  mockMoveColumn.mockClear()
  mockRepositionColumn.mockClear()
  mockSortCards.mockClear()
  mockSortColumns.mockClear()
}