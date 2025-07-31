import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { Column } from './column'
import { TColumn } from '@/models/column'
import { toast } from 'sonner'
import { 
  __setMockError, 
  __setMockFieldErrors, 
  __resetAllMocks 
} from '@/hooks/mutations/__mocks__/use-column-mutations'

// Mock the column mutations
jest.mock('@/hooks/mutations/use-column-mutations')
jest.mock('@/hooks/mutations/use-task-mutations')

const mockColumn: TColumn = {
  id: 'test-column-1',
  title: 'Test Column',
  projectId: 'test-project-1',
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  cards: [],
}

const mockColumnWithCards: TColumn = {
  ...mockColumn,
  cards: [
    {
      id: 'card-1',
      title: 'Test Card 1',
      description: 'Test card description',
      columnId: 'test-column-1',
      projectId: 'test-project-1',
      order: 0,
      checklists: [],
      totalChecklistItems: 0,
      totalCompletedChecklistItems: 0,
    },
    {
      id: 'card-2', 
      title: 'Test Card 2',
      description: 'Another test card',
      columnId: 'test-column-1',
      projectId: 'test-project-1',
      order: 1,
      checklists: [],
      totalChecklistItems: 0,
      totalCompletedChecklistItems: 0,
    },
  ],
}

const mockOnDelete = jest.fn()

