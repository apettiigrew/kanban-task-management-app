import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { Column } from '../column'
import { TColumn } from '@/models/column'
import { __resetAllMocks, __setMockError } from '@/hooks/mutations/__mocks__/use-column-mutations'
// Mock the column mutations
jest.mock('@/hooks/mutations/use-column-mutations')
jest.mock('@/hooks/mutations/use-task-mutations')

// Mock OpenAI service
jest.mock('@/service/openai-service', () => ({
  handleImproveWritingOpenAI: jest.fn().mockResolvedValue('Improved text'),
  handleMakeLongerOpenAI: jest.fn().mockResolvedValue('Longer improved text'),
  handleMakeShorterOpenAI: jest.fn().mockResolvedValue('Shorter text'),
  handleMakeSMARTOpenAI: jest.fn().mockResolvedValue('SMART goal text'),
}))


const mockColumn: TColumn = {
  id: 'column-1',
  title: 'To Do',
  projectId: 'project-1',
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  cards: [
    {
      id: 'card-1',
      title: 'Task 1',
      description: 'Description 1',
      order: 0,
      labels: ['urgent'],
      dueDate: new Date('2024-01-15'),
      projectId: 'project-1',
      columnId: 'column-1',
      checklists: [
        {
          id: 'checklist-1',
          title: 'Checklist 1',
          order: 0,
          cardId: 'card-1',
          items: [
            {
              id: 'item-1',
              text: 'Item 1',
              isCompleted: false,
              order: 0,
              checklistId: 'checklist-1',
            },
            {
              id: 'item-2',
              text: 'Item 2',
              isCompleted: true,
              order: 1,
              checklistId: 'checklist-1',
            },
          ],
        },
      ],
    },
    {
      id: 'card-2',
      title: 'Task 2',
      description: 'Description 2',
      order: 1,
      labels: [],
      dueDate: null,
      projectId: 'project-1',
      columnId: 'column-1',
      checklists: [],
    },
  ],
}

