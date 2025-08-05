import { CardTask } from '@/components/card'
import { TaskDialogProvider } from '@/contexts/task-dialog-context'
import { fireEvent, render, screen, waitFor } from '@/lib/test-utils'
import { TCard } from '@/models/card'
import '@testing-library/jest-dom'

// Mock TipTap editor
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => ({
    getHTML: jest.fn(() => 'Test description'),
    commands: {
      setContent: jest.fn(),
    },
  })),
  EditorContent: ({ editor, ...props }: any) => <div data-testid="editor-content" {...props} />,
}))

// Mock StarterKit
jest.mock('@tiptap/starter-kit', () => ({
  configure: jest.fn(() => ({})),
}))

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((content: string) => content),
}))

// Mock drag and drop
jest.mock('@atlaskit/pragmatic-drag-and-drop/combine', () => ({
  combine: jest.fn(() => jest.fn()),
}))

jest.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: jest.fn(() => jest.fn()),
  dropTargetForElements: jest.fn(() => jest.fn()),
  monitorForElements: jest.fn(() => jest.fn()),
}))

// Mock other pragmatic drag and drop dependencies
jest.mock('@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge', () => ({
  attachClosestEdge: jest.fn((data) => data),
  extractClosestEdge: jest.fn(),
}))

jest.mock('@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge', () => ({
  reorderWithEdge: jest.fn(),
}))

// Mock auto scroll
jest.mock('@atlaskit/pragmatic-drag-and-drop-auto-scroll/element', () => ({
  autoScrollForElements: jest.fn(() => jest.fn()),
}))

jest.mock('@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element', () => ({
  unsafeOverflowAutoScrollForElements: jest.fn(() => jest.fn()),
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

// Mock the task mutations
const mockMutate = jest.fn()

jest.mock('@/hooks/mutations/use-task-mutations', () => ({
  useUpdateTask: jest.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  })),
}))

// Mock checklist related hooks
jest.mock('@/hooks/mutations/use-checklist-mutations', () => ({
  useCreateChecklist: jest.fn(() => ({ mutate: jest.fn() })),
  useUpdateChecklist: jest.fn(() => ({ mutate: jest.fn() })),
  useDeleteChecklist: jest.fn(() => ({ mutate: jest.fn() })),
  useCreateChecklistItem: jest.fn(() => ({ mutate: jest.fn() })),
  useUpdateChecklistItem: jest.fn(() => ({ mutate: jest.fn() })),
  useDeleteChecklistItem: jest.fn(() => ({ mutate: jest.fn() })),
  useReorderChecklists: jest.fn(() => ({ mutate: jest.fn() })),
  useReorderChecklistItems: jest.fn(() => ({ mutate: jest.fn() })),
}))

jest.mock('@/hooks/queries/use-checklists', () => ({
  useChecklistsByCard: jest.fn(() => ({ data: [] })),
}))

jest.mock('@/hooks/queries/use-projects', () => ({
  projectKeys: {
    detail: (id: string) => ['project', id],
  },
}))

// Mock data utilities
jest.mock('@/utils/data', () => ({
  getCardData: jest.fn(() => ({})),
  getCardDropTargetData: jest.fn(() => ({})),
  isCardData: jest.fn(() => false),
  isDraggingACard: jest.fn(() => false),
  isShallowEqual: jest.fn(() => false),
  isChecklistData: jest.fn(() => false),
  isChecklistDropTargetData: jest.fn(() => false),
  isChecklistItemData: jest.fn(() => false),
  isChecklistItemDropTargetData: jest.fn(() => false),
  isDraggingAChecklist: jest.fn(() => false),
  isDraggingAChecklistItem: jest.fn(() => false),
}))

const mockCard: TCard = {
  id: 'test-card-1',
  title: 'Original Card Title',
  description: 'Original description',
  projectId: 'test-project-1', 
  columnId: 'test-column-1',
  order: 0,
  totalChecklistItems: 0,
  totalCompletedChecklistItems: 0,
  checklists: [],
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <TaskDialogProvider>
      {children}
    </TaskDialogProvider>
  )
}

