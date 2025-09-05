"use client"

import { useState } from "react"
import { User, Settings, LogOut, HelpCircle, Bell, ExternalLink, Users, ChevronRight, Palette } from "lucide-react"
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

/**
 * NavbarHeader - A reusable navbar component for the Mello app
 * 
 * Features:
 * - Displays "Mello" branding on the left
 * - Profile avatar with dropdown menu on the right
 * - Notifications button with badge
 * - Fully responsive design
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Customizable user data and event handlers
 * 
 * @example
 * ```tsx
 * <NavbarHeader
 *   user={{
 *     name: "John Doe",
 *     email: "john@example.com",
 *     avatar: "/path/to/avatar.jpg"
 *   }}
 *   onProfileClick={() => navigate('/profile')}
 *   onSettingsClick={() => navigate('/settings')}
 *   onLogoutClick={() => logout()}
 * />
 * ```
 */

interface NavbarHeaderProps {
  className?: string
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onLogoutClick?: () => void
  onHelpClick?: () => void
  onNotificationsClick?: () => void
  onSwitchAccountsClick?: () => void
  onManageAccountClick?: () => void
  onActivityClick?: () => void
  onCardsClick?: () => void
  onThemeClick?: () => void
  onCreateWorkspaceClick?: () => void
  onShortcutsClick?: () => void
}

export function NavbarHeader({
  className,
  user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: undefined,
  },
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  onHelpClick,
  onNotificationsClick,
  onSwitchAccountsClick,
  onManageAccountClick,
  onActivityClick,
  onCardsClick,
  onThemeClick,
  onCreateWorkspaceClick,
  onShortcutsClick,
}: NavbarHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleProfileClick = () => {
    onProfileClick?.()
    setIsDropdownOpen(false)
  }

  const handleSettingsClick = () => {
    onSettingsClick?.()
    setIsDropdownOpen(false)
  }

  const handleLogoutClick = () => {
    onLogoutClick?.()
    setIsDropdownOpen(false)
  }

  const handleHelpClick = () => {
    onHelpClick?.()
    setIsDropdownOpen(false)
  }

  const handleNotificationsClick = () => {
    onNotificationsClick?.()
    setIsDropdownOpen(false)
  }

  const handleSwitchAccountsClick = () => {
    onSwitchAccountsClick?.()
    setIsDropdownOpen(false)
  }

  const handleManageAccountClick = () => {
    onManageAccountClick?.()
    setIsDropdownOpen(false)
  }

  const handleActivityClick = () => {
    onActivityClick?.()
    setIsDropdownOpen(false)
  }

  const handleCardsClick = () => {
    onCardsClick?.()
    setIsDropdownOpen(false)
  }

  const handleThemeClick = () => {
    onThemeClick?.()
    setIsDropdownOpen(false)
  }

  const handleCreateWorkspaceClick = () => {
    onCreateWorkspaceClick?.()
    setIsDropdownOpen(false)
  }

  const handleShortcutsClick = () => {
    onShortcutsClick?.()
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Mello
        </h1>
      </div>

      <div className="flex items-center gap-3">  
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
