"use client"

import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react"
import { Search, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ProjectItem {
  id: string
  name: string
}

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  searchPlaceholder?: string
  createButtonText?: string
  createInputPlaceholder?: string
  projects?: ProjectItem[]
  onProjectSelect?: (project: ProjectItem) => void
  onCreateProject?: (name: string) => void
  onProjectCreated?: () => void
  isLoading?: boolean
}

export interface ProjectDialogRef {
  resetForm: () => void
}

export const ProjectDialog = forwardRef<ProjectDialogRef, ProjectDialogProps>(({ 
  open, 
  onOpenChange,
  title = "Select Project",
  searchPlaceholder = "Search projects...",
  createButtonText = "Create",
  createInputPlaceholder = "Board title",
  projects = [],
  onProjectSelect,
  onCreateProject,
  isLoading = false
}, ref) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [newProjectName, setNewProjectName] = useState("")

  const filteredProjects = projects.filter((project) => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset form when project is successfully created
  const resetForm = () => {
    setNewProjectName("")
  }

  useImperativeHandle(ref, () => ({
    resetForm
  }))

  // console.log("ProjectDialog")
  const handleCreateProject = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    // console.log("Clicking")
    if (newProjectName.trim() && onCreateProject) {
      console.log("newProjectName inside handleCreateProject", newProjectName)
      onCreateProject(newProjectName.trim())
    }
  }, [newProjectName, onCreateProject])

  const handleProjectSelect = (project: ProjectItem) => {
    if (onProjectSelect) {
      onProjectSelect(project)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* Search Box - Full Width */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Scrollable Accordion Container */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="projects" className="border-none">
              <div className="flex items-center justify-between w-full py-3">
                <AccordionTrigger className="hover:no-underline flex-1 text-left">
                  <span className="text-sm font-medium">Projects</span>
                </AccordionTrigger>
                {onCreateProject && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-accent ml-2"
                        disabled={isLoading}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" align="end">
                      <div className="space-y-3">
                        <Input
                          placeholder={createInputPlaceholder}
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          disabled={isLoading}
                        />
                        <Button 
                          onClick={handleCreateProject} 
                          className="w-full" 
                          disabled={newProjectName.trim().length == 0}
                        >
                          {createButtonText}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <AccordionContent className="pb-0">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">Loading...</div>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className="p-3 rounded-md hover:border hover:border-border hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200"
                        onClick={() => handleProjectSelect(project)}
                      >
                        <span className="text-sm">{project.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      {searchQuery ? "No projects found" : "No projects available"}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  )
})

ProjectDialog.displayName = "ProjectDialog"
