'use client'

import { useState, useEffect } from 'react'
import { Save, FolderOpen, Trash2, Edit3, Eye, Calendar, BarChart3 } from 'lucide-react'
import { storage, Project, createProject } from '@/lib/storage'
import { formatDate } from '@/lib/utils'

interface ProjectManagerProps {
  currentData?: any
  currentConfig?: any
  onLoadProject?: (project: Project) => void
}

export function ProjectManager({ currentData, currentConfig, onLoadProject }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const allProjects = await storage.getAllProjects()
      setProjects(allProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
      // Set empty array for SSR or when storage fails
      setProjects([])
    }
  }

  const handleSaveProject = async () => {
    if (!projectName.trim() || !currentData) return

    setIsSaving(true)
    try {
      const project = createProject(projectName.trim())
      project.description = projectDescription.trim()
      project.data = currentData
      project.chartConfig = currentConfig

      await storage.saveProject(project)
      await loadProjects()
      
      setShowSaveModal(false)
      setProjectName('')
      setProjectDescription('')
    } catch (error) {
      console.error('Failed to save project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadProject = async (project: Project) => {
    try {
      onLoadProject?.(project)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await storage.deleteProject(projectId)
      await loadProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleUpdateProject = async (project: Project) => {
    if (!projectName.trim()) return

    setIsSaving(true)
    try {
      const updatedProject = {
        ...project,
        name: projectName.trim(),
        description: projectDescription.trim(),
        data: currentData,
        chartConfig: currentConfig
      }

      await storage.saveProject(updatedProject)
      await loadProjects()
      
      setEditingProject(null)
      setProjectName('')
      setProjectDescription('')
    } catch (error) {
      console.error('Failed to update project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (project: Project) => {
    setEditingProject(project)
    setProjectName(project.name)
    setProjectDescription(project.description || '')
    setShowSaveModal(true)
  }

  const cancelEdit = () => {
    setEditingProject(null)
    setShowSaveModal(false)
    setProjectName('')
    setProjectDescription('')
  }

  return (
    <>
      {/* Save Button */}
      <button
        onClick={() => setShowSaveModal(true)}
        disabled={!currentData}
        className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Save className="h-4 w-4" />
        <span>Save Project</span>
      </button>

      {/* Save/Edit Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingProject ? 'Update Project' : 'Save Project'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingProject ? () => handleUpdateProject(editingProject) : handleSaveProject}
                disabled={!projectName.trim() || isSaving}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : editingProject ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          My Projects ({projects.length})
        </h3>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No projects saved yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Save your first project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEdit(project)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit project"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                  <span>v{project.version}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {project.data?.metadata?.rowCount || 0} rows, {project.data?.metadata?.columnCount || 0} cols
                  </div>
                  <button
                    onClick={() => handleLoadProject(project)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Load</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
