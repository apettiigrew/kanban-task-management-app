# Tasks: Sort Cards in a List

## Relevant Files

- `src/components/column/column-header.tsx` - Contains the dropdown menu where sorting options will be added
- `src/components/column/sort-cards-form.tsx` - New component for sorting options UI
- `src/app/api/columns/[id]/sort/route.ts` - New API route for sorting cards in a column
- `src/lib/validations/column.ts` - Add validation schema for sort request
- `src/hooks/mutations/use-column-mutations.ts` - Add sort cards mutation hook
- `src/hooks/queries/use-columns.ts` - Update to handle sorted card data
- `src/components/column/column.tsx` - Update to conditionally show sort option and handle sorted cards
- `src/components/column/sort-cards-form.test.tsx` - Unit tests for sort cards form
- `src/app/api/columns/[id]/sort/route.test.ts` - Unit tests for sort API route
- `src/hooks/mutations/use-column-mutations.test.ts` - Unit tests for sort mutation

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Create API route for sorting cards in a column
  - [x] 1.1 Create `src/app/api/columns/[id]/sort/route.ts` with POST endpoint
  - [x] 1.2 Implement card sorting logic (newest first, oldest first, alphabetical)
  - [x] 1.3 Add proper error handling and validation
  - [x] 1.4 Return updated column with sorted cards
  - [x] 1.5 Follow existing API patterns for consistency

- [x] 2.0 Add validation schema for sort request
  - [x] 2.1 Add `sortCardsSchema` to `src/lib/validations/column.ts`
  - [x] 2.2 Define sort type enum (newest-first, oldest-first, alphabetical)
  - [x] 2.3 Add validation for column ID and sort type
  - [x] 2.4 Export schema for use in API route and mutations

- [x] 3.0 Create TanStack Query mutation for sorting cards
  - [x] 3.1 Add `sortCards` API client function in `src/utils/api-client.ts`
  - [x] 3.2 Create `useSortCards` mutation hook in `src/hooks/mutations/use-column-mutations.ts`
  - [x] 3.3 Implement optimistic UI updates with rollback on error
  - [x] 3.4 Handle all mutation states (idle, loading, success, error, refreshing, stale, optimistic)
  - [x] 3.5 Add mutation to `useColumnMutationStates` hook

- [x] 4.0 Build sort cards form component
  - [x] 4.1 Create `src/components/column/sort-cards-form.tsx`
  - [x] 4.2 Implement radio button selection for sort options
  - [x] 4.3 Add proper accessibility attributes (ARIA labels, keyboard navigation)
  - [x] 4.4 Style with TailwindCSS following existing form patterns
  - [x] 4.5 Add cancel and confirm button handlers
  - [x] 4.6 Show current sort option if already sorted

- [x] 5.0 Integrate sorting functionality into column dropdown menu
  - [x] 5.1 Add "Sort cards" option to dropdown menu in `column-header.tsx`
  - [x] 5.2 Show sort option only when column has 2+ cards
  - [x] 5.3 Add new dropdown view state for sort form
  - [x] 5.4 Implement click handlers for sort form navigation
  - [x] 5.5 Add proper menu item styling and icons

- [x] 6.0 Update column component to handle sorted cards display
  - [x] 6.1 Modify `DisplayCards` component to respect sort order
  - [x] 6.2 Add sort state management to column component
  - [x] 6.3 Update card rendering to show sorted order
  - [x] 6.4 Handle sort state persistence and updates
  - [x] 6.5 Ensure drag-and-drop still works with sorted cards

- [ ] 7.0 Add comprehensive tests for all new functionality
  - [ ] 7.1 Create unit tests for `sort-cards-form.tsx`
  - [ ] 7.2 Create unit tests for sort API route
  - [ ] 7.3 Create unit tests for `useSortCards` mutation hook
  - [ ] 7.4 Add integration tests for sort functionality in column component
  - [ ] 7.5 Test accessibility features and keyboard navigation
  - [ ] 7.6 Test error handling and rollback scenarios
