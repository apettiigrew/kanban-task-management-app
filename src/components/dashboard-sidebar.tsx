"use client"

import { CollapsibleProjectsList } from "@/components/collapsible-projects-list"
import { ProjectSearch } from "@/components/project-search"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { UserProfileHeader } from "@/components/user-profile-header"
import { TProject } from "@/models/project"


interface DashboardSidebarProps {
  projects: TProject[]
  searchQuery: string
  onSearchChange: (query: string) => void
  showAllProjects: boolean
  onToggleShowAll: () => void
  onHelp?: () => void
  username?: string
  avatarUrl?: string
  userInitials?: string
}

export function DashboardSidebar({
  projects,
  searchQuery,
  onSearchChange,
  showAllProjects,
  onToggleShowAll,
  onHelp: _onHelp,
  username,
  avatarUrl,
  userInitials
}: DashboardSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <UserProfileHeader 
          username={username}
          avatarUrl={avatarUrl}
          userInitials={userInitials}
        />
      </SidebarHeader>

      <SidebarContent>
        <ProjectSearch 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        <CollapsibleProjectsList
          projects={projects}
          showAllProjects={showAllProjects}
          onToggleShowAll={onToggleShowAll}
        />
      </SidebarContent>

     
      <SidebarRail />
    </Sidebar>
  )
}
