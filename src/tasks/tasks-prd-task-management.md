# Task List: Task Management App Implementation

**Based on:** `prd-task-management.md`  
**Created:** May 30, 2025  
**Target:** Junior Developer Implementation Guide

## Overview

This task list implements a multi-project Kanban task management system with drag-and-drop functionality, built on Next.js with local storage persistence. All data operations are handled through TanStack Query for optimal performance, caching, and real-time updates.

## ⚠️ IMPORTANT: PERMISSION REQUIRED

**ALWAYS ask for PERMISSION before starting any new task. NEVER start a new task without explicit user approval.**

## 📋 TASK COMPLETION WORKFLOW

**When completing tasks, follow this workflow:**
1. Complete the implementation work for the task
2. **WAIT** for the user to confirm the task is completed to their satisfaction
3. **ONLY AFTER** user confirmation, mark the task as completed with `[x]` in this document
4. **ONLY AFTER** marking as completed, create the git commit with an appropriate commit message
5. **NEVER** mark tasks as completed or create git commits without explicit user confirmation

This ensures quality control and allows the user to review and test implementations before they are considered "done".

## Relevant Files

- `prisma/schema.prisma` - Prisma database schema for Project, Task, and Column models
- `src/types/project.ts` - TypeScript interfaces for Project, Task, and Column data models
- `src/types/task.ts` - Enhanced task type definitions with multi-project support
- `src/lib/prisma.ts` - Prisma client configuration and connection
- `src/lib/validations/project.ts` - Zod validation schemas for project operations
- `src/lib/validations/task.ts` - Zod validation schemas for task operations
- `src/lib/validations/column.ts` - Zod validation schemas for column operations
- `src/hooks/queries/use-projects.ts` - TanStack Query hooks for project operations
- `src/hooks/queries/use-tasks.ts` - TanStack Query hooks for task operations
- `src/hooks/queries/use-columns.ts` - TanStack Query hooks for column operations
- `src/hooks/mutations/use-project-mutations.ts` - TanStack Query mutations for projects
- `src/hooks/mutations/use-task-mutations.ts` - TanStack Query mutations for tasks
- `src/hooks/mutations/use-column-mutations.ts` - TanStack Query mutations for columns
- `src/app/api/projects/route.ts` - API route for project CRUD operations
- `src/app/api/projects/[id]/route.ts` - API route for individual project operations
- `src/app/api/tasks/route.ts` - API route for task CRUD operations
- `src/app/api/tasks/[id]/route.ts` - API route for individual task operations
- `src/app/api/columns/route.ts` - API route for column CRUD operations
- `src/app/api/columns/[id]/route.ts` - API route for individual column operations
- `src/components/project-dashboard.tsx` - Main dashboard component with TanStack Query
- `src/components/project-dashboard.test.tsx` - Unit tests for project dashboard
- `src/components/project-card.tsx` - Individual project card using Shadcn components
- `src/components/project-form.tsx` - Form component using React Hook Form and Zod
- `src/components/project-form.test.tsx` - Unit tests for project form
- `src/components/enhanced-task-card.tsx` - Enhanced task card with Shadcn UI components
- `src/components/enhanced-task-card.test.tsx` - Unit tests for enhanced task card
- `src/components/task-form-modal.tsx` - Modal using Shadcn Dialog and React Hook Form
- `src/components/column-manager.tsx` - Column management with drag-and-drop and forms
- `src/app/dashboard/page.tsx` - Dashboard page component with TanStack Query
- `src/app/project/[id]/page.tsx` - Individual project board page with real-time data
- `src/app/project/[id]/layout.tsx` - Layout for project pages

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npm test` to run Jest tests for the project
- Use Shadcn UI components and Tailwind CSS for all UI elements
- Use Lucide React icons for all icon requirements
- Leverage existing drag-and-drop implementation from @atlaskit/pragmatic-drag-and-drop
- All data persistence handled through PostgreSQL with Prisma ORM
- Use TanStack Query for all data fetching and mutations with proper caching and invalidation
- Form validation with React Hook Form and Zod schemas
- Server-side validation with Zod in API routes
- Implement optimistic updates for all mutations using TanStack Query
- Use TanStack Query's built-in error handling and loading states

## Tasks

- [x] 1.0 Set up database schema and data persistence infrastructure
  - [x] 1.1 Create Prisma schema in `prisma/schema.prisma` for Project, Task, and Column models
    - **Git commit:** `feat: add prisma schema with project, column, and task models`
  - [x] 1.2 Set up Prisma client configuration in `src/lib/prisma.ts`
    - **Git commit:** `feat: configure prisma client with global singleton pattern`
  - [x] 1.3 Create Zod validation schemas for all data models in `src/lib/validations/`
    - **Git commit:** `feat: add comprehensive zod validation schemas for all models`
  - [x] 1.4 Update TypeScript interfaces in `src/types/` to match Prisma models
    - **Git commit:** `refactor: update typescript interfaces to match prisma schema`
  - [x] 1.5 Run initial database migration
    - **Git commit:** `feat: run initial database migration`
  - [x] 1.6 Create API routes for CRUD operations on all models
    - **Git commit:** `feat: implement comprehensive crud api routes with validation`
  - [x] 1.7 Implement error handling and data validation in API routes using Zod
    - **Git commit:** `feat: implement centralized error handling and validation across all api routes`

- [x] 2.0 Implement TanStack Query hooks and multi-project dashboard
  - [x] 2.1 Create TanStack Query hooks in `src/hooks/queries/use-projects.ts` for fetching projects
    - **Git commit:** `feat: implement tanstack query hooks for projects with creation mutations`
  - [X] 2.2 Create TanStack Query mutation hooks in `src/hooks/mutations/use-project-mutations.ts`
  - [x] 2.3 Build project dashboard component using TanStack Query and Shadcn UI components
    - **Git commit:** `feat: implement project dashboard with tanstack query integration`
  - [x] 2.4 Implement project navigation and routing structure with loading states
    - **Git commit:** `feat: implement project navigation and routing structure with sidebar`

- [x] 3.0 Create project CRUD operations with forms and validation
  - [x] 3.1 Build project creation form using React Hook Form and Zod validation with TanStack Query mutations
  - [x] 3.2 Create project editing modal using Shadcn Dialog and form components with optimistic updates
  - [x] 3.3 Implement project deletion with Shadcn AlertDialog confirmation and TanStack Query invalidation
  - [x] 3.4 Add optimistic updates using TanStack Query mutations for all project operations
  - [x] 3.5 Implement form error handling and server-side validation feedback with TanStack Query error states

- [x] 4.0 Build enhanced task management with database integration and optimistic updates
  - [x] 4.1 Create TanStack Query hooks for task operations in `src/hooks/queries/use-tasks.ts` with proper caching and query key factory
  - [x] 4.2 Build task mutation hooks in `src/hooks/mutations/use-task-mutations.ts` with optimistic updates using TanStack Query
  - [x] 4.4 Build task editing modal using React Hook Form and Shadcn Dialog with optimistic mutation handling with tanstack. The modal
  should have the ability to inline edit the title and description of the card. The description should be updated using "@tiptap/pm package that will allow users add formatting styles to their text like bold, text and italic. Before completing this task ask for image to follow to setup the description.
  - [x] 4.5 Implement task deletion with confirmation using Shadcn AlertDialog and TanStack Query optimistic updates and invalidation that is only done on the view modal
  - [x] 4.6 Implement real-time task updates using TanStack Query invalidation, optimistic updates, and automatic refetching
  - [x] 4.7 Write unit tests for enhanced task management components with TanStack Query mocks and optimistic update scenarios

- [x] 5.0 Build enhanced column management with database integration
  - [x] 5.1 Create TanStack Query hooks for column operations in `src/hooks/queries/use-columns.ts` with proper caching
  - [x] 5.2 Build column mutation hooks in `src/hooks/mutations/use-column-mutations.ts` with optimistic updates
  - [x] 5.3 Update existing column creation form to using React Hook Form and tanstack to create column associated with a board.
  - [x] 5.4 Update existing column editing form to using React Hook Form and tanstack to update column associated with a board.
  - [x] 5.5 Implement column deletion with confirmation using Shadcn AlertDialog and TanStack Query invalidation


- [ ] 6.0 Implement drag-and-drop functionality with database persistence
  - [x] 6.1 Extend existing drag-and-drop to work with database-backed data using TanStack Query
  - [x] 6.2 Implement task reordering within columns with optimistic updates and TanStack Query mutations
  - [x] 6.3 Add drag-and-drop for moving tasks between columns with TanStack Query mutation handling
  - [ ] 6.4 Implement column drag-and-drop reordering with TanStack Query mutations and optimistic updates
  - [ ] 6.5 Implement visual feedback using Tailwind CSS animations during drag operations
  - [ ] 6.6 Ensure all drag operations persist immediately to database via TanStack Query with proper error handling
  - [ ] 6.7 Add conflict resolution for concurrent drag operations using TanStack Query invalidation
