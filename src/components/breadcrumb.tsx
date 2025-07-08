"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`} aria-label="Breadcrumb">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground">
          <Home className="h-4 w-4" />
          <span className="sr-only">Dashboard</span>
        </Link>
      </Button>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            </Button>
          ) : (
            <span className="px-2 py-1 font-medium text-foreground">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
