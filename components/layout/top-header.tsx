'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import GlobalSearch from '@/components/global-search'
import Sidebar from './sidebar'

export default function TopHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <div className="fixed top-0 left-0 lg:left-64 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 lg:px-6">
          {/* Hamburger Menu Button - Now in header */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <GlobalSearch />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebarOverlay isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}

function MobileSidebarOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const prevPathnameRef = React.useRef(pathname)
  
  useEffect(() => {
    // Close menu only when route actually changes (not on initial mount)
    if (isOpen && pathname && prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      onClose()
    } else {
      prevPathnameRef.current = pathname
    }
  }, [pathname, isOpen, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      {/* Sidebar */}
      <div 
        className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-2xl"
        style={{ 
          zIndex: 9999,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out'
        }}
      >
        <Sidebar onMobileClose={onClose} isMobile={true} />
      </div>
    </>
  )
}

