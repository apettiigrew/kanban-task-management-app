# Form Error Handling with TanStack Query

This document describes the comprehensive form error handling implementation that provides seamless integration between React Hook Form, TanStack Query, and server-side validation feedback.

## Overview

The error handling system provides:

- **Unified Error Handling**: Consistent error handling across all forms and API interactions
- **Server-Side Validation**: Display server validation errors in forms with field-specific feedback  
- **TanStack Query Integration**: Proper error states, retry logic, and optimistic updates
- **Type Safety**: Full TypeScript support with proper error typing
- **Accessibility**: ARIA attributes and proper error announcements
- **User Experience**: Clear error messages, dismissible banners, and visual feedback

## Architecture

### Core Components

1. **`src/lib/form-error-handler.ts`** - Core error handling utilities
2. **`src/components/ui/form-error.tsx`** - Reusable error display components  
3. **`src/hooks/queries/use-projects.ts`** - Enhanced TanStack Query hooks
4. **`src/components/project-form.tsx`** - Example form implementation

### Error Flow

```
API Error → FormError Class → parseApiError() → Form Components → User Feedback
     ↓
TanStack Query → Error Callbacks → Field/General Error State → UI Components
```

## Key Features

### 1. Enhanced API Client

The `apiRequest` function provides:
- Automatic error parsing and classification
- Structured error responses with field-level details
- Network error handling
- Type-safe response parsing

```typescript
// Usage
const data = await apiRequest<Project>('/api/projects', {
  method: 'POST',
  body: JSON.stringify(projectData)
})
```

### 2. FormError Class

Custom error class that separates general errors from field-specific validation errors:

```typescript
class FormError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
    public originalError?: unknown
  )
}
```

### 3. Error Parsing

The `parseApiError` function converts various error types into a consistent format:

```typescript
interface FormErrorState {
  general?: string
  fields: Record<string, string>
}
```

### 4. TanStack Query Integration

Enhanced mutation hooks with error handling:

```typescript
export const useCreateProject = (options: UseCreateProjectOptions = {}) => {
  return useMutation({
    mutationFn: createProject,
    onError: (error: FormError, variables, context) => {
      // Handle field errors separately
      if (options.onFieldErrors && Object.keys(error.fieldErrors).length > 0) {
        options.onFieldErrors(error.fieldErrors)
      }
      options.onError?.(error)
    },
    // ... optimistic updates and retry logic
  })
}
```

## UI Components

### FieldError

Displays individual field validation errors:

```tsx
<FieldError error={errors.title?.message || fieldErrors.title} />
```

### FormErrorBanner

Shows general form errors with dismissible option:

```tsx
<FormErrorBanner 
  error={generalError} 
  onDismiss={clearGeneralError}
/>
```

### FormErrorSummary

Displays multiple field errors as a summary:

```tsx
<FormErrorSummary errors={fieldErrors} />
```

### FormStateDisplay

Wrapper component that manages error display logic:

```tsx
<FormStateDisplay
  error={generalError}
  fieldErrors={fieldErrors}
  onErrorDismiss={clearGeneralError}
>
  <form>...</form>
</FormStateDisplay>
```

### useFormErrorState Hook

Manages form error state with convenient utilities:

```tsx
const {
  generalError,
  fieldErrors,
  setError,
  setMultipleFieldErrors,
  clearErrors,
  hasErrors
} = useFormErrorState()
```

## Form Implementation Example

