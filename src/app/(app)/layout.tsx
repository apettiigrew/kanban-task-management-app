"use client"

import { useState, useMemo } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useProjects } from "@/hooks/queries/use-projects"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {  data: projects = [] } = useProjects({ staleTime: 5 * 60 * 1000,  refetchOnWindowFocus: true})
  
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter projects based on search query with memoization for performance
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    
    return projects.filter((project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projects, searchQuery])

  // Event handlers
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleToggleShowAll = () => {
    setShowAllProjects(!showAllProjects)
  }

  return (
    // <SidebarProvider>
    //   <DashboardSidebar
    //     projects={filteredProjects}
    //     searchQuery={searchQuery}
    //     onSearchChange={handleSearchChange}
    //     showAllProjects={showAllProjects}
    //     onToggleShowAll={handleToggleShowAll}
    //   />
    //   <SidebarInset>
    //     {children}
    //   </SidebarInset>
    // </SidebarProvider>
    <>
    {children}
    </>
  )
}
