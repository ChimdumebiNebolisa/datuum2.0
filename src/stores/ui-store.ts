import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  activeTab: string;
  panelSizes: {
    left: number;
    right: number;
  };
  viewMode: 'single' | 'split' | 'grid';
  showGrid: boolean;
  showAxis: boolean;
  showLegend: boolean;
  animations: boolean;
  compactMode: boolean;
  preferences: {
    autoSave: boolean;
    showTips: boolean;
    defaultChartType: string;
    colorScheme: string;
  };
}

interface UIActions {
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setPanelSizes: (sizes: Partial<UIState['panelSizes']>) => void;
  setViewMode: (mode: UIState['viewMode']) => void;
  setShowGrid: (show: boolean) => void;
  setShowAxis: (show: boolean) => void;
  setShowLegend: (show: boolean) => void;
  setAnimations: (enabled: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  updatePreferences: (prefs: Partial<UIState['preferences']>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UIState['preferences'] = {
  autoSave: true,
  showTips: true,
  defaultChartType: 'bar',
  colorScheme: 'default'
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      // State
      theme: 'system',
      sidebarOpen: true,
      activeTab: 'upload',
      panelSizes: {
        left: 300,
        right: 400
      },
      viewMode: 'single',
      showGrid: true,
      showAxis: true,
      showLegend: true,
      animations: true,
      compactMode: false,
      preferences: defaultPreferences,

      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          if (systemTheme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      setPanelSizes: (sizes) => {
        set({
          panelSizes: {
            ...get().panelSizes,
            ...sizes
          }
        });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      setShowGrid: (show) => {
        set({ showGrid: show });
      },

      setShowAxis: (show) => {
        set({ showAxis: show });
      },

      setShowLegend: (show) => {
        set({ showLegend: show });
      },

      setAnimations: (enabled) => {
        set({ animations: enabled });
      },

      setCompactMode: (compact) => {
        set({ compactMode: compact });
      },

      updatePreferences: (prefs) => {
        set({
          preferences: {
            ...get().preferences,
            ...prefs
          }
        });
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences });
      }
    }),
    {
      name: 'datuum-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        activeTab: state.activeTab,
        panelSizes: state.panelSizes,
        viewMode: state.viewMode,
        showGrid: state.showGrid,
        showAxis: state.showAxis,
        showLegend: state.showLegend,
        animations: state.animations,
        compactMode: state.compactMode,
        preferences: state.preferences
      })
    }
  )
);