describe('TaskEditModal - Card Title Update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutate.mockClear()
  })

  it('should update card title in modal and reflect changes in card display', async () => {
  

    // Render the card within the TaskDialogProvider
    render(
      <TestWrapper>
        <CardTask 
          card={mockCard} 
          columnId="test-column-1"
          columnTitle="Test Column"
        />
      </TestWrapper>
    )

    // Step 1: Verify initial card title is displayed
    expect(screen.getByText('Original Card Title')).toBeInTheDocument()

    // Step 2: Click on the card to open the edit modal
    const cardElement = screen.getByText('Original Card Title')
    fireEvent.click(cardElement)

    // Step 3: Wait for modal to open and verify the title text is visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Step 4: Click on the title text to enter edit mode (find the one in modal)
    const modalTitleElements = screen.getAllByText('Original Card Title')
    const modalTitleText = modalTitleElements.find(el => 
      el.closest('[role="dialog"]')
    )
    expect(modalTitleText).toBeDefined()
    fireEvent.click(modalTitleText!)

    // Step 5: Wait for the textarea to appear and change the title
    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Card Title')).toBeInTheDocument()
    })
    
    const titleInput = screen.getByDisplayValue('Original Card Title')
    fireEvent.change(titleInput, { target: { value: 'Updated Card Title' } })

    // Verify the input value changed
    expect(titleInput).toHaveValue('Updated Card Title')

    // Step 6: Trigger blur event to save the title (this calls handleTitleBlur)
    fireEvent.blur(titleInput)

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-card-1',
        title: 'Updated Card Title',
        description: 'Original description',
        columnId: 'test-column-1',
        order: 0,
        projectId: 'test-project-1',
      }), expect.any(Object))
    })
  })

  it('should revert title changes if update fails', async () => {
    // Setup: Mock failed update
    mockMutate.mockImplementation((variables, options) => {
      // Simulate API failure by calling onError callback
      if (options?.onError) {
        options.onError(new Error('Update failed'))
      }
    })

    // Render the card within the TaskDialogProvider
    render(
      <TestWrapper>
        <CardTask 
          card={mockCard} 
          columnId="test-column-1"
          columnTitle="Test Column"
        />
      </TestWrapper>
    )

    // Step 1: Verify initial card title is displayed
    expect(screen.getByText('Original Card Title')).toBeInTheDocument()

    // Step 2: Click on the card to open the edit modal
    const cardElement = screen.getByText('Original Card Title')
    fireEvent.click(cardElement)

    // Step 3: Wait for modal to open and verify the title text is visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Step 4: Click on the title text to enter edit mode
    const modalTitleElements = screen.getAllByText('Original Card Title')
    const modalTitleText = modalTitleElements.find(el => 
      el.closest('[role="dialog"]')
    )
    expect(modalTitleText).toBeDefined()
    fireEvent.click(modalTitleText!)

    // Step 5: Wait for the textarea to appear and change the title
    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Card Title')).toBeInTheDocument()
    })
    
    const titleInput = screen.getByDisplayValue('Original Card Title')
    fireEvent.change(titleInput, { target: { value: 'Failed Update Title' } })

    // Verify the input value changed
    expect(titleInput).toHaveValue('Failed Update Title')

    // Step 6: Trigger blur event to save the title (this will fail)
    fireEvent.blur(titleInput)

    // Step 7: Wait for the mutation to be called and then verify title reverts
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-card-1',
        title: 'Failed Update Title',
        description: 'Original description',
        columnId: 'test-column-1',
        order: 0,
        projectId: 'test-project-1',
      }), expect.any(Object))
    })

    // Step 8: Verify the title reverts back to original after failure
    await waitFor(() => {
      // The title should revert to the original value in the modal
      // Find the title text specifically within the modal dialog
      const modalTitleElements = screen.getAllByText('Original Card Title')
      const modalTitleText = modalTitleElements.find(el => 
        el.closest('[role="dialog"]')
      )
      expect(modalTitleText).toBeInTheDocument()
    })

    // Step 9: Verify the card title outside the modal also shows the original title
    // Find the title text specifically outside the modal (in the card)
    const cardTitleElements = screen.getAllByText('Original Card Title')
    const cardTitleText = cardTitleElements.find(el => 
      !el.closest('[role="dialog"]')
    )
    expect(cardTitleText).toBeInTheDocument()
  })

  it('should not update with empty title', async () => {
    // Render the card within the TaskDialogProvider
    render(
      <TestWrapper>
        <CardTask 
          card={mockCard} 
          columnId="test-column-1"
          columnTitle="Test Column"
        />
      </TestWrapper>
    )

    // Step 1: Verify initial card title is displayed
    expect(screen.getByText('Original Card Title')).toBeInTheDocument()

    // Step 2: Click on the card to open the edit modal
    const cardElement = screen.getByText('Original Card Title')
    fireEvent.click(cardElement)

    // Step 3: Wait for modal to open and verify the title text is visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Step 4: Click on the title text to enter edit mode
    const modalTitleElements = screen.getAllByText('Original Card Title')
    const modalTitleText = modalTitleElements.find(el => 
      el.closest('[role="dialog"]')
    )
    expect(modalTitleText).toBeDefined()
    fireEvent.click(modalTitleText!)

    // Step 5: Wait for the textarea to appear and clear the title
    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Card Title')).toBeInTheDocument()
    })
    
    const titleInput = screen.getByDisplayValue('Original Card Title')
    fireEvent.change(titleInput, { target: { value: '' } })

    // Verify the input value is empty
    expect(titleInput).toHaveValue('')

    // Step 6: Trigger blur event to try to save the empty title
    fireEvent.blur(titleInput)

    // Step 7: Verify the mutation was NOT called (empty title should not trigger update)
    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled()
    })

    // Step 8: Verify the title reverts back to original value
    await waitFor(() => {
      // The title should revert to the original value in the modal
      const modalTitleElements = screen.getAllByText('Original Card Title')
      const modalTitleText = modalTitleElements.find(el => 
        el.closest('[role="dialog"]')
      )
      expect(modalTitleText).toBeInTheDocument()
    })

    // Step 9: Verify the card title outside the modal also shows the original title
    const cardTitleElements = screen.getAllByText('Original Card Title')
    const cardTitleText = cardTitleElements.find(el => 
      !el.closest('[role="dialog"]')
    )
    expect(cardTitleText).toBeInTheDocument()
  })
})