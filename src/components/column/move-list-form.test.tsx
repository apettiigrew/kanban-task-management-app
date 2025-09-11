import { fireEvent, render, screen, waitFor } from '@/lib/test-utils'
import { MoveListForm } from './move-list-form'
import '@testing-library/jest-dom'

// Mock OpenAI service
jest.mock('@/service/openai-service', () => ({
  handleImproveWritingOpenAI: jest.fn().mockResolvedValue('Improved text'),
  handleMakeLongerOpenAI: jest.fn().mockResolvedValue('Longer improved text'),
  handleMakeShorterOpenAI: jest.fn().mockResolvedValue('Shorter text'),
  handleMakeSMARTOpenAI: jest.fn().mockResolvedValue('SMART goal text'),
}))

// Mock the hooks
jest.mock('@/hooks/queries/use-projects')
jest.mock('@/hooks/queries/use-columns')

const mockUseProjects = require('@/hooks/queries/use-projects').useProjects
const mockUseColumns = require('@/hooks/queries/use-columns').useColumns

const mockProjects = [
  { id: 'project-1', title: 'Project 1', description: 'First project', createdAt: new Date(), updatedAt: new Date() },
  { id: 'project-2', title: 'Project 2', description: 'Second project', createdAt: new Date(), updatedAt: new Date() },
  { id: 'project-3', title: 'Project 3', description: 'Third project', createdAt: new Date(), updatedAt: new Date() },
]

const mockColumns = [
  { id: 'column-1', title: 'To Do', projectId: 'project-1', order: 0, createdAt: new Date(), updatedAt: new Date(), cards: [] },
  { id: 'column-2', title: 'In Progress', projectId: 'project-1', order: 1, createdAt: new Date(), updatedAt: new Date(), cards: [] },
  { id: 'column-3', title: 'Done', projectId: 'project-1', order: 2, createdAt: new Date(), updatedAt: new Date(), cards: [] },
]

const mockTargetColumns = [
  { id: 'column-4', title: 'Backlog', projectId: 'project-2', order: 0, createdAt: new Date(), updatedAt: new Date(), cards: [] },
  { id: 'column-5', title: 'Active', projectId: 'project-2', order: 1, createdAt: new Date(), updatedAt: new Date(), cards: [] },
]

const defaultProps = {
  columnId: 'column-1',
  currentProjectId: 'project-1',
  currentColumnPosition: 1,
  onMoveList: jest.fn(),
  onCancel: jest.fn(),
}

