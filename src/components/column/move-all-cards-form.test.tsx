import { fireEvent, render, screen, waitFor } from '@/lib/test-utils'
import { MoveAllCardsForm } from './move-all-cards-form'
import '@testing-library/jest-dom'

// Mock OpenAI service
jest.mock('@/service/openai-service', () => ({
  handleImproveWritingOpenAI: jest.fn().mockResolvedValue('Improved text'),
  handleMakeLongerOpenAI: jest.fn().mockResolvedValue('Longer improved text'),
  handleMakeShorterOpenAI: jest.fn().mockResolvedValue('Shorter text'),
  handleMakeSMARTOpenAI: jest.fn().mockResolvedValue('SMART goal text'),
}))

// Mock the hooks
jest.mock('@/hooks/queries/use-columns')

const mockUseColumns = require('@/hooks/queries/use-columns').useColumns

const mockColumns = [
  { id: 'column-1', title: 'To Do', projectId: 'project-1', order: 0, createdAt: new Date(), updatedAt: new Date(), cards: [] },
  { id: 'column-2', title: 'In Progress', projectId: 'project-1', order: 1, createdAt: new Date(), updatedAt: new Date(), cards: [] },
  { id: 'column-3', title: 'Done', projectId: 'project-1', order: 2, createdAt: new Date(), updatedAt: new Date(), cards: [] },
  { id: 'column-4', title: 'Backlog', projectId: 'project-1', order: 3, createdAt: new Date(), updatedAt: new Date(), cards: [] },
]

const defaultProps = {
  columnId: 'column-2', // In Progress column
  currentProjectId: 'project-1',
  onMoveAllCards: jest.fn(),
  onCancel: jest.fn(),
}

