"use client"

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeleteProject } from "@/hooks/queries/use-projects"
import { Project } from "@/types/project"
import { toast } from "sonner"
import { FormError } from "@/lib/form-error-handler"

interface DeleteProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProjectDialog({ project, open, onOpenChange }: DeleteProjectDialogProps) {
  const deleteProjectMutation = useDeleteProject({
    onSuccess: () => {
      toast.success(`Project "${project.title}" deleted successfully`)
      onOpenChange(false)
    },
    onError: (error: FormError) => {
      console.error("Failed to delete project:", error)
      toast.error(error.message || "Failed to delete project")
    }
  })

  const handleDelete = async () => {
    try {
      await deleteProjectMutation.mutateAsync(project.id)
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error("Failed to delete project:", error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>&ldquo;{project.title}&rdquo;</strong>? 
            This action cannot be undone and will permanently remove the project and all its associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProjectMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
          >
            {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 