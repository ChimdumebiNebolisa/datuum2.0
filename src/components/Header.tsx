'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, Settings, Moon, Sun, FolderOpen, Menu, Home } from 'lucide-react'
import { ProjectSidebar } from './ProjectSidebar'
import { Project } from '@/lib/storage'

interface HeaderProps {
  onLoadProject?: (project: Project) => void
  onNewProject?: () => void
  onExport?: () => void
  onHomeClick?: () => void
}

export function Header({ onLoadProject, onNewProject, onExport, onHomeClick }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showProjectSidebar, setShowProjectSidebar] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch for dark mode
  useEffect(() => {
    setMounted(true)
    // Check if dark mode is enabled on the client
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // Toggle dark mode class on document
    document.documentElement.classList.toggle('dark')
  }

  const handleLoadProject = (project: Project) => {
    onLoadProject?.(project)
  }

  const handleNewProject = () => {
    onNewProject?.()
  }

  return (
    <>
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onHomeClick}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Go to Home"
              >
                <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="p-2 bg-primary-500 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Datuum 2.0
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Frontend-Only Data Visualization
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProjectSidebar(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="My Projects"
              >
                <FolderOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>

              {mounted && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              )}

              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>

              <button 
                onClick={onExport}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Project Sidebar */}
      <ProjectSidebar
        isOpen={showProjectSidebar}
        onClose={() => setShowProjectSidebar(false)}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
      />
    </>
  )
}
