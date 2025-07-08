"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronRight, ChevronDown, Hash } from "lucide-react"
import Link from "next/link"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Project } from "@/types/project"

interface CollapsibleProjectsListProps {
  projects: Project[]
  showAllProjects: boolean
  onToggleShowAll: () => void
  maxDisplayed?: number
}

export function CollapsibleProjectsList({ 
  projects, 
  showAllProjects, 
  onToggleShowAll,
  maxDisplayed = 10 
}: CollapsibleProjectsListProps) {
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)

  // Limit displayed projects in sidebar
  const displayedProjects = showAllProjects ? projects : projects.slice(0, maxDisplayed)

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [displayedProjects, showAllProjects])

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium bg-muted/50 hover:bg-muted/70 transition-colors"
      >
        <span>My Projects</span>
        <ChevronRight 
          className={`h-4 w-4 transition-all duration-300 ease-out ${
            isProjectsCollapsed ? 'rotate-0' : 'rotate-90'
          }`} 
        />
      </button>
      
      <div 
        className="transition-all duration-400 ease-out overflow-hidden"
        style={{
          maxHeight: isProjectsCollapsed ? '0px' : `${contentHeight}px`,
          opacity: isProjectsCollapsed ? 0 : 1,
          transform: isProjectsCollapsed ? 'translateY(-8px)' : 'translateY(0px)'
        }}
      >
        <div ref={contentRef} className="transition-all duration-200 ease-in-out">
          <SidebarMenu>
            {displayedProjects.map((project, index) => (
              <SidebarMenuItem 
                key={project.id}
                className={`transition-all duration-200 ease-in-out ${
                  isProjectsCollapsed ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  animationDelay: isProjectsCollapsed ? '0ms' : `${index * 50}ms`,
                  animation: isProjectsCollapsed ? 'none' : 'fadeInUp 0.3s ease-out forwards'
                }}
              >
                <SidebarMenuButton asChild className="justify-between">
                  <Link href={`/board/${project.id}`}>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>{project.title}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {project.tasks?.length || 0}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {projects.length > maxDisplayed && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onToggleShowAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    {showAllProjects ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <span>Show less</span>
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        <span>Show {projects.length - maxDisplayed} more</span>
                      </>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </div>
      </div>
    </div>
  )
}
