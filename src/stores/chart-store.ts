import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChartConfig {
  chartType: string;
  xAxis?: string;
  yAxis?: string;
  colorAxis?: string;
  title?: string;
  [key: string]: any;
}

interface ChartState {
  selectedChart: string;
  chartConfig: ChartConfig;
  chartHistory: Array<{
    id: string;
    chartType: string;
    config: ChartConfig;
    timestamp: number;
    dataPreview: any[];
  }>;
  recommendations: Array<{
    chart_type: string;
    score: number;
    description: string;
    suitable_for: string[];
    confidence: string;
  }>;
  isGenerating: boolean;
  error: string | null;
}

interface ChartActions {
  setSelectedChart: (chartType: string) => void;
  setChartConfig: (config: ChartConfig) => void;
  updateChartConfig: (updates: Partial<ChartConfig>) => void;
  addToHistory: (chartType: string, config: ChartConfig, dataPreview: any[]) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  setRecommendations: (recommendations: ChartState['recommendations']) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  resetChart: () => void;
}

export const useChartStore = create<ChartState & ChartActions>()(
  persist(
    (set, get) => ({
      // State
      selectedChart: 'bar',
      chartConfig: {
        chartType: 'bar',
        title: 'Chart'
      },
      chartHistory: [],
      recommendations: [],
      isGenerating: false,
      error: null,

      // Actions
      setSelectedChart: (chartType) => {
        set({ 
          selectedChart: chartType,
          chartConfig: {
            ...get().chartConfig,
            chartType
          }
        });
      },

      setChartConfig: (config) => {
        set({ chartConfig: config });
      },

      updateChartConfig: (updates) => {
        set({
          chartConfig: {
            ...get().chartConfig,
            ...updates
          }
        });
      },

      addToHistory: (chartType, config, dataPreview) => {
        const { chartHistory } = get();
        const newEntry = {
          id: Date.now().toString(),
          chartType,
          config,
          timestamp: Date.now(),
          dataPreview: dataPreview.slice(0, 5) // Store only preview
        };
        
        set({
          chartHistory: [newEntry, ...chartHistory].slice(0, 20) // Keep only last 20
        });
      },

      clearHistory: () => {
        set({ chartHistory: [] });
      },

      removeFromHistory: (id) => {
        const { chartHistory } = get();
        set({
          chartHistory: chartHistory.filter(entry => entry.id !== id)
        });
      },

      setRecommendations: (recommendations) => {
        set({ recommendations });
      },

      setGenerating: (generating) => {
        set({ isGenerating: generating });
      },

      setError: (error) => {
        set({ error });
      },

      resetChart: () => {
        set({
          selectedChart: 'bar',
          chartConfig: {
            chartType: 'bar',
            title: 'Chart'
          },
          error: null
        });
      }
    }),
    {
      name: 'datuum-chart-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedChart: state.selectedChart,
        chartConfig: state.chartConfig,
        chartHistory: state.chartHistory,
        recommendations: state.recommendations
      })
    }
  )
);