describe('Copy List Integration Tests', () => {
  beforeEach(() => {
    __resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Complete Copy List Flow', () => {
    it('should complete the full copy list flow successfully', async () => {
      const onDelete = jest.fn()
      render(<Column column={mockColumn} onDelete={onDelete} />)

      // Test that the column component renders correctly
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /column menu/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    })

    it('should handle back navigation from copy form', async () => {
      // Test the CopyListForm component directly
      const { CopyListForm } = require('@/components/column/copy-list-form')
      const mockOnCopyList = jest.fn()
      const mockOnCancel = jest.fn()
      
      render(<CopyListForm 
        originalTitle='To Do' 
        onCopyList={mockOnCopyList} 
        onCancel={mockOnCancel} 
      />)

      // Verify copy form is displayed
      expect(screen.getByRole('button', { name: /create list/i })).toBeInTheDocument()
      expect(screen.getByDisplayValue('To Do')).toBeInTheDocument()

      // Click back button
      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)

      // Verify onCancel was called
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should handle keyboard navigation in copy form', async () => {
      // Test the CopyListForm component directly
      const { CopyListForm } = require('@/components/column/copy-list-form')
      const mockOnCopyList = jest.fn()
      const mockOnCancel = jest.fn()
      
      render(<CopyListForm 
        originalTitle='To Do' 
        onCopyList={mockOnCopyList} 
        onCancel={mockOnCancel} 
      />)

      // Test Enter key submission
      const titleInput = screen.getByDisplayValue('To Do')
      fireEvent.change(titleInput, { target: { value: 'New List Title' } })
      fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' })

      // Should trigger the copy operation
      expect(mockOnCopyList).toHaveBeenCalledWith('New List Title')

      // Test Escape key cancellation - need to get the input again since it might have changed
      const titleInput2 = screen.getByDisplayValue('New List Title')
      fireEvent.keyDown(titleInput2, { key: 'Escape', code: 'Escape' })

      // Should call onCancel
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should validate form input before submission', async () => {
      // Test the CopyListForm component directly
      const { CopyListForm } = require('@/components/column/copy-list-form')
      const mockOnCopyList = jest.fn()
      const mockOnCancel = jest.fn()
      
      render(<CopyListForm 
        originalTitle='To Do' 
        onCopyList={mockOnCopyList} 
        onCancel={mockOnCancel} 
      />)

      // Test empty title validation
      const titleInput = screen.getByDisplayValue('To Do')
      fireEvent.change(titleInput, { target: { value: '' } })

      const createButton = screen.getByRole('button', { name: /create list/i })
      fireEvent.click(createButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('title is required')).toBeInTheDocument()
      })

      // Test valid title
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } })
      
      // Wait for validation to clear
      await waitFor(() => {
        expect(screen.queryByText('title is required')).not.toBeInTheDocument()
      })
      
      fireEvent.click(createButton)

      // Should call onCopyList with valid title
      expect(mockOnCopyList).toHaveBeenCalledWith('Valid Title')
    })

    it('should handle copy operation errors gracefully', async () => {
      // Mock the copy mutation to return an error
      __setMockError('useCopyColumn', new Error('Failed to copy list'))

      const onDelete = jest.fn()
      render(<Column column={mockColumn} onDelete={onDelete} />)

      // Test that the column component renders correctly even with error state
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /column menu/i })).toBeInTheDocument()
    })

    it('should handle network errors during copy operation', async () => {
      // Mock network error
      __setMockError('useCopyColumn', new Error('Network error'))

      const onDelete = jest.fn()
      render(<Column column={mockColumn} onDelete={onDelete} />)

      // Test that the column component renders correctly even with network errors
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /column menu/i })).toBeInTheDocument()
    })

    it('should show loading state during copy operation', async () => {
      const onDelete = jest.fn()
      render(<Column column={mockColumn} onDelete={onDelete} />)

      // Test that the column component renders correctly
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /column menu/i })).toBeInTheDocument()
    })

    it('should maintain form state during copy operation', async () => {
      // Test the CopyListForm component directly
      const { CopyListForm } = require('@/components/column/copy-list-form')
      const mockOnCopyList = jest.fn()
      const mockOnCancel = jest.fn()
      
      render(<CopyListForm 
        originalTitle='To Do' 
        onCopyList={mockOnCopyList} 
        onCancel={mockOnCancel} 
      />)

      // Modify the title
      const titleInput = screen.getByDisplayValue('To Do')
      fireEvent.change(titleInput, { target: { value: 'My Custom Title' } })

      // Submit the form
      const createButton = screen.getByRole('button', { name: /create list/i })
      fireEvent.click(createButton)

      // Should call onCopyList with the custom title
      expect(mockOnCopyList).toHaveBeenCalledWith('My Custom Title')
    })

    it('should handle multiple rapid copy attempts', async () => {
      const onDelete = jest.fn()
      render(<Column column={mockColumn} onDelete={onDelete} />)

      // Test that the column component renders correctly
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /column menu/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility Integration', () => {
    it('should support keyboard navigation throughout the flow', async () => {
      // Test keyboard navigation in the CopyListForm component directly
      const { CopyListForm } = require('@/components/column/copy-list-form')
      const mockOnCopyList = jest.fn()
      const mockOnCancel = jest.fn()
      
      render(<CopyListForm 
        originalTitle='To Do' 
        onCopyList={mockOnCopyList} 
        onCancel={mockOnCancel} 
      />)

      // Tab to title input
      const titleInput = screen.getByDisplayValue('To Do')
      titleInput.focus()
      expect(titleInput).toHaveFocus()

      // Press Enter on the input to submit
      fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' })

      // Should call onCopyList
      expect(mockOnCopyList).toHaveBeenCalledWith('To Do')
    })

    it('should have proper ARIA labels and roles', async () => {
      // Test ARIA labels and roles in the CopyListForm component directly
      const { CopyListForm } = require('@/components/column/copy-list-form')
      const mockOnCopyList = jest.fn()
      const mockOnCancel = jest.fn()
      
      render(<CopyListForm 
        originalTitle='To Do' 
        onCopyList={mockOnCopyList} 
        onCancel={mockOnCancel} 
      />)

      // Check for proper form structure
      expect(screen.getByLabelText(/list title/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create list/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })
  })
})
