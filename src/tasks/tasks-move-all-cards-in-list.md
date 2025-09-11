# Task List: Move All Cards in List Feature

## Relevant Files

- `src/components/column/column-header.tsx` - Contains the main dropdown menu where the new option will be added.
- `src/components/column/move-all-cards-form.tsx` - New component for the secondary dropdown view to select destination list.
- `src/components/column/move-all-cards-form.test.tsx` - Unit tests for the move all cards form component.
- `src/app/api/tasks/move-all/route.ts` - New API route to handle bulk card move operations.
- `src/lib/validations/task.ts` - Add validation schema for bulk move operation.
- `src/hooks/mutations/use-task-mutations.ts` - Add TanStack Query mutation for bulk move with optimistic updates.
- `src/components/column/column-header.test.tsx` - Unit tests for the updated column header with new menu option.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Add "Move all cards in list" option to column dropdown menu
- [x] 2.0 Create move all cards form component with destination list selection
- [x] 3.0 Implement API route for bulk card move operations
- [x] 4.0 Add TanStack Query mutation with optimistic UI updates
- [x] 5.0 Integrate form component with column header and handle state management
