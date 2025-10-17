import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Project {
  id: string;
  name: string;
  description?: string;
  data: any[];
  dataInfo: {
    rows: number;
    columns: string[];
    fileName: string;
    fileSize?: number;
  };
  charts: Array<{
    id: string;
    chartType: string;
    config: any;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  lastSaved: number | null;
}

interface ProjectActions {
  createProject: (name: string, description?: string, data?: any[], dataInfo?: any) => string;
  loadProject: (id: string) => boolean;
  saveProject: (id?: string) => boolean;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string, newName: string) => string;
  addChartToProject: (projectId: string, chartType: string, config: any) => void;
  removeChartFromProject: (projectId: string, chartId: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  exportProject: (id: string) => string;
  importProject: (projectData: string) => boolean;
  clearProjects: () => void;
  searchProjects: (query: string) => Project[];
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    (set, get) => ({
      // State
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
      lastSaved: null,

      // Actions
      createProject: (name, description, data = [], dataInfo = null) => {
        const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProject: Project = {
          id,
          name,
          description,
          data,
          dataInfo: dataInfo || {
            rows: data.length,
            columns: data.length > 0 ? Object.keys(data[0]) : [],
            fileName: 'Untitled'
          },
          charts: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: []
        };

        set({
          projects: [...get().projects, newProject],
          currentProject: newProject,
          lastSaved: Date.now()
        });

        return id;
      },

      loadProject: (id) => {
        const { projects } = get();
        const project = projects.find(p => p.id === id);
        
        if (project) {
          set({ currentProject: project });
          return true;
        }
        
        set({ error: 'Project not found' });
        return false;
      },

      saveProject: (id) => {
        const { currentProject, projects } = get();
        const projectId = id || currentProject?.id;
        
        if (!projectId || !currentProject) {
          set({ error: 'No project to save' });
          return false;
        }

        const updatedProject = {
          ...currentProject,
          updatedAt: Date.now()
        };

        const updatedProjects = projects.map(p => 
          p.id === projectId ? updatedProject : p
        );

        set({
          projects: updatedProjects,
          currentProject: updatedProject,
          lastSaved: Date.now()
        });

        return true;
      },

      updateProject: (id, updates) => {
        const { projects, currentProject } = get();
        
        const updatedProjects = projects.map(p => 
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        );

        const updatedCurrentProject = currentProject?.id === id 
          ? { ...currentProject, ...updates, updatedAt: Date.now() }
          : currentProject;

        set({
          projects: updatedProjects,
          currentProject: updatedCurrentProject
        });
      },

      deleteProject: (id) => {
        const { projects, currentProject } = get();
        
        set({
          projects: projects.filter(p => p.id !== id),
          currentProject: currentProject?.id === id ? null : currentProject
        });
      },

      duplicateProject: (id, newName) => {
        const { projects } = get();
        const originalProject = projects.find(p => p.id === id);
        
        if (!originalProject) {
          set({ error: 'Project not found' });
          return '';
        }

        const newId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const duplicatedProject: Project = {
          ...originalProject,
          id: newId,
          name: newName,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        set({
          projects: [...projects, duplicatedProject]
        });

        return newId;
      },

      addChartToProject: (projectId, chartType, config) => {
        const { projects, currentProject } = get();
        
        const newChart = {
          id: `chart_${Date.now()}`,
          chartType,
          config,
          timestamp: Date.now()
        };

        const updatedProjects = projects.map(p => 
          p.id === projectId 
            ? { ...p, charts: [...p.charts, newChart], updatedAt: Date.now() }
            : p
        );

        const updatedCurrentProject = currentProject?.id === projectId
          ? { ...currentProject, charts: [...currentProject.charts, newChart], updatedAt: Date.now() }
          : currentProject;

        set({
          projects: updatedProjects,
          currentProject: updatedCurrentProject
        });
      },

      removeChartFromProject: (projectId, chartId) => {
        const { projects, currentProject } = get();
        
        const updatedProjects = projects.map(p => 
          p.id === projectId 
            ? { ...p, charts: p.charts.filter(c => c.id !== chartId), updatedAt: Date.now() }
            : p
        );

        const updatedCurrentProject = currentProject?.id === projectId
          ? { ...currentProject, charts: currentProject.charts.filter(c => c.id !== chartId), updatedAt: Date.now() }
          : currentProject;

        set({
          projects: updatedProjects,
          currentProject: updatedCurrentProject
        });
      },

      setCurrentProject: (project) => {
        set({ currentProject: project });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      exportProject: (id) => {
        const { projects } = get();
        const project = projects.find(p => p.id === id);
        
        if (!project) {
          set({ error: 'Project not found' });
          return '';
        }

        return JSON.stringify(project, null, 2);
      },

      importProject: (projectData) => {
        try {
          const project: Project = JSON.parse(projectData);
          
          // Validate project structure
          if (!project.id || !project.name || !Array.isArray(project.data)) {
            set({ error: 'Invalid project format' });
            return false;
          }

          // Generate new ID to avoid conflicts
          const newId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const importedProject: Project = {
            ...project,
            id: newId,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          set({
            projects: [...get().projects, importedProject]
          });

          return true;
        } catch (error) {
          set({ error: 'Failed to import project' });
          return false;
        }
      },

      clearProjects: () => {
        set({
          projects: [],
          currentProject: null,
          lastSaved: null
        });
      },

      searchProjects: (query) => {
        const { projects } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return projects.filter(project => 
          project.name.toLowerCase().includes(lowercaseQuery) ||
          project.description?.toLowerCase().includes(lowercaseQuery) ||
          project.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
      }
    }),
    {
      name: 'datuum-project-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
        lastSaved: state.lastSaved
      })
    }
  )
);
