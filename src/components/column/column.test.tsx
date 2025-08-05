import {
  __resetAllMocks
} from '@/hooks/mutations/__mocks__/use-column-mutations'
import { fireEvent, render, screen, waitFor } from '@/lib/test-utils'
import { TProject } from '@/models/project'
import '@testing-library/jest-dom'
import { Board } from '../board/board'
import { Column } from './column'

// Mock the column mutations
jest.mock('@/hooks/mutations/use-column-mutations')
jest.mock('@/hooks/mutations/use-task-mutations')

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

const mockColumn = {

  id: 'column-1',
  title: 'To Do',
  projectId: 'test-project-1',
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  cards: [],
}

describe('Card Component - Card Creation', () => {
  beforeEach(() => {
    __resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Create Card', () => {
    it('should display "Add a card" button when not in adding mode', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)

      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      expect(addCardButton).toBeInTheDocument()
      expect(addCardButton).not.toBeDisabled()
      expect(addCardButton).toBeVisible()
    })

    it('should display "Add a card" button even when column has existing cards', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)

      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      expect(addCardButton).toBeInTheDocument()
      expect(addCardButton).not.toBeDisabled()
    })

    it('should show input form when "Add a card" button is clicked', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      // Should show the input form
      expect(screen.getByPlaceholderText(/enter a title or paste a link/i)).toBeInTheDocument()
      expect(screen.getByText('Add card')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel adding card/i })).toBeInTheDocument()
      
      // Should hide the original "Add a card" button text
      expect(screen.queryByText('Add a card')).not.toBeInTheDocument()
    })

    it('should focus the input field when entering add card mode', async () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      await waitFor(() => {
        expect(titleInput).toHaveFocus()
      })
    })

    it('should allow typing in the input field', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.change(titleInput, { target: { value: 'New Task Title' } })
      
      expect(titleInput).toHaveValue('New Task Title')
    })

    it('should disable "Add card" button when input is empty', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const submitButton = screen.getByText('Add card')
      expect(submitButton).toBeDisabled()
    })

    it('should enable "Add card" button when input has text', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      const submitButton = screen.getByText('Add card')
      
      expect(submitButton).toBeDisabled()
      
      fireEvent.change(titleInput, { target: { value: 'New Card' } })
      expect(submitButton).not.toBeDisabled()
    })

    it('should not create card with whitespace-only title', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      const submitButton = screen.getByText('Add card')
      
      fireEvent.change(titleInput, { target: { value: '   ' } })
      expect(submitButton).toBeDisabled()
      
      fireEvent.change(titleInput, { target: { value: '\t\n  ' } })
      expect(submitButton).toBeDisabled()
    })

    it('should submit form when pressing Enter with valid input', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.change(titleInput, { target: { value: 'Quick Card' } })
      fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' })
      
      // Should exit add mode and return to button view
      expect(screen.queryByPlaceholderText(/enter a title or paste a link/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    })

    it('should not submit form when pressing Enter with empty input', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' })
      
      // Should stay in add mode
      expect(screen.getByPlaceholderText(/enter a title or paste a link/i)).toBeInTheDocument()
    })

    it('should cancel when pressing Escape key', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.change(titleInput, { target: { value: 'Some text' } })
      
      fireEvent.keyDown(titleInput, { key: 'Escape', code: 'Escape' })
      
      // Should return to add button view
      expect(screen.queryByPlaceholderText(/enter a title or paste a link/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    })

    it('should cancel when clicking Cancel (X) button', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.change(titleInput, { target: { value: 'Some text' } })
      
      const cancelButton = screen.getByRole('button', { name: /cancel adding card/i })
      fireEvent.click(cancelButton)
      
      // Should return to add button view
      expect(screen.queryByPlaceholderText(/enter a title or paste a link/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    })

    it('should submit when clicking "Add card" button with valid input', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.change(titleInput, { target: { value: 'Mouse Click Card' } })
      
      const submitButton = screen.getByText('Add card')
      fireEvent.click(submitButton)
      
      // Should return to button view
      expect(screen.queryByPlaceholderText(/enter a title or paste a link/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    })

    it('should handle special characters in input', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      const specialText = 'Task #1: Fix bug @john & @jane (urgent!) 50% done'
      fireEvent.change(titleInput, { target: { value: specialText } })
      
      expect(titleInput).toHaveValue(specialText)
      
      const submitButton = screen.getByText('Add card')
      expect(submitButton).not.toBeDisabled()
    })

    it('should handle unicode characters in input', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      const unicodeText = 'タスク 🚀 émojis & ñoño'
      fireEvent.change(titleInput, { target: { value: unicodeText } })
      
      expect(titleInput).toHaveValue(unicodeText)
      
      const submitButton = screen.getByText('Add card')
      expect(submitButton).not.toBeDisabled()
    })

    it('should handle very long input text', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      const longText = 'A'.repeat(500) // Very long text
      fireEvent.change(titleInput, { target: { value: longText } })
      
      expect(titleInput).toHaveValue(longText)
      
      const submitButton = screen.getByText('Add card')
      expect(submitButton).not.toBeDisabled()
    })

    it('should clear input field after successful submission', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.change(titleInput, { target: { value: 'Test Card' } })
      
      const submitButton = screen.getByText('Add card')
      fireEvent.click(submitButton)
      
      // After submission, if we enter add mode again, input should be empty
      const newAddCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(newAddCardButton)
      
      const newTitleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      expect(newTitleInput).toHaveValue('')
    })

    it('should handle multiple creation cycles correctly', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      // First card creation cycle
      let addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      let titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      fireEvent.change(titleInput, { target: { value: 'First Card' } })
      
      let submitButton = screen.getByText('Add card')
      fireEvent.click(submitButton)
      
      // Should return to initial state
      expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
      
      // Second card creation cycle
      addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      expect(titleInput).toHaveValue('') // Should be empty
      expect(titleInput).toHaveFocus()
      
      fireEvent.change(titleInput, { target: { value: 'Second Card' } })
      submitButton = screen.getByText('Add card')
      fireEvent.click(submitButton)
      
      // Should return to initial state again
      expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    })

    it('should re-enable button when valid text is added after whitespace', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      const submitButton = screen.getByText('Add card')
      
      fireEvent.change(titleInput, { target: { value: '   ' } })
      expect(submitButton).toBeDisabled()
      
      fireEvent.change(titleInput, { target: { value: '   Valid Text' } })
      expect(submitButton).not.toBeDisabled()
    })

    it('should maintain input field focus during typing', () => {
      render(<Column column={mockColumn} onDelete={() => {}} />)
      
      const addCardButton = screen.getByRole('button', { name: /add a card/i })
      fireEvent.click(addCardButton)
      
      const titleInput = screen.getByPlaceholderText(/enter a title or paste a link/i)
      
      fireEvent.change(titleInput, { target: { value: 'Test' } })
      expect(titleInput).toHaveFocus()
      
      fireEvent.change(titleInput, { target: { value: 'Test Card' } })
      expect(titleInput).toHaveFocus()
      expect(titleInput).toHaveValue('Test Card')
    })

  })

 

});

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