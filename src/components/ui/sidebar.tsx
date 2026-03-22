"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { PanelLeft } from "lucide-react"

import { cn } from "@/utils/utils"

export const SidebarTrigger = ({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) => (
  <button
    type={type}
    className={cn(
      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    )}
    aria-label="Toggle sidebar"
    {...props}
  >
    <PanelLeft className="h-4 w-4" aria-hidden />
  </button>
)

export const Sidebar = ({ className, ...props }: React.ComponentProps<"aside">) => (
  <aside
    className={cn("flex h-full w-64 shrink-0 flex-col border-r border-border bg-background", className)}
    {...props}
  />
)

export const SidebarHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("shrink-0", className)} {...props} />
)

export const SidebarContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("min-h-0 flex-1 overflow-y-auto", className)} {...props} />
)

export const SidebarRail = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("hidden w-2 shrink-0 sm:block", className)} aria-hidden {...props} />
)

export const SidebarMenu = ({ className, ...props }: React.ComponentProps<"ul">) => (
  <ul className={cn("flex flex-col gap-0.5 p-2", className)} {...props} />
)

export const SidebarMenuItem = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li className={cn("list-none", className)} {...props} />
)

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean
}

export const SidebarMenuButton = ({
  className,
  asChild = false,
  type = "button",
  ...props
}: SidebarMenuButtonProps) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    />
  )
}
