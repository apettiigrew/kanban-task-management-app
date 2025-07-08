"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UserProfileHeader } from "@/components/user-profile-header"
import { ProjectSearch } from "@/components/project-search"
import { CollapsibleProjectsList } from "@/components/collapsible-projects-list"
import { SidebarHelpButton } from "@/components/sidebar-help-button"
import { TProject } from "@/utils/data"


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
  onHelp,
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