describe('Column Component', () => {
  beforeEach(() => {
    __resetAllMocks()
    jest.clearAllMocks()
    mockOnDelete.mockClear()
  })

  describe('View Column', () => {
    it('should display column with cards', () => {
      render(<Column column={mockColumnWithCards} onDelete={mockOnDelete} />)
      
      expect(screen.getByText('Test Column')).toBeInTheDocument()
    //   expect(screen.getByText('Test Card 1')).toBeInTheDocument()
    //   expect(screen.getByText('Test Card 2')).toBeInTheDocument()
    })

    // it('should display "Add a card" button', () => {
    //   render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
    //   expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    // })

    // it('should display column menu button', () => {
    //   render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
    //   const menuButton = screen.getByRole('button', { name: /open column menu/i })
    //   expect(menuButton).toBeInTheDocument()
    // })

    // it('should show empty state when no cards present', () => {
    //   render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
    //   // Should not show any cards
    //   expect(screen.queryByText(/test card/i)).not.toBeInTheDocument()
      
    //   // Should still show add card button
    //   expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
    // })
  })

//   describe('Update Column Title', () => {
//     it('should enter edit mode when clicking on title', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Should show input field
//       const input = screen.getByDisplayValue('Test Column')
//       expect(input).toBeInTheDocument()
//       expect(input).toHaveFocus()
//     })

//     it('should save title when pressing Enter', async () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Change title and press Enter
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.change(input, { target: { value: 'Updated Column' } })
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
//       // Should show updated title immediately
//       await waitFor(() => {
//         expect(screen.getByText('Updated Column')).toBeInTheDocument()
//       })
//     })

//     it('should save title when input loses focus', async () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Change title and blur
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.change(input, { target: { value: 'Blurred Update' } })
//       fireEvent.blur(input)
      
//       // Should save the changes
//       await waitFor(() => {
//         expect(screen.getByText('Blurred Update')).toBeInTheDocument()
//       })
//     })

//     it('should cancel edit when pressing Escape', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Change title and press Escape
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.change(input, { target: { value: 'Cancelled Change' } })
//       fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })
      
//       // Should revert to original title
//       expect(screen.getByText('Test Column')).toBeInTheDocument()
//       expect(screen.queryByText('Cancelled Change')).not.toBeInTheDocument()
//     })

//     it('should not save empty title', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Clear title and try to save
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.change(input, { target: { value: '' } })
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
//       // Should show error and revert
//       expect(toast.error).toHaveBeenCalledWith('Column title cannot be empty')
//       expect(screen.getByText('Test Column')).toBeInTheDocument()
//     })

//     it('should not save whitespace-only title', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Set to whitespace and try to save
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.change(input, { target: { value: '   ' } })
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
//       // Should show error and revert
//       expect(toast.error).toHaveBeenCalledWith('Column title cannot be empty')
//       expect(screen.getByText('Test Column')).toBeInTheDocument()
//     })

//     it('should not save if title is unchanged', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Don't change title and press Enter
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
//       // Should exit edit mode without API call
//       expect(screen.getByText('Test Column')).toBeInTheDocument()
//       expect(screen.queryByDisplayValue('Test Column')).not.toBeInTheDocument()
//     })

//     it('should update title optimistically when edit is saved', async () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Change title and save
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.change(input, { target: { value: 'Updated Title' } })
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
//       // Should show updated title immediately due to optimistic update
//       await waitFor(() => {
//         expect(screen.getByText('Updated Title')).toBeInTheDocument()
//       })
//     })

//     it('should trim whitespace from title', async () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Add whitespace and save
//       const input = screen.getByDisplayValue('Test Column')
//       fireEvent.change(input, { target: { value: '  Trimmed Title  ' } })
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
//       // Should show trimmed title
//       await waitFor(() => {
//         expect(screen.getByText('Trimmed Title')).toBeInTheDocument()
//       })
//     })
//   })

//   describe('Delete Column', () => {
//     it('should show column menu button', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Should show menu button
//       const menuButton = screen.getByRole('button', { name: /open column menu/i })
//       expect(menuButton).toBeInTheDocument()
//     })

//     it('should call onDelete when handleDelete is triggered', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // We can't easily test the dropdown interaction with Radix UI in jsdom
//       // but we can verify the button exists and the onDelete prop is passed correctly
//       const menuButton = screen.getByRole('button', { name: /open column menu/i })
//       expect(menuButton).toBeInTheDocument()
      
//       // The onDelete function should be passed to the component
//       expect(mockOnDelete).toBeDefined()
//     })

//     it('should hide menu button when in edit mode', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter edit mode
//       const title = screen.getByText('Test Column')
//       fireEvent.click(title)
      
//       // Menu button should be hidden
//       expect(screen.queryByRole('button', { name: /open column menu/i })).not.toBeInTheDocument()
//     })
//   })

//   describe('Add Card Functionality', () => {
//     it('should show add card form when "Add a card" is clicked', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       const addButton = screen.getByRole('button', { name: /add a card/i })
//       fireEvent.click(addButton)
      
//       // Should show input form
//       expect(screen.getByPlaceholderText(/enter a title or paste a link/i)).toBeInTheDocument()
//       expect(screen.getByRole('button', { name: /add a card/i })).toBeInTheDocument()
//     })

//     it('should cancel add card when clicking X button', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter add card mode
//       const addButton = screen.getByRole('button', { name: /add a card/i })
//       fireEvent.click(addButton)
      
//       // Click cancel button (X)
//       const cancelButton = screen.getByRole('button', { name: /cancel adding card/i })
//       fireEvent.click(cancelButton)
      
//       // Should return to normal view
//       expect(screen.queryByPlaceholderText(/enter a title or paste a link/i)).not.toBeInTheDocument()
//     })

//     it('should cancel add card when pressing Escape', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter add card mode
//       const addButton = screen.getByRole('button', { name: /add a card/i })
//       fireEvent.click(addButton)
      
//       // Press Escape
//       const input = screen.getByPlaceholderText(/enter a title or paste a link/i)
//       fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })
      
//       // Should return to normal view
//       expect(screen.queryByPlaceholderText(/enter a title or paste a link/i)).not.toBeInTheDocument()
//     })

//     it('should add card when pressing Enter', () => {
//       render(<Column column={mockColumn} onDelete={mockOnDelete} />)
      
//       // Enter add card mode
//       const addButton = screen.getByRole('button', { name: /add a card/i })
//       fireEvent.click(addButton)
      
//       // Should show the input form
//       const input = screen.getByPlaceholderText(/enter a title or paste a link/i)
//       expect(input).toBeInTheDocument()
      
//       // Type title and press Enter
//       fireEvent.change(input, { target: { value: 'New Card' } })
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
//       // Should exit add mode
//       expect(screen.queryByPlaceholderText(/enter a title or paste a link/i)).not.toBeInTheDocument()
//     })
//   })
})