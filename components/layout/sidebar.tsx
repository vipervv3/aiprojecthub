'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  Brain, 
  FileText, 
  Calendar,
  Users,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
  X
} from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'

export default function Sidebar({ onMobileClose, isMobile = false }: { onMobileClose?: () => void; isMobile?: boolean }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Note: Menu closing on route change is handled by MobileSidebarOverlay in top-header.tsx
  // This prevents duplicate close logic that could cause issues

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: pathname === '/dashboard' },
    { name: 'My Projects', href: '/projects', icon: FolderOpen, current: pathname === '/projects' },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare, current: pathname === '/tasks' },
    { name: 'AI Insights', href: '/ai-insights', icon: Brain, badge: 'AI', current: pathname === '/ai-insights' },
    { name: 'Alerts', href: '/alerts', icon: Bell, current: pathname === '/alerts' },
    { name: 'Reports', href: '/reports', icon: FileText, badge: 'New', badgeColor: 'black', current: pathname === '/reports' },
    { name: 'Recordings', href: '/meetings', icon: Calendar, current: pathname === '/meetings' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, current: pathname === '/calendar' },
    { name: 'Team', href: '/team', icon: Users, current: pathname === '/team' },
    { name: 'Settings', href: '/settings', icon: Settings, current: pathname === '/settings' },
  ]

  const handleSignOut = async () => {
    console.log('Logout button clicked')
    
    // Clear any local storage first
    localStorage.removeItem('demo-user')
    localStorage.clear()
    sessionStorage.clear()
    
    try {
      console.log('Attempting to sign out...')
      if (signOut) {
        await signOut()
        console.log('Sign out successful')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
    
    // Add a small delay to ensure the loggingOut state is visible
    setTimeout(() => {
      console.log('Redirecting to login page')
      // Use window.location for a hard redirect
      window.location.href = '/auth/login'
    }, 500) // 500ms delay to show the "Signing out..." message
  }

  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI ProjectHub</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Intelligent Management</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={() => onMobileClose?.()}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              item.current
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <item.icon className={`mr-3 h-5 w-5 ${
              item.current ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
            }`} />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                item.current 
                  ? 'bg-white/20 text-white' 
                  : item.badgeColor === 'pink' 
                    ? 'bg-pink-500 text-white' 
                    : item.badgeColor === 'black'
                      ? 'bg-black text-white'
                      : item.badgeColor === 'gray'
                        ? 'bg-gray-500 text-white'
                        : 'bg-blue-600 text-white'
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.user_metadata?.name || user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <ThemeToggle />
          {!collapsed && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Theme</span>
          )}
        </div>
        
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    // Mobile sidebar - always visible when rendered
    return sidebarContent
  }

  // Desktop sidebar - only visible on lg+ screens
  return (
    <div className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-lg">
      {sidebarContent}
    </div>
  )
}
