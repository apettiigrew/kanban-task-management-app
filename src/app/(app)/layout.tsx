"use client"

import { NavbarHeader } from "@/components/navbar-header"
import { useProjects } from "@/hooks/queries/use-projects"


interface AppLayoutProps {
  children: React.ReactNode
}
export default function AppLayout({ children }: AppLayoutProps) {

  const { data: projects = [] } = useProjects({ staleTime: 5 * 60 * 1000, refetchOnWindowFocus: true })

  return (
    <>
      <NavbarHeader />
      <main className="h-[calc(100%-57px)]">
        {children}
      </main>
    </>
  )
}