describe('MoveListForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseProjects.mockReturnValue({
      data: mockProjects,
      isLoading: false,
    })

    mockUseColumns.mockImplementation(({ projectId }: { projectId: string }) => {
      if (projectId === 'project-1') {
        return { data: mockColumns, isLoading: false }
      } else if (projectId === 'project-2') {
        return { data: mockTargetColumns, isLoading: false }
      }
      return { data: [], isLoading: false }
    })
  })

  describe('Component Rendering', () => {
    it('should render the move list form with all required elements', () => {
      render(<MoveListForm {...defaultProps} />)

      expect(screen.getByText('Move list')).toBeInTheDocument()
      expect(screen.getByLabelText('Board')).toBeInTheDocument()
      expect(screen.getByLabelText('Position')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /move/i })).toBeInTheDocument()
    })

    it('should show board selector with all available projects', () => {
      render(<MoveListForm {...defaultProps} />)

      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)

      // Check that all projects are available in the dropdown
      expect(screen.getAllByText('Project 1')).toHaveLength(2) // One in selected value, one in dropdown
      expect(screen.getByText('Project 2')).toBeInTheDocument()
      expect(screen.getByText('Project 3')).toBeInTheDocument()
    })

    it('should show position selector with correct available positions', () => {
      render(<MoveListForm {...defaultProps} />)

      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)

      // Should show positions 1, 2, 3 for current project (3 columns)
      expect(screen.getByText('1 (Current)')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should focus board selector on mount', async () => {
      render(<MoveListForm {...defaultProps} />)

      const boardSelect = screen.getByLabelText('Board')

      await waitFor(() => {
        expect(boardSelect).toHaveFocus()
      })
    })
  })

  describe('Form Interactions', () => {
    it('should update position options when board selection changes', () => {
      render(<MoveListForm {...defaultProps} />)

      // Select a different board
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 2')[0]) // Use first occurrence

      // Position options should update for the new board
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)

      // Should show positions 1, 2 for target project (2 columns)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      // Should not show current position since it's a different board
      expect(screen.queryByText('1 (Current)')).not.toBeInTheDocument()
    })

    it('should reset position when board changes', () => {
      render(<MoveListForm {...defaultProps} />)

      // Select a position first
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('2'))

      // Change board
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 2')[0]) // Use first occurrence

      // Position should be reset
      expect(screen.getByText('Select position')).toBeInTheDocument()
    })

    it('should enable move button when both board and position are selected', () => {
      render(<MoveListForm {...defaultProps} />)

      const moveButton = screen.getByRole('button', { name: /move/i })
      expect(moveButton).toBeDisabled()

      // Select board
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 2')[0]) // Use first occurrence

      // Select position
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('1'))

      expect(moveButton).not.toBeDisabled()
    })

    it('should enable move button when same board and position are selected (calls onCancel)', () => {
      const mockOnCancel = jest.fn()
      const mockOnMoveList = jest.fn()
      render(<MoveListForm {...defaultProps} onCancel={mockOnCancel} onMoveList={mockOnMoveList} />)

      // Select same board (project-1)
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 1')[1]) // Use the dropdown item, not the selected value

      // Select current position (1)
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('1 (Current)'))

      const moveButton = screen.getByRole('button', { name: /move/i })
      expect(moveButton).not.toBeDisabled()

      // Clicking the button should call onCancel instead of onMoveList
      fireEvent.click(moveButton)
      expect(mockOnCancel).toHaveBeenCalled()
      expect(mockOnMoveList).not.toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for empty board selection', async () => {
      // Create a form with no initial project selected
      const propsWithoutProject = {
        ...defaultProps,
        currentProjectId: '',
      }

      // Mock projects to return empty array to simulate no project selected
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
      })

      render(<MoveListForm {...propsWithoutProject} />)

      // The button should be disabled when no project is selected
      const moveButton = screen.getByRole('button', { name: /move/i })
      expect(moveButton).toBeDisabled()

      // Try to submit by pressing Enter key instead (which should work even when button is disabled)
      const formContainer = screen.getByRole('button', { name: /move/i }).closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Board selection is required')).toBeInTheDocument()
      })
    })

    it('should show validation error for empty position selection', async () => {
      render(<MoveListForm {...defaultProps} />)

      // Select different board but not position
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 2')[0]) // Use first occurrence

      // Close dropdown
      fireEvent.click(document.body)

      // The button should be disabled when no position is selected
      const moveButton = screen.getByRole('button', { name: /move/i })
      expect(moveButton).toBeDisabled()

      // Try to submit by pressing Enter key instead
      const formContainer = screen.getByRole('button', { name: /move/i }).closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Position selection is required')).toBeInTheDocument()
      })
    })

    it('should clear validation errors when valid selections are made', async () => {
      // Test that validation errors are cleared when user makes valid selections
      render(<MoveListForm {...defaultProps} />)

      // Select different board but not position to trigger position validation
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 2')[0]) // Use first occurrence

      // Close dropdown
      fireEvent.click(document.body)

      // Trigger validation error by pressing Enter
      const formContainer = screen.getByRole('button', { name: /move/i }).closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Position selection is required')).toBeInTheDocument()
      })

      // Now select a valid position
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('1'))

      // Close dropdown
      fireEvent.click(document.body)

      // Validation errors should be cleared when valid selections are made
      expect(screen.queryByText('Position selection is required')).not.toBeInTheDocument()
    })
  })


  describe('Form Submission', () => {
    it('should call onMoveList with correct data for moving to different board', () => {
      const mockOnMoveList = jest.fn()
      render(<MoveListForm {...defaultProps} onMoveList={mockOnMoveList} />)

      // Select different board
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 2')[0]) // Use first occurrence

      // Select position
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('1'))

      // Submit form
      const moveButton = screen.getByRole('button', { name: /move/i })
      fireEvent.click(moveButton)

      expect(mockOnMoveList).toHaveBeenCalledWith({
        columnId: 'column-1',
        targetProjectId: 'project-2',
        position: 1,
      })
    })

    it('should call onMoveList with correct data for repositioning within same board', () => {
      const mockOnMoveList = jest.fn()
      render(<MoveListForm {...defaultProps} onMoveList={mockOnMoveList} />)

      // Select different position (board is already selected)
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('3'))

      // Close any open dropdowns by clicking outside
      fireEvent.click(document.body)

      // Submit form
      const moveButton = screen.getByRole('button', { name: /move/i })
      fireEvent.click(moveButton)

      expect(mockOnMoveList).toHaveBeenCalledWith({
        columnId: 'column-1',
        position: 3,
      })
    })

    it('should call onCancel when same board and position are selected', () => {
      const mockOnCancel = jest.fn()
      const mockOnMoveList = jest.fn()
      render(<MoveListForm {...defaultProps} onCancel={mockOnCancel} onMoveList={mockOnMoveList} />)

      // Select current position (board is already selected)
      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('1 (Current)'))

      // Close any open dropdowns by clicking outside
      fireEvent.click(document.body)

      // Try to submit (should call onCancel instead)
      const moveButton = screen.getByRole('button', { name: /move/i })
      fireEvent.click(moveButton)

      expect(mockOnCancel).toHaveBeenCalled()
      expect(mockOnMoveList).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should submit form when Enter key is pressed', () => {
      const mockOnMoveList = jest.fn()
      render(<MoveListForm {...defaultProps} onMoveList={mockOnMoveList} />)

      // Select board and position
      const boardSelect = screen.getByLabelText('Board')
      fireEvent.click(boardSelect)
      fireEvent.click(screen.getAllByText('Project 2')[0]) // Use first occurrence

      const positionSelect = screen.getByLabelText('Position')
      fireEvent.click(positionSelect)
      fireEvent.click(screen.getByText('1'))

      // Close any open dropdowns by clicking outside
      fireEvent.click(document.body)

      // Press Enter
      const formContainer = screen.getByRole('button', { name: /move/i }).closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Enter', code: 'Enter' })

      expect(mockOnMoveList).toHaveBeenCalled()
    })

    it('should cancel form when Escape key is pressed', () => {
      const mockOnCancel = jest.fn()
      render(<MoveListForm {...defaultProps} onCancel={mockOnCancel} />)

      // Press Escape
      const formContainer = screen.getByRole('button', { name: /move/i }).closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Escape', code: 'Escape' })

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should not submit when Enter is pressed with invalid form', () => {
      const mockOnMoveList = jest.fn()
      render(<MoveListForm {...defaultProps} onMoveList={mockOnMoveList} />)

      // Press Enter without selecting anything
      const formContainer = screen.getByRole('button', { name: /move/i }).closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Enter', code: 'Enter' })

      expect(mockOnMoveList).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state when projects are loading', () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: true,
      })

      render(<MoveListForm {...defaultProps} />)

      const boardSelect = screen.getByLabelText('Board')
      expect(boardSelect).toBeDisabled()
    })

    it('should disable position selector when projects are loading', () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: true,
      })

      render(<MoveListForm {...defaultProps} />)

      const positionSelect = screen.getByLabelText('Position')
      expect(positionSelect).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<MoveListForm {...defaultProps} />)

      const boardSelect = screen.getByLabelText('Board')
      expect(boardSelect).toHaveAttribute('aria-describedby', 'board-description')
      expect(screen.getByText('Choose which board to move this list to')).toBeInTheDocument()

      const positionSelect = screen.getByLabelText('Position')
      expect(positionSelect).toHaveAttribute('aria-describedby', 'position-description')
      expect(screen.getByText('Choose where to place this list in the target board')).toBeInTheDocument()
    })

    it('should have proper ARIA invalid attributes for validation errors', async () => {
      // Create a form with no initial project selected to trigger board validation
      const propsWithoutProject = {
        ...defaultProps,
        currentProjectId: '',
      }
      
      // Mock projects to return empty array to simulate no project selected
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
      })
      
      render(<MoveListForm {...propsWithoutProject} />)

      // Trigger validation error by pressing Enter
      const formContainer = screen.getByRole('button', { name: /move/i }).closest('div')
      fireEvent.keyDown(formContainer!, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        const boardSelect = screen.getByLabelText('Board')
        expect(boardSelect).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should have proper button labels and roles', () => {
      render(<MoveListForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back to menu options/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /move/i })).toBeInTheDocument()
    })
  })
})
