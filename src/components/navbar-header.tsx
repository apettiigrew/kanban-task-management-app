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
import { cn } from "@/utils/utils"
import { ChevronRight, ExternalLink, Users } from "lucide-react"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

interface NavbarHeaderProps {
  className?: string
}

export function NavbarHeader({ className }: NavbarHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()
  const user = {
    name: "Andrew Pettigrew",
    email: "pettigrewhere@gmail.com",
    avatar: undefined,
  }


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

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header
      className={cn(
        "flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-sm border-b border-blue-200/30 shadow-sm",
        className
      )}
    >
      {/* App Name - Left Side */}
      <div className="flex items-center">
        <h1 onClick={homeLogoClick} className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight cursor-pointer">
          Mello
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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                  {user.name ? getUserInitials(user.name) : "U"}
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
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                    {user.name ? getUserInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email || "user@example.com"}
                  </p>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-1">
                <DropdownMenuItem
                  onClick={handleSwitchAccountsClick}
                  className="px-0 py-1.5 cursor-pointer text-sm"
                >
                  <span>Switch accounts</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleManageAccountClick}
                  className="px-0 py-1.5 cursor-pointer text-sm flex items-center justify-between"
                >
                  <span>Manage account</span>
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                </DropdownMenuItem>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* MELLO Section */}
            <div className="px-3 py-2">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-0 py-1">
                Mello
              </DropdownMenuLabel>

              <div className="space-y-1">
                <DropdownMenuItem
                  onClick={handleProfileClick}
                  className="px-0 py-1.5 cursor-pointer text-sm"
                >
                  <span>Profile and visibility</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleActivityClick}
                  className="px-0 py-1.5 cursor-pointer text-sm"
                >
                  <span>Activity</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleCardsClick}
                  className="px-0 py-1.5 cursor-pointer text-sm"
                >
                  <span>Cards</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSettingsClick}
                  className="px-0 py-1.5 cursor-pointer text-sm"
                >
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleThemeClick}
                  className="px-0 py-1.5 cursor-pointer text-sm flex items-center justify-between"
                >
                  <span>Theme</span>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </DropdownMenuItem>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Workspace/Help Section */}
            <div className="px-3 py-2">
              <div className="space-y-1">
                <DropdownMenuItem
                  onClick={handleCreateWorkspaceClick}
                  className="px-0 py-1.5 cursor-pointer text-sm flex items-center"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Create Workspace</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleHelpClick}
                  className="px-0 py-1.5 cursor-pointer text-sm"
                >
                  <span>Help</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleShortcutsClick}
                  className="px-0 py-1.5 cursor-pointer text-sm"
                >
                  <span>Shortcuts</span>
                </DropdownMenuItem>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Logout Section */}
            <div className="px-3 py-2">
              <DropdownMenuItem
                onClick={handleLogoutClick}
                className="px-0 py-1.5 cursor-pointer text-sm hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600"
              >
                <span>Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
