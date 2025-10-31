'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import GlobalSearch from '@/components/global-search'
import Sidebar from './sidebar'

export default function TopHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
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
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  
  useEffect(() => {
    if (isOpen && pathname) {
      onClose()
    }
  }, [pathname, isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar />
      </div>
    </>
  )
}

