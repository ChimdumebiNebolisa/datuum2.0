'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import { logger } from '@/lib/logger';
import { getNumericColumns } from '@/lib/analytics-utils';

export interface UseAnalyticsPanelOptions {
  data: any[];
  dataColumns: string[];
  autoExecute?: boolean;
  minColumnsRequired?: number;
}

export interface AnalyticsPanelState {
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

/**
 * Custom hook that provides common state management and functionality
 * for analytics panels, reducing code duplication.
 */
export function useAnalyticsPanel({
  data,
  dataColumns,
  autoExecute = false,
  minColumnsRequired = 1
}: UseAnalyticsPanelOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { executePython, isInitialized, initializationError } = usePythonExecution();

  // Get numeric columns for analysis
  const numericColumns = getNumericColumns(data, dataColumns);
  const hasValidData = numericColumns.length >= minColumnsRequired;

  /**
   * Execute Python code with common error handling and loading states
   */
  const executeWithErrorHandling = useCallback(async (
    pythonCode: string,
    onSuccess: (result: any) => void,
    errorMessage: string = 'Analysis failed'
  ) => {
    if (!isInitialized) {
      setError('Python engine not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await executePython(pythonCode);
      
      if (result && (result as any).success !== false) {
        onSuccess(result);
      } else {
        setError((result as any)?.error || errorMessage);
      }
    } catch (error) {
      setError(errorMessage);
      logger.error('Analytics panel error:', error);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, executePython]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set loading state manually
   */
  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  /**
   * Set error state manually
   */
  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  // Auto-execute if enabled and conditions are met
  useEffect(() => {
    if (autoExecute && hasValidData && isInitialized) {
      // This will be overridden by individual panels
    }
  }, [autoExecute, hasValidData, isInitialized]);

  return {
    // State
    loading,
    error: error || initializationError,
    isInitialized,
    hasValidData,
    numericColumns,
    
    // Actions
    executeWithErrorHandling,
    clearError,
    setLoadingState,
    setErrorState
  };
}

/**
 * Utility function to create standardized Python code for analytics
 */
export function createAnalyticsPythonCode(
  data: any[],
  operation: string,
  parameters: Record<string, any> = {}
): string {
  const dataJson = JSON.stringify(data);
  const paramsJson = JSON.stringify(parameters);
  
  return `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np

# Set data
df = pd.DataFrame(${dataJson})

# Execute operation: ${operation}
# Parameters: ${paramsJson}

# Your analysis code here
result = {"success": True, "message": "Analysis completed"}
result
  `;
}
