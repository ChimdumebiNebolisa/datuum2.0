import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DataState {
  currentData: any[];
  dataInfo: {
    rows: number;
    columns: string[];
    fileName: string;
    fileSize?: number;
  } | null;
  selectedColumns: string[];
  isLoading: boolean;
  error: string | null;
}

interface DataActions {
  setData: (data: any[], info: DataState['dataInfo']) => void;
  setSelectedColumns: (columns: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
  addData: (newData: any[]) => void;
  updateData: (index: number, newRow: any) => void;
  deleteRow: (index: number) => void;
}

export const useDataStore = create<DataState & DataActions>()(
  persist(
    (set, get) => ({
      // State
      currentData: [],
      dataInfo: null,
      selectedColumns: [],
      isLoading: false,
      error: null,

      // Actions
      setData: (data, info) => {
        set({
          currentData: data,
          dataInfo: info,
          selectedColumns: info?.columns || [],
          error: null
        });
      },

      setSelectedColumns: (columns) => {
        set({ selectedColumns: columns });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearData: () => {
        set({
          currentData: [],
          dataInfo: null,
          selectedColumns: [],
          error: null
        });
      },

      addData: (newData) => {
        const { currentData } = get();
        set({ currentData: [...currentData, ...newData] });
      },

      updateData: (index, newRow) => {
        const { currentData } = get();
        const updatedData = [...currentData];
        updatedData[index] = newRow;
        set({ currentData: updatedData });
      },

      deleteRow: (index) => {
        const { currentData } = get();
        const updatedData = currentData.filter((_, i) => i !== index);
        set({ currentData: updatedData });
      }
    }),
    {
      name: 'datuum-data-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentData: state.currentData,
        dataInfo: state.dataInfo,
        selectedColumns: state.selectedColumns
      })
    }
  )
);
