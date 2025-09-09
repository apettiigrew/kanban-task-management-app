# Copy List Feature Implementation

## Title
Implement Copy List Functionality with Nested Data Duplication

## Description
Create the ability to copy a list (column) by clicking the "Copy list" option from the dropdown menu. The copied list should create a brand new list with duplicate data for all cards, checklists, and checklist items while maintaining their relationships. The copied list should be created with an order value of "the order of the list being copied + 1".

The copy list functionality should present a new view within the same frame as the dropdown menu view, showing all existing options when the "Copy list" option is clicked. Once clicked, a new view with a form containing the title of the list being copied should appear, with a back arrow button to return to the previous menu options.

## Follow my lead
- !!!!!! VERY IMPORTANT !!!!!!!!!
- Ask for permission before moving on to the next task
- You wait for my approval before moving on to the next task 
- You will work on each task one a time. 
- You will wait for my approval after completing each task!!!
- NEVER BREAK THE ABOVE RULES.....NEVER !!!
- After each task, mark the task with an x to signal it was completed by you .
- !!!!!! VERY IMPORTANT !!!!!!!!!

## Relevant Files

- `src/components/column/column.tsx` - Main column component with dropdown menu, needs copy list view integration
- `src/components/column/copy-list-form.tsx` - New component for copy list form view
- `src/components/column/column.test.tsx` - Update existing tests and add copy list functionality tests
- `src/hooks/mutations/use-column-mutations.ts` - Add new `useCopyColumn` mutation hook
- `src/hooks/mutations/__mocks__/use-column-mutations.ts` - Mock for copy column mutation in tests
- `src/app/api/columns/[id]/copy/route.ts` - New API endpoint for copying columns with nested data
- `src/app/api/columns/[id]/copy/route.test.ts` - Unit tests for copy column API endpoint
- `src/lib/validations/column.ts` - Add validation schema for copy column operation

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Follow existing patterns for mutations, API routes, and validation schemas
- Use database transactions to ensure data consistency during copy operation
- Implement optimistic updates at component level for immediate UI feedback
- Ensure proper error handling and user feedback for all API states
- Maintain accessibility standards with proper ARIA labels and keyboard navigation
- Only create the task if it does not exist.
## Tasks

- [x] 1.0 Create Copy List Form Component
  - [x] 1.1 Create `copy-list-form.tsx` component with form structure
  - [x] 1.2 Implement form validation for list title (required, max length)
  - [x] 1.3 Add back arrow button to return to dropdown menu options
  - [x] 1.4 Add "Create list" button to execute copy operation
  - [x] 1.5 Implement keyboard navigation support (Enter to submit, Escape to cancel)
  - [x] 1.6 Add accessibility features (ARIA labels, focus management)

- [x] 2.0 Integrate Copy List View into Column Component
  - [x] 2.1 Add "Copy list" option to dropdown menu
  - [x] 2.2 Implement view switching logic between dropdown and copy form
  - [x] 2.3 Handle form state management and data flow
  - [x] 2.4 Add loading states during copy operation
  - [x] 2.5 Implement success feedback after successful copy
  - [x] 2.6 Add error handling with user-friendly messages

- [x] 3.0 Create Copy Column Mutation Hook
  - [x] 3.1 Create new `useCopyColumn` mutation hook following existing patterns
  - [x] 3.2 Implement optimistic UI updates at component level
  - [x] 3.3 Add proper error handling and rollback mechanisms
  - [x] 3.4 Handle all API states (IDLE, LOADING, SUCCESS, ERROR, OPTIMISTIC)
  - [x] 3.5 Prevent duplicate requests during copy operation

- [x] 4.0 Implement Copy Column API Endpoint
  - [x] 4.1 Create `/api/columns/[id]/copy` route with POST method
  - [x] 4.2 Implement nested data duplication in single database transaction
  - [x] 4.3 Handle column order calculation (original order + 1)
  - [x] 4.4 Duplicate all cards belonging to the original list
  - [x] 4.5 Duplicate all checklists belonging to each card
  - [x] 4.6 Duplicate all checklist items belonging to each checklist
  - [x] 4.7 Maintain proper relationships between all duplicated entities

- [x] 5.0 Add Validation Schema and Testing
  - [x] 5.1 Add validation schema for copy column operation in `column.ts`
  - [x] 5.2 Write unit tests for copy column mutation hook
  - [x] 5.3 Write unit tests for copy column API endpoint
  - [x] 5.4 Write integration tests for complete copy list flow
  - [x] 5.5 Add test cases for error scenarios and edge cases
  - [x] 5.6 Add test cases for optimistic updates and rollback behavior
  - [x] 5.7 Update existing column component tests for copy functionality
