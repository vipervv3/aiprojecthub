'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, FolderOpen, CheckSquare, Calendar, FileText, Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { dataService } from '@/lib/data-service'
import { useAuth } from '@/app/providers'

interface SearchResult {
  id: string
  type: 'project' | 'task' | 'meeting'
  title: string
  description?: string
  href: string
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const { user } = useAuth()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Search when query changes
  useEffect(() => {
    if (!isOpen || !query.trim() || !user) {
      setResults([])
      return
    }

    const search = async () => {
      setLoading(true)
      try {
        const searchLower = query.toLowerCase()

        // Search projects
        const projects = await dataService.getProjects(user.id)
        const projectResults: SearchResult[] = projects
          .filter((p: any) => 
            p.name?.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower)
          )
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id,
            type: 'project' as const,
            title: p.name,
            description: p.description,
            href: `/projects/${p.id}`,
          }))

        // Search tasks
        const tasks = await dataService.getTasks(user.id)
        const taskResults: SearchResult[] = tasks
          .filter((t: any) =>
            t.title?.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower)
          )
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id,
            type: 'task' as const,
            title: t.title,
            description: t.description,
            href: `/tasks?task=${t.id}`,
          }))

        // Search meetings (we'll need to add a meetings service method)
        // For now, just combine results
        const allResults = [...projectResults, ...taskResults].slice(0, 10)
        setResults(allResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(search, 300)
    return () => clearTimeout(timeoutId)
  }, [query, isOpen, user])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => 
        prev < results.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleResultClick(results[selectedIndex])
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderOpen className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'project':
        return 'Project'
      case 'task':
        return 'Task'
      case 'meeting':
        return 'Meeting'
      default:
        return 'Item'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-colors text-sm text-left"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-gray-400 dark:text-gray-500">Search projects, tasks, meetings...</span>
        <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded">
          ⌘K
        </span>
      </button>
    )
  }

  return (
    <div
      ref={searchRef}
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-start justify-center pt-20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false)
          setQuery('')
          setResults([])
        }
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, meetings..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults([])
                inputRef.current?.focus()
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          {loading && <Loader className="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500" />}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query && !loading && results.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          )}

          {!query && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search...</p>
              <p className="text-sm mt-2">Search projects, tasks, and meetings</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                    index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="mt-0.5 text-gray-400 dark:text-gray-500">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {result.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            <span>⌘K to open</span>
          </div>
        </div>
      </div>
    </div>
  )
}

