"use client"

import { NavbarHeader } from "@/components/navbar-header"
import { useProjects } from "@/hooks/queries/use-projects"


interface AppLayoutProps {
  children: React.ReactNode
}
export default function AppLayout({ children }: AppLayoutProps) {

  const { data: projects = [] } = useProjects({ staleTime: 5 * 60 * 1000, refetchOnWindowFocus: true })

  return (
    <div className="min-h-screen bg-white">
      <NavbarHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
