// Mock implementation of column mutation hooks for testing

const mockCreateColumn = jest.fn()
const mockUpdateColumn = jest.fn()
const mockDeleteColumn = jest.fn()
const mockReorderColumns = jest.fn()

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
  mutate: mutationFn,
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

export const useColumnMutationStates = jest.fn(() => ({
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isReordering: false,
}))

// Helper functions to control mock behavior in tests
export const __setMockError = (hookName: string, error: any) => {
  const hooks = { useCreateColumn, useUpdateColumn, useDeleteColumn, useReorderColumns }
  const hook = hooks[hookName as keyof typeof hooks]
  
  if (hook) {
    hook.mockImplementation((options: any = {}) => {
      const mutation = createMockMutation()
      mutation.mutate.mockImplementation(() => {
        setTimeout(() => {
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
  const hooks = { useCreateColumn, useUpdateColumn }
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
  useColumnMutationStates.mockClear()
  mockCreateColumn.mockClear()
  mockUpdateColumn.mockClear()
  mockDeleteColumn.mockClear()
  mockReorderColumns.mockClear()
}