```tsx
export function ProjectForm({ mode = 'create', projectId }: ProjectFormProps) {
  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<CreateProject>({
    resolver: zodResolver(createProjectSchema)
  })

  // Error state management
  const {
    generalError,
    fieldErrors,
    setError: setGeneralError,
    setMultipleFieldErrors,
    clearErrors: clearFormErrors,
    clearGeneralError
  } = useFormErrorState()

  // Enhanced mutation with error handling
  const createProjectMutation = useCreateProject({
    onSuccess: (data) => {
      toast.success("Project created successfully")
      clearFormErrors()
      onSuccess?.()
    },
    onError: (error: FormError) => {
      if (Object.keys(error.fieldErrors).length > 0) {
        setFormErrors<CreateProject>(setError, error.fieldErrors)
        setMultipleFieldErrors(error.fieldErrors)
      } else {
        setGeneralError(error.message)
      }
    },
    onFieldErrors: (errors) => {
      setFormErrors<CreateProject>(setError, errors)
      setMultipleFieldErrors(errors)
    }
  })

  return (
    <FormStateDisplay
      error={generalError}
      fieldErrors={fieldErrors}
      onErrorDismiss={clearGeneralError}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            {...register("title")}
            aria-invalid={!!(errors.title || fieldErrors.title)}
            className={errors.title || fieldErrors.title ? "border-red-500" : ""}
          />
          <FieldError error={errors.title?.message || fieldErrors.title} />
        </div>
        {/* ... other fields */}
      </form>
    </FormStateDisplay>
  )
}
```

## Server-Side Error Format

The API should return errors in this format for optimal integration:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters long",
      "code": "too_small"
    },
    {
      "field": "email", 
      "message": "Email address is already in use",
      "code": "custom"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/projects"
}
```

## Error Types Handled

1. **Validation Errors**: Field-specific validation failures
2. **Server Errors**: General server-side errors  
3. **Network Errors**: Connection and timeout issues
4. **Prisma Errors**: Database constraint violations
5. **Authentication Errors**: Authorization failures

## Best Practices

### Form Implementation

1. **Clear errors before submission**:
   ```tsx
   const onSubmit = async (data) => {
     clearFormErrors()
     clearErrors()
     // ... submit logic
   }
   ```

2. **Combine Hook Form and server errors**:
   ```tsx
   <FieldError error={errors.title?.message || fieldErrors.title} />
   ```

3. **Visual feedback for error states**:
   ```tsx
   <Input
     aria-invalid={!!(errors.title || fieldErrors.title)}
     className={errors.title || fieldErrors.title ? "border-red-500" : ""}
   />
   ```

### TanStack Query Setup

1. **Use FormError for mutations**:
   ```tsx
   onError: (error: FormError) => {
     // Handle error appropriately
   }
   ```

2. **Implement field-specific error callbacks**:
   ```tsx
   onFieldErrors: (errors) => {
     setFormErrors<FormType>(setError, errors)
   }
   ```

3. **Don't retry on validation errors**:
   ```tsx
   retry: (failureCount, error) => {
     if (error instanceof FormError) return false
     return failureCount < 2
   }
   ```

### Accessibility

1. **Use proper ARIA attributes**:
   ```tsx
   <Input aria-invalid={!!error} />
   <div role="alert" aria-live="polite">{error}</div>
   ```

2. **Provide descriptive error messages**
3. **Support keyboard navigation**
4. **Use semantic HTML elements**

## Testing

The `FormErrorExamples` component provides comprehensive testing scenarios:

1. **Validation errors with field details**
2. **General server errors**
3. **Network connectivity issues** 
4. **Custom form errors**
5. **Error state management**

## Benefits

1. **Consistent UX**: Uniform error handling across all forms
2. **Developer Experience**: Type-safe, easy-to-use APIs
3. **Performance**: Optimistic updates with proper rollback
4. **Accessibility**: WCAG compliant error handling
5. **Maintainability**: Centralized error logic
6. **Robustness**: Handles edge cases and network issues

## Migration Guide

To update existing forms:

1. Replace basic error handling with `FormError` class
2. Use `FormStateDisplay` wrapper component
3. Update TanStack Query hooks to use enhanced versions
4. Add field-specific error display with `FieldError`
5. Implement proper error clearing logic

This implementation provides a robust foundation for form error handling that scales across the entire application while maintaining excellent user experience and developer productivity. 