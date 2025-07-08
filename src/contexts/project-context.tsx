"use client"

import { Project } from "@/models/project"
import React, { createContext, useContext, useState, ReactNode } from "react"


interface ProjectContextType {
  projects: Project[]
  loading: boolean
  error: string | null
  addProject: (project: Omit<Project, "id">) => Promise<void>
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  getProject: (id: number) => Project | undefined
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

interface ProjectProviderProps {
  children: ReactNode
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addProject = async (newProject: Omit<Project, "id">) => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const id = Math.max(...projects.map(p => p.id), 0) + 1
      const project: Project = {
        ...newProject,
        id,
      }
      setProjects(prev => [...prev, project])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project")
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: number, updates: Partial<Project>) => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setProjects(prev =>
        prev.map(project =>
          project.id === id ? { ...project, ...updates } : project
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project")
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setProjects(prev => prev.filter(project => project.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project")
    } finally {
      setLoading(false)
    }
  }

  const getProject = (id: number) => {
    return projects.find(project => project.id === id)
  }

  const value: ProjectContextType = {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    getProject,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider")
  }
  return context
}
