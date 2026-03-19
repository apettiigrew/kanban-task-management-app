"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogoutUser } from "@/hooks/mutations/use-auth-mutations"
import { useCurrentUser } from "@/hooks/queries/use-current-user"
import { cn } from "@/utils/utils"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

interface NavbarHeaderProps {
  className?: string
}

export function NavbarHeader({ className }: NavbarHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()
  const { mutate: logout, isPending: isLoggingOut } = useLogoutUser()
  const { data: currentUser } = useCurrentUser()


  const homeLogoClick = useCallback(() => {
   
    if (window.location.pathname !== "/home") {
      router.push("/home")
    }
  
  }, [router])



  const handleProfileClick = () => {
    setIsDropdownOpen(false)
  }

  const handleSettingsClick = () => {

    setIsDropdownOpen(false)
  }

  const handleLogoutClick = () => {
    setIsDropdownOpen(false)
    logout(undefined, {
      onSuccess: () => router.push("/"),
    })
  }

  const handleHelpClick = () => {

    setIsDropdownOpen(false)
  }

  const handleNotificationsClick = () => {

    setIsDropdownOpen(false)
  }

  const handleSwitchAccountsClick = () => {

    setIsDropdownOpen(false)
  }

  const handleManageAccountClick = () => {

    setIsDropdownOpen(false)
  }

  const handleActivityClick = () => {

    setIsDropdownOpen(false)
  }

  const handleCardsClick = () => {

    setIsDropdownOpen(false)
  }

  const handleThemeClick = () => {

    setIsDropdownOpen(false)
  }

  const handleCreateWorkspaceClick = () => {

    setIsDropdownOpen(false)
  }

  const handleShortcutsClick = () => {

    setIsDropdownOpen(false)
  }

  const getEmailInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase()
  }

  return (
    <header
      className={cn(
        "flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-2 backdrop-blur-sm border-b border-blue-200/30 shadow-sm",
        className
      )}
    >
      {/* App Name - Left Side */}
      <div className="flex items-center">
        <h1 onClick={homeLogoClick} className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight cursor-pointer">
          Kanban
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} alt={currentUser?.email} />
                <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                  {currentUser?.email ? getEmailInitials(currentUser.email) : "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 mt-2 p-0"
            sideOffset={8}
          >
            {/* ACCOUNT Section */}
            <div className="px-3 py-2">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-0 py-1">
                Account
              </DropdownMenuLabel>

              {/* User Info with Avatar */}
              <div className="flex items-center space-x-3 py-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={undefined} alt={currentUser?.email} />
                  <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                    {currentUser?.email ? getEmailInitials(currentUser.email) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email ?? ""}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            {/* Logout Section */}
            <div className="px-3 py-2">
              <DropdownMenuItem
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="px-0 py-1.5 cursor-pointer text-sm hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
