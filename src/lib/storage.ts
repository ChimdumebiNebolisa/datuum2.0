/**
 * IndexedDB Storage Layer for Datuum 2.0
 * 
 * Provides persistent local storage for user projects, configurations,
 * and data using IndexedDB API.
 */

export interface Project {
  id: string
  name: string
  description?: string
  data?: any
  chartConfig?: any
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface UserProfile {
  id: string
  name: string
  preferences: {
    theme: 'light' | 'dark'
    defaultChartType: string
    autoSave: boolean
    exportFormat: 'png' | 'pdf' | 'svg'
  }
  projects: string[] // Project IDs
  createdAt: Date
  lastActive: Date
}

export interface StorageStats {
  projectCount: number
  totalSize: number
  lastBackup?: Date
}

class DatuumStorage {
  private dbName = 'DatuumDB'
  private version = 1
  private db: IDBDatabase | null = null

  async initialize(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' })
          projectStore.createIndex('name', 'name', { unique: false })
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // User profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          const profileStore = db.createObjectStore('profiles', { keyPath: 'id' })
          profileStore.createIndex('name', 'name', { unique: false })
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not available in this environment')
    }

    if (!this.db) {
      await this.initialize()
    }
    if (!this.db) {
      throw new Error('Failed to initialize database')
    }
    return this.db
  }

  // Project management
  async saveProject(project: Project): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['projects'], 'readwrite')
    const store = transaction.objectStore('projects')
    
    project.updatedAt = new Date()
    project.version = (project.version || 0) + 1
    
    return new Promise((resolve, reject) => {
      const request = store.put(project)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getProject(id: string): Promise<Project | null> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['projects'], 'readonly')
    const store = transaction.objectStore('projects')
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllProjects(): Promise<Project[]> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['projects'], 'readonly')
    const store = transaction.objectStore('projects')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const projects = request.result || []
        // Sort by updatedAt descending
        projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        resolve(projects)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['projects'], 'readwrite')
    const store = transaction.objectStore('projects')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // User profile management
  async saveProfile(profile: UserProfile): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['profiles'], 'readwrite')
    const store = transaction.objectStore('profiles')
    
    profile.lastActive = new Date()
    
    return new Promise((resolve, reject) => {
      const request = store.put(profile)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getProfile(id: string): Promise<UserProfile | null> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['profiles'], 'readonly')
    const store = transaction.objectStore('profiles')
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getCurrentProfile(): Promise<UserProfile | null> {
    const currentProfileId = await this.getSetting('currentProfileId')
    if (!currentProfileId) return null
    
    return this.getProfile(currentProfileId)
  }

  async setCurrentProfile(profileId: string): Promise<void> {
    await this.setSetting('currentProfileId', profileId)
  }

  // Settings management
  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['settings'], 'readwrite')
    const store = transaction.objectStore('settings')
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: new Date() })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSetting(key: string): Promise<any> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['settings'], 'readonly')
    const store = transaction.objectStore('settings')
    
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Storage statistics
  async getStorageStats(): Promise<StorageStats> {
    const projects = await this.getAllProjects()
    const totalSize = JSON.stringify(projects).length
    
    return {
      projectCount: projects.length,
      totalSize,
      lastBackup: await this.getSetting('lastBackup')
    }
  }

  // Data export/import
  async exportData(): Promise<Blob> {
    const projects = await this.getAllProjects()
    const profiles = await this.getAllProfiles()
    const settings = await this.getAllSettings()
    
    const exportData = {
      version: this.version,
      timestamp: new Date().toISOString(),
      projects,
      profiles,
      settings
    }
    
    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
  }

  async importData(blob: Blob): Promise<void> {
    const text = await blob.text()
    const data = JSON.parse(text)
    
    if (data.version !== this.version) {
      throw new Error(`Unsupported data version: ${data.version}`)
    }
    
    // Import projects
    for (const project of data.projects || []) {
      await this.saveProject(project)
    }
    
    // Import profiles
    for (const profile of data.profiles || []) {
      await this.saveProfile(profile)
    }
    
    // Import settings
    for (const setting of data.settings || []) {
      await this.setSetting(setting.key, setting.value)
    }
  }

  // Helper methods
  private async getAllProfiles(): Promise<UserProfile[]> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['profiles'], 'readonly')
    const store = transaction.objectStore('profiles')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  private async getAllSettings(): Promise<Array<{ key: string; value: any }>> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['settings'], 'readonly')
    const store = transaction.objectStore('settings')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Cleanup
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['projects', 'profiles', 'settings'], 'readwrite')
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('projects').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('profiles').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('settings').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    ])
  }
}

// Create singleton instance
export const storage = new DatuumStorage()

// Initialize storage on module load
storage.initialize().catch(console.error)

// Utility functions
/**
 * Generate unique ID - SSR safe version
 * ⚠️ WARNING: This function uses Math.random() and Date.now() and should NOT be used during component render
 * as it will cause React hydration mismatches in Next.js SSR. Use React's useId() hook instead.
 * 
 * @deprecated Use React's useId() hook for SSR-safe ID generation
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function createDefaultProfile(name: string = 'Guest User'): UserProfile {
  return {
    id: generateId(),
    name,
    preferences: {
      theme: 'light',
      defaultChartType: 'line',
      autoSave: true,
      exportFormat: 'png'
    },
    projects: [],
    createdAt: new Date(),
    lastActive: new Date()
  }
}

export function createProject(name: string, data?: any): Project {
  return {
    id: generateId(),
    name,
    data,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }
}
