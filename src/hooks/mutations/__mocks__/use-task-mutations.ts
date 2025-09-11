// Mock implementation of task mutation hooks for testing

const mockCreateTask = jest.fn()
const mockUpdateTask = jest.fn()
const mockDeleteTask = jest.fn()
const mockMoveTask = jest.fn()
const mockReorderTasks = jest.fn()
const mockMoveAllCards = jest.fn()

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

export const useCreateTask = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockCreateTask)
  
  mutation.mutate.mockImplementation((variables) => {
    const mockResult = {
      id: 'new-task-id',
      title: variables.title,
      projectId: variables.projectId,
      columnId: variables.columnId,
      order: variables.order || 0,
      description: '',
      checklists: [],
      totalChecklistItems: 0,
      totalCompletedChecklistItems: 0,
    }
    
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useUpdateTask = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockUpdateTask)
  
  mutation.mutate.mockImplementation((variables) => {
    const mockResult = {
      id: variables.id,
      title: variables.title || 'Updated Task',
      description: variables.description || '',
      projectId: variables.projectId,
      columnId: variables.columnId,
      order: variables.order || 0,
      checklists: [],
      totalChecklistItems: 0,
      totalCompletedChecklistItems: 0,
    }
    
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useDeleteTask = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockDeleteTask)
  
  mutation.mutate.mockImplementation((variables) => {
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess()
      }
    }, 0)
  })
  
  return mutation
})

export const useMoveTask = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockMoveTask)
  
  mutation.mutate.mockImplementation((variables) => {
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess()
      }
    }, 0)
  })
  
  return mutation
})

export const useReorderTasks = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockReorderTasks)
  
  mutation.mutate.mockImplementation((variables) => {
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess()
      }
    }, 0)
  })
  
  return mutation
})

export const useMoveAllCards = jest.fn((options: any = {}) => {
  const mutation = createMockMutation(mockMoveAllCards)
  
  mutation.mutate.mockImplementation((variables) => {
    const mockResult = {
      movedCount: 2,
      sourceColumnId: variables.sourceColumnId,
      targetColumnId: variables.targetColumnId,
      movedCards: []
    }
    
    setTimeout(() => {
      if (options.onSuccess) {
        options.onSuccess(mockResult)
      }
    }, 0)
  })
  
  return mutation
})

export const useTaskMutationStates = jest.fn(() => ({
  isCreating: false,
  isMoving: false,
  isReordering: false,
}))

// Helper functions to control mock behavior in tests
export const __setTaskMockError = (hookName: string, error: any) => {
  const hooks = { useCreateTask, useUpdateTask, useDeleteTask, useMoveTask, useReorderTasks, useMoveAllCards }
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

export const __resetTaskMocks = () => {
  useCreateTask.mockClear()
  useUpdateTask.mockClear()
  useDeleteTask.mockClear()
  useMoveTask.mockClear()
  useReorderTasks.mockClear()
  useMoveAllCards.mockClear()
  useTaskMutationStates.mockClear()
  mockCreateTask.mockClear()
  mockUpdateTask.mockClear()
  mockDeleteTask.mockClear()
  mockMoveTask.mockClear()
  mockReorderTasks.mockClear()
  mockMoveAllCards.mockClear()
}