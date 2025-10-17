// React hooks and utilities for Python execution via Pyodide
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from './logger';
import { DataRow, PythonExecutionResult } from '@/types/analytics';


interface PythonWorkerMessage {
  type: string;
  payload: unknown;
  id?: string;
}

interface PythonWorker {
  postMessage: (message: PythonWorkerMessage) => void;
  addEventListener: (event: string, handler: (event: MessageEvent) => void) => void;
  terminate: () => void;
}

// Custom hook for Python execution
export function usePythonExecution() {
  const [worker, setWorker] = useState<PythonWorker | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const pendingRequests = useRef(new Map<string, { resolve: Function; reject: Function }>());

  // Initialize worker
  useEffect(() => {
    const initializeWorker = async () => {
      try {
        // Create Web Worker
        const workerInstance = new Worker(
          new URL('./pyodide-worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Handle worker messages
        workerInstance.addEventListener('message', (event) => {
          const { type, payload, id } = event.data;
          const pending = pendingRequests.current.get(id);

          if (pending) {
            pendingRequests.current.delete(id);

            if (type === 'SUCCESS') {
              pending.resolve(payload);
            } else if (type === 'ERROR') {
              pending.reject(new Error(payload.message));
            }
          }
        });

        // Initialize Pyodide
        await sendMessage(workerInstance, 'INITIALIZE', {});
        setWorker(workerInstance);
        setIsInitialized(true);
      } catch (error) {
        logger.error('Python worker initialization error:', error as Error, 'Python worker initialization');
      }
    };

    initializeWorker();

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  // Send message to worker
  const sendMessage = useCallback(async <T>(
    workerInstance: PythonWorker,
    type: string,
    payload: unknown
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      pendingRequests.current.set(id, { resolve, reject });

      workerInstance.postMessage({
        type,
        payload,
        id
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Python execution timeout'));
        }
      }, 30000);
    });
  }, []);

  // Execute Python code
  const executePython = useCallback(async <T>(
    code: string,
    context: Record<string, any> = {}
  ): Promise<T> => {
    if (!worker || !isInitialized) {
      throw new Error('Python worker not initialized');
    }

    setLoading(true);
    try {
      const result = await sendMessage<T>(worker, 'EXECUTE', { code, context });
      return result;
    } finally {
      setLoading(false);
    }
  }, [worker, isInitialized, sendMessage]);

  // Load Python module
  const loadModule = useCallback(async (moduleName: string) => {
    if (!worker || !isInitialized) {
      throw new Error('Python worker not initialized');
    }

    setLoading(true);
    try {
      const result = await sendMessage(worker, 'LOAD_MODULE', { moduleName });
      return result;
    } finally {
      setLoading(false);
    }
  }, [worker, isInitialized, sendMessage]);

  return {
    executePython,
    loadModule,
    isInitialized,
    loading
  };
}

// Hook for data processing
export function useDataProcessing() {
  const { executePython, isInitialized, loading } = usePythonExecution();

  const processData = useCallback(async (data: DataRow[], operations: string[]) => {
    if (!isInitialized) return { error: 'Python not initialized' };

    try {
      const code = `
import pandas as pd
import numpy as np

# Convert data to DataFrame
df = pd.DataFrame(data)

# Apply operations
${operations.join('\n')}

# Return processed data
result = df.to_dict('records')
result
      `;

      const result = await executePython(code, { data });
      return { data: result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Processing failed' };
    }
  }, [executePython, isInitialized]);

  const calculateStatistics = useCallback(async (data: DataRow[], column?: string) => {
    if (!isInitialized) return { error: 'Python not initialized' };

    try {
      const code = `
import pandas as pd
import numpy as np

df = pd.DataFrame(data)

if column and column in df.columns:
    series = df[column]
    stats = {
        'count': len(series),
        'mean': float(series.mean()),
        'median': float(series.median()),
        'std': float(series.std()),
        'min': float(series.min()),
        'max': float(series.max()),
        'q25': float(series.quantile(0.25)),
        'q75': float(series.quantile(0.75))
    }
else:
    stats = df.describe().to_dict()

stats
      `;

      const result = await executePython(code, { data, column });
      return { data: result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Statistics calculation failed' };
    }
  }, [executePython, isInitialized]);

  return {
    processData,
    calculateStatistics,
    loading,
    isInitialized
  };
}

// Hook for chart recommendations
export function useChartRecommendations() {
  const { executePython, isInitialized } = usePythonExecution();

  const recommendChart = useCallback(async (data: DataRow[], columns: string[]) => {
    if (!isInitialized) return { error: 'Python not initialized' };

    try {
      const code = `
import pandas as pd
import numpy as np

df = pd.DataFrame(data)
selected_columns = columns

# Analyze data types and patterns
recommendations = []

for col in selected_columns:
    if col in df.columns:
        series = df[col]
        
        # Determine data type
        if pd.api.types.is_numeric_dtype(series):
            # Numeric data
            if series.nunique() <= 10:
                recommendations.append({
                    'column': col,
                    'type': 'numeric_categorical',
                    'chart_types': ['bar', 'pie', 'donut']
                })
            else:
                recommendations.append({
                    'column': col,
                    'type': 'numeric_continuous',
                    'chart_types': ['histogram', 'box', 'scatter']
                })
        elif pd.api.types.is_datetime64_any_dtype(series):
            recommendations.append({
                'column': col,
                'type': 'datetime',
                'chart_types': ['line', 'area', 'scatter']
            })
        else:
            # Categorical data
            recommendations.append({
                'column': col,
                'type': 'categorical',
                'chart_types': ['bar', 'pie', 'donut']
            })

recommendations
      `;

      const result = await executePython(code, { data, columns });
      return { data: result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Chart recommendation failed' };
    }
  }, [executePython, isInitialized]);

  return {
    recommendChart,
    isInitialized
  };
}