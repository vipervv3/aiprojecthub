'use client'

import GlobalSearch from '@/components/global-search'

export default function TopHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex-1 max-w-2xl">
          <GlobalSearch />
        </div>
      </div>
    </div>
  )
}

