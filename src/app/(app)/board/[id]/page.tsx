"use client"

import { Board } from "@/components/board/board"
import { ErrorBoundary } from "@/components/error-boundary"
import { NavbarHeader } from "@/components/navbar-header"
import { RouteLoading } from "@/components/route-loading"
import { useProject } from "@/hooks/queries/use-projects"
import { TProject } from "@/models/project"

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

  // console.log("project inside BoardContent", project)
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

  const handleProfileClick = () => {
    console.log("Profile clicked")
    // TODO: Navigate to profile page
  }

  const handleSettingsClick = () => {
    console.log("Settings clicked")
    // TODO: Navigate to settings page
  }

  const handleLogoutClick = () => {
    console.log("Logout clicked")
    // TODO: Implement logout functionality
  }

  const handleHelpClick = () => {
    console.log("Help clicked")
    // TODO: Navigate to help page
  }

  const handleNotificationsClick = () => {
    console.log("Notifications clicked")
    // TODO: Navigate to notifications page
  }

  const handleSwitchAccountsClick = () => {
    console.log("Switch accounts clicked")
    // TODO: Implement account switching
  }

  const handleManageAccountClick = () => {
    console.log("Manage account clicked")
    // TODO: Navigate to account management
  }

  const handleActivityClick = () => {
    console.log("Activity clicked")
    // TODO: Navigate to activity page
  }

  const handleCardsClick = () => {
    console.log("Cards clicked")
    // TODO: Navigate to cards page
  }

  const handleThemeClick = () => {
    console.log("Theme clicked")
    // TODO: Open theme selector
  }

  const handleCreateWorkspaceClick = () => {
    console.log("Create workspace clicked")
    // TODO: Navigate to workspace creation
  }

  const handleShortcutsClick = () => {
    console.log("Shortcuts clicked")
    // TODO: Open shortcuts modal
  }

  return (
    <div className="h-screen bg-background bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-200 overflow-hidden flex flex-col">
      <NavbarHeader
        user={{
          name: "Andrew Pettigrew",
          email: "pettigrewhere@gmail.com",
          avatar: undefined,
        }}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
        onLogoutClick={handleLogoutClick}
        onHelpClick={handleHelpClick}
        onNotificationsClick={handleNotificationsClick}
        onSwitchAccountsClick={handleSwitchAccountsClick}
        onManageAccountClick={handleManageAccountClick}
        onActivityClick={handleActivityClick}
        onCardsClick={handleCardsClick}
        onThemeClick={handleThemeClick}
        onCreateWorkspaceClick={handleCreateWorkspaceClick}
        onShortcutsClick={handleShortcutsClick}
      />

      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<RouteLoading message="Loading board..." />}>
          {project && <Board project={project} />}
        </Suspense>
      </main>
    </div>
  )
}
