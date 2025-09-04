# Task List: Board Creation Improvements

## Relevant Files

- `src/components/project-dialog.tsx` - Main dialog component for project selection and creation
- `src/components/project-dialog.test.tsx` - Unit tests for project dialog component
- `src/components/board/board.tsx` - Board component that handles project creation and navigation
- `src/components/board/board.test.tsx` - Unit tests for board component
- `src/hooks/queries/use-projects.ts` - Project queries and mutations including create project
- `src/hooks/queries/use-projects.test.ts` - Unit tests for project hooks
- `src/components/ui/accordion.tsx` - Accordion component used in project dialog
- `src/components/ui/accordion.test.tsx` - Unit tests for accordion component
- `src/components/project-card.tsx` - Project card component for styling reference
- `src/components/card.tsx` - Card component with hover styles for reference

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Fix Project Creation Navigation and Dialog Behavior
  - [ ] 1.1 Update `handleCreateProject` in board component to navigate to newly created project automatically
  - [ ] 1.2 Prevent the create project pop over from closing when clicking inside the box
  - [ ] 1.3 Add proper success handling in create project mutation to trigger navigation
  - [ ] 1.4 Ensure dialog only closes after successful project creation and navigation

- [ ] 2.0 Improve Project Dialog Form UX
  - [ ] 2.1 Add proper label above the project name input field in the popover
  - [ ] 2.2 Implement form validation to prevent empty project names from being submitted
  - [ ] 2.3 Update create button to be disabled when input is empty or only whitespace
  - [ ] 2.4 Add visual feedback for form validation states

- [ ] 3.0 Fix Accordion Default State
  - [ ] 3.1 Modify accordion component to be expanded by default instead of collapsed
  - [ ] 3.2 Ensure projects list is visible immediately when dialog opens
  - [ ] 3.3 Test accordion behavior across different screen sizes

- [ ] 4.0 Standardize Project Card Hover Styling
  - [ ] 4.1 Update project card hover styles to match column card hover effects
  - [ ] 4.2 Apply consistent blue border and background styling on hover
  - [ ] 4.3 Ensure smooth transition animations match existing card components
  - [ ] 4.4 Test hover states across different project card states

- [ ] 5.0 Remove Optimistic Updates from Create Project
  - [ ] 5.1 Remove any optimistic update patterns from create project mutation
  - [ ] 5.2 Ensure create project mutation waits for server response before updating UI
  - [ ] 5.3 Add proper loading states during project creation
  - [ ] 5.4 Handle error states gracefully without optimistic updates
