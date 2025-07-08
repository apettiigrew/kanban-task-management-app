"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateProject, useUpdateProject, type CreateProjectData, type UpdateProjectData } from "@/hooks/queries/use-projects"
import { FormError, setFormErrors } from "@/lib/form-error-handler"
import { createProjectSchema, updateProjectSchema, type CreateProject, type UpdateProject } from "@/lib/validations/project"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { FieldError, FormStateDisplay, useFormErrorState } from "./ui/form-error"
import { Textarea } from "./ui/textarea"

interface ProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  defaultValues?: Partial<CreateProject>
  mode?: 'create' | 'update'
  projectId?: string
}

export function ProjectForm({ 
  onSuccess, 
  onCancel, 
  defaultValues,
  mode = 'create',
  projectId
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm<CreateProject | UpdateProject>({
    resolver: zodResolver(mode === 'create' ? createProjectSchema : updateProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      ...defaultValues
    }
  })

  // Use the form error state hook for server-side error management
  const {
    generalError,
    fieldErrors,
    setError: setGeneralError,
    setMultipleFieldErrors,
    clearErrors: clearFormErrors,
    clearGeneralError,
    hasErrors
  } = useFormErrorState()

  // Clear errors when form values change
  React.useEffect(() => {
    // Only clear server errors if there are client-side validation errors
    if (Object.keys(errors).length > 0) {
      clearFormErrors()
    }
  }, [errors, clearFormErrors])

  const handleFormErrors = React.useCallback((error: FormError) => {
    // If there are field errors, set them in both React Hook Form and our error state
    if (Object.keys(error.fieldErrors).length > 0) {
      setFormErrors<CreateProject | UpdateProject>(setError, error.fieldErrors)
      setMultipleFieldErrors(error.fieldErrors)
    } else {
      // If no field errors, show as general error
      setGeneralError(error.message)
    }
  }, [setError, setMultipleFieldErrors, setGeneralError])

  const createProjectMutation = useCreateProject({
    onSuccess: (data) => {
      toast.success("Project created successfully")
      reset()
      clearFormErrors()
      onSuccess?.()
    },
    onError: (error) => {
      handleFormErrors(error)
      toast.error("Failed to create project")
    },
    onFieldErrors: (errors) => {
      setFormErrors<CreateProject | UpdateProject>(setError, errors)
      setMultipleFieldErrors(errors)
    }
  })

  const updateProjectMutation = useUpdateProject({
    onSuccess: (data) => {
      toast.success("Project updated successfully")
      reset()
      clearFormErrors()
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Update project error:', error)
      handleFormErrors(error)
      toast.error("Failed to update project")
    },
    onFieldErrors: (errors) => {
      setFormErrors<CreateProject | UpdateProject>(setError, errors)
      setMultipleFieldErrors(errors)
    }
  })

  const onSubmit = async (data: CreateProject | UpdateProject) => {
    // Clear any existing errors before submitting
    clearFormErrors()
    clearErrors()

    try {
      if (mode === 'create') {
        toast.loading("Creating project...", { id: 'project-create' })
        await createProjectMutation.mutateAsync(data as CreateProjectData)
        toast.dismiss('project-create')
      } else if (mode === 'update' && projectId) {
        toast.loading("Updating project...", { id: 'project-update' })
        await updateProjectMutation.mutateAsync({
          id: projectId,
          data: data as UpdateProjectData
        })
        toast.dismiss('project-update')
      }
    } catch (error) {
      if (mode === 'create') {
        toast.dismiss('project-create')
      } else {
        toast.dismiss('project-update')
      }
      
      // Error handling is done in the mutation callbacks
      console.error(`Failed to ${mode} project:`, error)
    }
  }

  const isLoading = isSubmitting || createProjectMutation.isPending || updateProjectMutation.isPending

  return (
    <FormStateDisplay
      error={generalError}
      fieldErrors={fieldErrors}
      onErrorDismiss={clearGeneralError}
      className="space-y-4"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Enter project title"
            disabled={isLoading}
            aria-invalid={!!(errors.title || fieldErrors.title)}
            className={errors.title || fieldErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.title?.message || fieldErrors.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Enter project description"
            disabled={isLoading}
            aria-invalid={!!(errors.description || fieldErrors.description)}
            className={errors.description || fieldErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.description?.message || fieldErrors.description} />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || hasErrors}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Create Project' : 'Update Project'}
          </Button>
        </div>
      </form>
    </FormStateDisplay>
  )
} 