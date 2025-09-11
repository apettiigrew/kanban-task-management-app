## Relevant Files

- `src/components/column/move-list-form.tsx` - Main MoveListForm component with board and position selectors
- `src/components/column/move-list-form.test.tsx` - Unit tests for MoveListForm component
- `src/components/column/column.tsx` - Integration of MoveListForm into existing dropdown menu
- `src/components/column/column.test.tsx` - Updated tests for column component with move list functionality
- `src/app/api/columns/[id]/move/route.ts` - API endpoint for moving columns between boards
- `src/app/api/columns/[id]/reposition/route.ts` - API endpoint for repositioning columns within same board
- `src/lib/validations/column.ts` - Updated validation schemas for move list operations
- `src/hooks/mutations/use-column-mutations.ts` - New mutations for move list operations
- `src/hooks/mutations/use-column-mutations.test.tsx` - Updated tests for column mutations
- `src/hooks/queries/use-projects.ts` - May need updates to support board selection
- `src/models/column.ts` - Type definitions for move list operations

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MoveListForm.tsx` and `MoveListForm.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Follow existing patterns from CopyListForm for dropdown form switching
- Implement optimistic updates following the pattern in use-column-mutations.ts
- Ensure proper error handling and rollback on mutation failures

## Tasks

- [x] 1.0 Create Move List UI Components and Dropdown Integration
  - [x] 1.1 Create MoveListForm component with board selector dropdown
  - [x] 1.2 Add position selector that shows available positions (1 to total lists in target board)
  - [x] 1.3 Implement form validation for both board and position selection
  - [x] 1.4 Add proper keyboard navigation and accessibility features
  - [x] 1.5 Create loading states and error handling for form submission
  - [x] 1.6 Add "Move List" option to existing column dropdown menu
  - [x] 1.7 Implement dropdown view switching from menu to move-list-form (similar to copy-list-form pattern)
  - [x] 1.8 Add back button and cancel functionality to return to main dropdown menu

- [x] 2.0 Implement Move List API Endpoints and Validation Schemas
  - [x] 2.1 Create validation schema for moving column to different board (moveColumnSchema)
  - [x] 2.2 Create validation schema for repositioning column within same board (repositionColumnSchema)
  - [x] 2.3 Create API endpoint POST /api/columns/[id]/move for moving between boards
  - [x] 2.4 Create API endpoint PUT /api/columns/[id]/reposition for repositioning within board
  - [x] 2.5 Implement proper error handling and validation in both endpoints
  - [x] 2.6 Add database transaction support for atomic operations
  - [x] 2.7 Update column order for all affected columns when repositioning
  - [x] 2.8 Ensure proper projectId validation and authorization

- [x] 3.0 Create Move List Mutations with Optimistic Updates
  - [x] 3.1 Create useMoveColumnToBoard mutation hook
  - [x] 3.2 Create useRepositionColumn mutation hook
  - [x] 3.3 Implement optimistic UI updates for both mutations
  - [x] 3.4 Add proper error rollback functionality on mutation failure
  - [x] 3.5 Support all API states: IDLE, LOADING, SUCCESS, ERROR, OPTIMISTIC
  - [x] 3.6 Add REFRESHING and STALE states for background updates
  - [x] 3.7 Update query cache invalidation for affected projects
  - [x] 3.8 Add mutation state tracking to useColumnMutationStates hook


- [x] 5.0 Integrate Move List Feature into Column Component
  - [x] 5.1 Add move list state management to ColumnHeader component
  - [x] 5.2 Integrate MoveListForm into existing dropdown menu structure
  - [x] 5.3 Wire up move list mutations to form submission
  - [x] 5.4 Add proper loading states during move operations
  - [x] 5.5 Implement error handling and user feedback for move operations
  - [x] 5.6 Ensure proper cleanup and state reset on form cancel


- [x] 4.0 Add Comprehensive Testing for Move List Functionality
  - [x] 4.1 Unit test MoveListForm component rendering and form interactions
  - [x] 4.2 Unit test dropdown view switching to "Move List" form
  - [x] 4.3 Unit test board selector displays all available boards
  - [x] 4.4 Unit test position selector shows correct available positions
  - [x] 4.5 Unit test form validation for required fields
  - [x] 4.6 Integration test moving list to another board updates projectId correctly
  - [x] 4.7 Integration test repositioning list within same board reorders all affected lists
  - [x] 4.8 Test all API states (loading, success, error, rollback on failure)
  - [x] 4.9 Test optimistic updates and error rollback scenarios
  - [x] 4.10 Test keyboard navigation and accessibility features
