"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EditProjectModal } from "@/components/edit-project-modal"
import { useState } from "react"
import { type TProject } from '@/utils/data'

interface ProjectDetailsModalProps {
  project: TProject
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteProject?: (projectId: string) => void
}

export function ProjectDetailsModal({ 
  project, 
  open, 
  onOpenChange,
  onDeleteProject,
}: ProjectDetailsModalProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{project.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(true)
                  onOpenChange(false)
                }}
              >
                Edit Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditProjectModal
        project={project}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </>
  )
}
