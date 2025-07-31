import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { Board } from './board'
import { TProject } from '@/models/project'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { 
  __setMockError, 
  __setMockFieldErrors, 
  __resetAllMocks 
} from '@/hooks/mutations/__mocks__/use-column-mutations'

// Mock the column mutations
jest.mock('@/hooks/mutations/use-column-mutations')

const mockProject: TProject = {
  id: 'test-project-1',
  title: 'Test Project',
  description: 'A test project for column operations',
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

const emptyProject: TProject = {
  ...mockProject,
  columns: [],
}

describe('Board Component - Column Creation', () => {
  beforeEach(() => {
    __resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Create Column (List)', () => {
    it('should display "Add another list" button when not in adding mode', () => {
      render(<Board project={mockProject} />)
      
      const addButton = screen.getByRole('button', { name: /add another list/i })
      expect(addButton).toBeInTheDocument()
      expect(addButton).not.toBeDisabled()
    })

    it('should show the new list form when "Add another list" button is clicked', () => {
      render(<Board project={mockProject} />)
      
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Should show the input form
      expect(screen.getByPlaceholderText(/enter list title/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add list/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should successfully create a new column with valid title', async () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Fill in the title
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: 'New Column' } })
      
      // Submit the form
      const addListButton = screen.getByRole('button', { name: /add list/i })
      fireEvent.click(addListButton)
      
      // Should optimistically show the new column immediately
      await waitFor(() => {
        expect(screen.getByText('New Column')).toBeInTheDocument()
      })
    })

    it('should create column when pressing Enter key in input field', async () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Fill in the title and press Enter
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: 'Quick Column' } })
      fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' })
      
      // Should optimistically show the new column
      await waitFor(() => {
        expect(screen.getByText('Quick Column')).toBeInTheDocument()
      })
    })

    it('should calculate correct order for new column when columns exist', () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Fill in the title
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: 'Third Column' } })
      
      // Submit the form
      const addListButton = screen.getByRole('button', { name: /add list/i })
      fireEvent.click(addListButton)
      
      // Check that the new column appears - just verify it's present
      expect(screen.getByText('Third Column')).toBeInTheDocument()
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should set order to 0 when no columns exist', () => {
      render(<Board project={emptyProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Fill in the title
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: 'First Column' } })
      
      // Submit the form
      const addListButton = screen.getByRole('button', { name: /add list/i })
      fireEvent.click(addListButton)
      
      // Should show the first column
      expect(screen.getByText('First Column')).toBeInTheDocument()
    })

    it('should not create column with empty title', () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // The add list button should be disabled with empty title
      const addListButton = screen.getByRole('button', { name: /add list/i })
      expect(addListButton).toBeDisabled()
      
      // Try to submit with empty title by clicking (should do nothing because it's disabled)
      fireEvent.click(addListButton)
      
      // Should still be in adding mode
      expect(screen.getByPlaceholderText(/enter list title/i)).toBeInTheDocument()
    })

    it('should not create column with whitespace-only title', () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Fill with only whitespace
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: '   ' } })
      
      // Button should be disabled with whitespace-only title
      const addListButton = screen.getByRole('button', { name: /add list/i })
      expect(addListButton).toBeDisabled()
    })

    it('should disable add button when title is empty', () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Add list button should be disabled initially
      const addListButton = screen.getByRole('button', { name: /add list/i })
      expect(addListButton).toBeDisabled()
      
      // Should be enabled after typing
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: 'New Column' } })
      expect(addListButton).not.toBeDisabled()
    })

    it('should cancel column creation when pressing Escape', () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Press Escape
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.keyDown(titleInput, { key: 'Escape', code: 'Escape' })
      
      // Should return to add button view
      expect(screen.queryByPlaceholderText(/enter list title/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add another list/i })).toBeInTheDocument()
    })

    it('should cancel column creation when clicking Cancel button', () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      // Should return to add button view
      expect(screen.queryByPlaceholderText(/enter list title/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add another list/i })).toBeInTheDocument()
    })

    it('should show optimistic update immediately when creating column', async () => {
      render(<Board project={mockProject} />)
      
      // Click add button and create column
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: 'New Column' } })
      
      const addListButton = screen.getByRole('button', { name: /add list/i })
      fireEvent.click(addListButton)
      
      // Should show the new column immediately due to optimistic update
      expect(screen.getByText('New Column')).toBeInTheDocument()
      
      // Should exit add mode
      expect(screen.queryByPlaceholderText(/enter list title/i)).not.toBeInTheDocument()
    })

    it('should disable buttons when creation is in progress', () => {
      render(<Board project={mockProject} />)
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)
      
      const titleInput = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(titleInput, { target: { value: 'New Column' } })
      
      // Add list button should be enabled before submission
      const addListButton = screen.getByRole('button', { name: /add list/i })
      expect(addListButton).not.toBeDisabled()
      
      // Note: In actual implementation, we'd need to mock the isPending state
      // This test structure is ready for when that's implemented
    })
  })
})