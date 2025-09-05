"use client"

import { useState } from "react"
import { Search, Plus, ChevronDown, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

// Mock data for boards
const mockBoards = [
  { id: 1, name: "Try Boards", isArchived: false },
  { id: 2, name: "Project one", isArchived: false },
  { id: 3, name: "Marketing Campaign", isArchived: false },
  { id: 4, name: "Product Development", isArchived: false },
  { id: 5, name: "Team Planning", isArchived: true },
  { id: 6, name: "Q4 Goals", isArchived: false },
  { id: 7, name: "Research & Analysis", isArchived: false },
  { id: 8, name: "Client Onboarding", isArchived: false },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchivedOnly, setShowArchivedOnly] = useState(false)

  // Filter boards based on search and archive status
  const filteredBoards = mockBoards.filter(board => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchiveFilter = showArchivedOnly ? board.isArchived : !board.isArchived
    return matchesSearch && matchesArchiveFilter
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleToggleArchived = (checked: boolean) => {
    setShowArchivedOnly(checked)
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Title */}
        <div className="text-left mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Boards</h1>
        </div>

        {/* Search and Filters */}
        <div>
          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search projects"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 h-10 sm:h-12 text-base sm:text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              aria-label="Search projects"
            />
          </div>

          {/* Filters and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Switch
                id="archived-only"
                checked={showArchivedOnly}
                onCheckedChange={handleToggleArchived}
                aria-label="Show archived projects only"
              />
              <Label htmlFor="archived-only" className="text-sm font-medium text-gray-700">
                Archived projects only
              </Label>
            </div>

            <Button variant="primary" className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Add</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Boards Section */}
        <div>
          {/* Section Header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {filteredBoards.length} {filteredBoards.length === 1 ? 'project' : 'projects'}
            </h2>
          </div>

          {/* Boards Display Area - Scrollable */}
          <div
            className="max-h-[50vh] sm:max-h-[60vh]"
            role="region"
            aria-label="Projects list"
            aria-live="polite">
            {filteredBoards.length > 0 ? (
              <div className="space-y-2 sm:space-y-3" role="list">
                {filteredBoards.map((board) => (
                  <BoardItem key={board.id} board={board} />
                ))}
              </div>
            ) : (
              <EmptyState
                isArchivedFilter={showArchivedOnly}
                hasSearchQuery={!!searchQuery.trim()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Board Item Component
interface BoardItemProps {
  board: {
    id: number
    name: string
    isArchived: boolean
  }
}

const BoardItem = ({ board }: BoardItemProps) => {
  return (
    <div
      className="flex items-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
      role="listitem"
      tabIndex={0}
      aria-label={`Open board: ${board.name}${board.isArchived ? ' (archived)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Handle board click
          console.log('Opening board:', board.name)
        }
      }}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" aria-hidden="true"></div>
        <span className="text-base sm:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          #{board.name}
        </span>
        {board.isArchived && (
          <Archive className="w-4 h-4 text-gray-400 flex-shrink-0" aria-label="Archived project" />
        )}
      </div>
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  isArchivedFilter: boolean
  hasSearchQuery: boolean
}

const EmptyState = ({ isArchivedFilter, hasSearchQuery }: EmptyStateProps) => {
  const getEmptyMessage = () => {
    if (hasSearchQuery) {
      return {
        title: "No projects found",
        description: "Try adjusting your search terms or create a new project."
      }
    }
    if (isArchivedFilter) {
      return {
        title: "No archived projects",
        description: "You don't have any archived projects yet."
      }
    }
    return {
      title: "No projects yet",
      description: "Get started by creating your first project."
    }
  }

  const { title, description } = getEmptyMessage()

  return (
    <div className="text-center py-12 sm:py-16">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto px-4">{description}</p>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
        <Plus className="w-4 h-4 mr-2" />
        Create your first project
      </Button>
    </div>
  )
}
