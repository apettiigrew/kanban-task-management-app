"use client"

import { useProjects } from "@/hooks/queries/use-projects"
import { useMemo, useState } from "react"
import { NavbarHeader } from "@/components/navbar-header"

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
    <div className="min-h-screen bg-white">
      <NavbarHeader 
        user={{
          name: "Andrew Pettigrew",
          email: "pettigrewhere@gmail.com",
          avatar: undefined,
        }}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
