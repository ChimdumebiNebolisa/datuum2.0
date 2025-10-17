'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface MobilePanelProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function MobilePanel({ title, children, defaultOpen = false, className = '' }: MobilePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors lg:hidden"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
