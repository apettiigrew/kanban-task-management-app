"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProjectForm } from "@/components/project-form"
import { useUpdateProject } from "@/hooks/queries/use-projects"
import { TProject } from '@/utils/data'
import { toast } from "sonner"
import { FormError } from "@/lib/form-error-handler"

interface EditProjectModalProps {
  project: TProject
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectModal({ project, open, onOpenChange }: EditProjectModalProps) {
  const updateProjectMutation = useUpdateProject({
    onSuccess: () => {
      toast.success("Project updated successfully")
      onOpenChange(false)
    },
    onError: (error: FormError) => {
      // Error handling is now managed by the ProjectForm component
      // This callback is mainly for additional actions if needed
      console.error("Failed to update project:", error)
    }
  })

  const handleSuccess = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <ProjectForm
          mode="update"
          projectId={project.id}
          defaultValues={{
            title: project.title,
            description: project.description || "",
          }}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
} 