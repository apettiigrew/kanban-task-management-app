"use client"

import { Board } from "@/components/board"
import { ErrorBoundary } from "@/components/error-boundary"
import { RouteLoading } from "@/components/route-loading"
import { useProject } from "@/hooks/queries/use-projects"
import { ProjectWithColumnsAndTasks } from "@/utils/data"
import { useParams } from "next/navigation"
import { Suspense } from "react"

export default function BoardPage() {
  const params = useParams()
  const projectId = params.id as string

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-medium mb-2">Invalid project</h2>
          <p className="text-muted-foreground mb-4">
            No project ID provided
          </p>
          <a href="/dashboard" className="underline">Return to dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-medium mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            We encountered an error loading this board
          </p>
          <a href="/dashboard" className="underline">Return to dashboard</a>
        </div>
      </div>
    }>
      <BoardContent projectId={projectId} />
    </ErrorBoundary>
  )
}

interface BoardContentProps {
  projectId: string
}

function BoardContent({ projectId }: BoardContentProps) {
  const { data: project, error: projectError } = useProject({ id: projectId, refetchOnWindowFocus: true })

  if (projectError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-medium mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <a href="/dashboard" className="underline">Return to dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-h-screen bg-background bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-200">
      {/* <ProjectHeader
        project={project}
        isLoading={projectLoading}
      /> */}

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <Suspense fallback={<RouteLoading message="Loading board..." />}>
          {project && <Board project={project as ProjectWithColumnsAndTasks} />}
        </Suspense>
      </main>
    </div>
  )
}
