import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsContext } from '@/providers/settings-context'

// Mock TanStack Query client for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Default settings for tests
const defaultSettings = {
  isOverElementAutoScrollEnabled: true,
  isOverflowScrollingEnabled: true,
  boardScrollSpeed: 'normal' as const,
  columnScrollSpeed: 'normal' as const,
}

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
  settings?: typeof defaultSettings
}

const AllTheProviders = ({ 
  children, 
  queryClient = createTestQueryClient(),
  settings = defaultSettings 
}: AllTheProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsContext.Provider value={{ settings, updateSettings: jest.fn() }}>
        {children}
      </SettingsContext.Provider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
    settings?: typeof defaultSettings
  }
) => {
  const { queryClient, settings, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders 
        queryClient={queryClient} 
        settings={settings}
        {...props} 
      />
    ),
    ...renderOptions,
  })
}

// Mock API responses for column operations
export const mockColumnResponse = {
  id: 'test-column-1',
  title: 'Test Column',
  projectId: 'test-project-1',
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  cards: [],
}

export const mockProjectWithColumns = {
  id: 'test-project-1',
  title: 'Test Project',
  description: 'A test project',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  columns: [
    {
      id: 'column-1',
      title: 'To Do',
      projectId: 'test-project-1',
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      cards: [],
    },
    {
      id: 'column-2',
      title: 'In Progress',
      projectId: 'test-project-1',
      order: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      cards: [],
    },
  ],
}

// Mock API functions
export const mockApiHandlers = {
  // Mock successful column creation
  createColumn: jest.fn().mockResolvedValue({
    ...mockColumnResponse,
    id: 'new-column-id',
    title: 'New Column',
    order: 2,
  }),

  // Mock successful column update
  updateColumn: jest.fn().mockResolvedValue({
    ...mockColumnResponse,
    title: 'Updated Column Title',
    updatedAt: new Date(),
  }),

  // Mock successful column deletion
  deleteColumn: jest.fn().mockResolvedValue({ success: true }),

  // Mock API errors
  createColumnError: jest.fn().mockRejectedValue({
    message: 'Failed to create column',
    fieldErrors: { title: 'Title is required' },
  }),

  updateColumnError: jest.fn().mockRejectedValue({
    message: 'Failed to update column',
  }),

  deleteColumnError: jest.fn().mockRejectedValue({
    message: 'Failed to delete column',
  }),
}

// Helper to reset all mocks
export const resetAllMocks = () => {
  Object.values(mockApiHandlers).forEach(mock => mock.mockClear())
  jest.clearAllMocks()
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

export * from '@testing-library/react'
export { customRender as render }