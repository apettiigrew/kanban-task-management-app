"use client"

import { ProjectCard } from "@/components/project-card"
import { TProject } from '@/utils/data'

interface ProjectsGridProps {
  projects: TProject[]
  className?: string
}

export function ProjectsGrid({ projects, className = "" }: ProjectsGridProps) {
  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
        />
      ))}
    </div>
  )
}
