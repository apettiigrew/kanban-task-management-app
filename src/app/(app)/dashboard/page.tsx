"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { ProjectsGrid } from "@/components/projects-grid"
import { AddProjectModal } from "@/components/add-project-modal"
import { LoadingState } from "@/components/loading-spinner"
import { useProjects } from "@/hooks/queries/use-projects"
import { Toaster } from "sonner"

function DashboardContent() {
  const {  data: projects = [],  isLoading: loading, error} = useProjects({
    staleTime: 5 * 60 * 1000, // 5 mins
    refetchOnWindowFocus: true,
  })

  // Format error message for display
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null

  return (
    <div className="flex flex-col h-full w-full">
      <DashboardHeader />

      <main className="flex-1 overflow-auto p-6 w-full">
        <div className="flex items-center justify-between mb-6 w-full">
          <div>
            <h2 className="text-2xl font-bold">All Projects</h2>
            <p className="text-muted-foreground">Manage and track your projects</p>
          </div>
          <AddProjectModal />
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <p className="font-medium">Error</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}
        
        {loading ? (
          <LoadingState message="Loading projects..." />
        ) : (
          <ProjectsGrid 
            projects={projects}
          />
        )}
      </main>
      <Toaster />
    </div>
  )
}

export default DashboardContent