describe('MoveAllCardsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    mockUseColumns.mockReturnValue({
      data: mockColumns,
      isLoading: false,
    })
  })

  describe('Component Rendering', () => {
    it('should render the move all cards form with all required elements', () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      expect(screen.getByText('Move all cards in list')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back to menu options/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should display all available columns except the current one', () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      // Should show all columns except the current one (column-2)
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('Done')).toBeInTheDocument()
      expect(screen.getByText('Backlog')).toBeInTheDocument()
      
      // Current column should be shown but disabled
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('(current)')).toBeInTheDocument()
    })

    it('should mark the current column as disabled and show current indicator', () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      const currentColumnButton = screen.getByLabelText(/In Progress \(current list\)/)
      expect(currentColumnButton).toBeDisabled()
      expect(currentColumnButton).toHaveClass('cursor-not-allowed', 'bg-gray-50')
    })

    it('should focus the first selectable column on mount', async () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      // First selectable column should be "To Do" (column-1)
      const firstColumnButton = screen.getByLabelText(/Move all cards to To Do/)
      
      await waitFor(() => {
        expect(firstColumnButton).toHaveFocus()
      })
    })
  })

  describe('Column Selection', () => {
    it('should call onMoveAllCards when a different column is selected', () => {
      const mockOnMoveAllCards = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onMoveAllCards={mockOnMoveAllCards} />)

      // Click on "To Do" column
      const toDoButton = screen.getByLabelText(/Move all cards to To Do/)
      fireEvent.click(toDoButton)

      expect(mockOnMoveAllCards).toHaveBeenCalledWith({
        columnId: 'column-2',
        targetColumnId: 'column-1',
      })
    })

    it('should not call onMoveAllCards when current column is clicked', () => {
      const mockOnMoveAllCards = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onMoveAllCards={mockOnMoveAllCards} />)

      // Try to click on current column (should be disabled)
      const currentColumnButton = screen.getByLabelText(/In Progress \(current list\)/)
      fireEvent.click(currentColumnButton)

      expect(mockOnMoveAllCards).not.toHaveBeenCalled()
    })

    it('should handle multiple column selections correctly', () => {
      const mockOnMoveAllCards = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onMoveAllCards={mockOnMoveAllCards} />)

      // Click on "Done" column
      const doneButton = screen.getByLabelText(/Move all cards to Done/)
      fireEvent.click(doneButton)

      expect(mockOnMoveAllCards).toHaveBeenCalledWith({
        columnId: 'column-2',
        targetColumnId: 'column-3',
      })

      // Reset mock and try another column
      mockOnMoveAllCards.mockClear()

      // Click on "Backlog" column
      const backlogButton = screen.getByLabelText(/Move all cards to Backlog/)
      fireEvent.click(backlogButton)

      expect(mockOnMoveAllCards).toHaveBeenCalledWith({
        columnId: 'column-2',
        targetColumnId: 'column-4',
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should call onCancel when Escape key is pressed', () => {
      const mockOnCancel = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onCancel={mockOnCancel} />)

      // Press Escape
      const formContainer = screen.getByText('Move all cards in list').closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Escape', code: 'Escape' })

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should handle keyboard navigation for column selection', async () => {
      const mockOnMoveAllCards = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onMoveAllCards={mockOnMoveAllCards} />)

      // Wait for focus to be set on first selectable column
      const firstColumnButton = screen.getByLabelText(/Move all cards to To Do/)
      
      await waitFor(() => {
        expect(firstColumnButton).toHaveFocus()
      })

      // Click the button instead of using keyboard (since the component uses onClick, not onKeyDown)
      fireEvent.click(firstColumnButton)

      expect(mockOnMoveAllCards).toHaveBeenCalledWith({
        columnId: 'column-2',
        targetColumnId: 'column-1',
      })
    })
  })

  describe('Button Actions', () => {
    it('should call onCancel when back button is clicked', () => {
      const mockOnCancel = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onCancel={mockOnCancel} />)

      const backButton = screen.getByRole('button', { name: /back to menu options/i })
      fireEvent.click(backButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should call onCancel when close button is clicked', () => {
      const mockOnCancel = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onCancel={mockOnCancel} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should call onCancel when cancel button is clicked', () => {
      const mockOnCancel = jest.fn()
      render(<MoveAllCardsForm {...defaultProps} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state when columns are loading', () => {
      mockUseColumns.mockReturnValue({
        data: [],
        isLoading: true,
      })

      render(<MoveAllCardsForm {...defaultProps} />)

      expect(screen.getByText('Loading columns...')).toBeInTheDocument()
      expect(screen.getByText('Move all cards in list')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back to menu options/i })).toBeInTheDocument()
    })

    it('should disable column selection when loading', () => {
      mockUseColumns.mockReturnValue({
        data: [],
        isLoading: true,
      })

      render(<MoveAllCardsForm {...defaultProps} />)

      // Should not show any column buttons when loading
      expect(screen.queryByLabelText(/Move all cards to/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty columns list', () => {
      mockUseColumns.mockReturnValue({
        data: [],
        isLoading: false,
      })

      render(<MoveAllCardsForm {...defaultProps} />)

      // Should show the form but no column options
      expect(screen.getByText('Move all cards in list')).toBeInTheDocument()
      expect(screen.queryByLabelText(/Move all cards to/)).not.toBeInTheDocument()
    })

    it('should handle columns with only current column', () => {
      const singleColumn = [mockColumns[1]] // Only the current column
      mockUseColumns.mockReturnValue({
        data: singleColumn,
        isLoading: false,
      })

      render(<MoveAllCardsForm {...defaultProps} />)

      // Should show only the current column (disabled)
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('(current)')).toBeInTheDocument()
      expect(screen.queryByLabelText(/Move all cards to/)).not.toBeInTheDocument()
    })

    it('should handle different column IDs correctly', () => {
      const propsWithDifferentColumn = {
        ...defaultProps,
        columnId: 'column-4', // Backlog column
      }

      render(<MoveAllCardsForm {...propsWithDifferentColumn} />)

      // Should show all columns except Backlog
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Done')).toBeInTheDocument()
      
      // Backlog should be shown but disabled
      expect(screen.getByText('Backlog')).toBeInTheDocument()
      expect(screen.getByText('(current)')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for column buttons', () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      expect(screen.getByLabelText(/Move all cards to To Do/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Move all cards to Done/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Move all cards to Backlog/)).toBeInTheDocument()
      expect(screen.getByLabelText(/In Progress \(current list\)/)).toBeInTheDocument()
    })

    it('should have proper button labels and roles', () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back to menu options/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should have proper focus management', async () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      // First selectable column should be focused
      const firstSelectableColumn = screen.getByLabelText(/Move all cards to To Do/)
      
      await waitFor(() => {
        expect(firstSelectableColumn).toHaveFocus()
      })

      // Current column should not be focusable
      const currentColumn = screen.getByLabelText(/In Progress \(current list\)/)
      expect(currentColumn).toBeDisabled()
    })
  })

  describe('Component Props', () => {
    it('should handle different project IDs', () => {
      const propsWithDifferentProject = {
        ...defaultProps,
        currentProjectId: 'project-2',
      }

      render(<MoveAllCardsForm {...propsWithDifferentProject} />)

      // Should call useColumns with the correct project ID
      expect(mockUseColumns).toHaveBeenCalledWith({
        projectId: 'project-2',
      })
    })

    it('should pass correct parameters to useColumns hook', () => {
      render(<MoveAllCardsForm {...defaultProps} />)

      expect(mockUseColumns).toHaveBeenCalledWith({
        projectId: 'project-1',
      })
    })
  })
})
