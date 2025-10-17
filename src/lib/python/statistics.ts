// JavaScript wrapper for Python statistics module
import { usePythonExecution } from '../pyodide-bridge';

export interface DescriptiveStatistics {
  success: boolean;
  error?: string;
  statistics?: Record<string, {
    count: number;
    mean: number;
    median: number;
    mode?: number;
    std: number;
    variance: number;
    min: number;
    max: number;
    range: number;
    q25: number;
    q50: number;
    q75: number;
    iqr: number;
    skewness: number;
    kurtosis: number;
    coefficient_of_variation?: number;
  }>;
  columns_analyzed?: string[];
}

export interface CorrelationAnalysis {
  success: boolean;
  error?: string;
  method?: string;
  correlation_matrix?: Record<string, Record<string, number>>;
  correlations?: Array<{
    column1: string;
    column2: string;
    correlation: number;
    p_value?: number;
    significant?: boolean;
    strength: string;
  }>;
  columns_analyzed?: string[];
}

export interface RegressionAnalysis {
  success: boolean;
  error?: string;
  model_type?: string;
  r_squared?: number;
  adjusted_r_squared?: number;
  mse?: number;
  rmse?: number;
  coefficients?: Record<string, number>;
  intercept?: number;
  feature_importance?: Record<string, number>;
  residuals_stats?: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  sample_size?: number;
}

export interface HypothesisTest {
  success: boolean;
  error?: string;
  test_type?: string;
  statistic?: number;
  p_value?: number;
  significant?: boolean;
  interpretation?: string;
  [key: string]: any;
}

export interface DistributionAnalysis {
  success: boolean;
  error?: string;
  type?: string;
  unique_values?: number;
  most_frequent?: any;
  frequency?: number;
  distribution?: Record<string, number>;
  bin_edges?: number[];
  frequencies?: number[];
  skewness?: number;
  kurtosis?: number;
  is_normal?: boolean;
}

export function useStatistics() {
  const { executePython, isInitialized, loading } = usePythonExecution();

  const setData = async (data: any[]): Promise<{ success: boolean; error?: string }> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
from statistics import statistics_analyzer

# Set data
df = pd.DataFrame(data)
statistics_analyzer.set_data(df)
{'success': True}
      `;

      const result = await executePython(code, { data });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set data'
      };
    }
  };

  const calculateDescriptiveStatistics = async (
    columns?: string[]
  ): Promise<DescriptiveStatistics> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from statistics import statistics_analyzer

# Calculate descriptive statistics
result = statistics_analyzer.descriptive_statistics(${columns ? JSON.stringify(columns) : 'None'})
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        statistics: (result as any).statistics,
        columns_analyzed: (result as any).columns_analyzed
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics calculation failed'
      };
    }
  };

  const calculateCorrelation = async (
    columns?: string[],
    method: string = 'pearson'
  ): Promise<CorrelationAnalysis> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from statistics import statistics_analyzer

# Calculate correlation
result = statistics_analyzer.correlation_analysis(
    ${columns ? JSON.stringify(columns) : 'None'}, 
    method='${method}'
)
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        method: (result as any).method,
        correlation_matrix: (result as any).correlation_matrix,
        correlations: (result as any).correlations,
        columns_analyzed: (result as any).columns_analyzed
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Correlation calculation failed'
      };
    }
  };

  const performRegression = async (
    xColumns: string[],
    yColumn: string,
    modelType: string = 'linear'
  ): Promise<RegressionAnalysis> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from statistics import statistics_analyzer

# Perform regression
result = statistics_analyzer.regression_analysis(
    ${JSON.stringify(xColumns)}, 
    '${yColumn}', 
    model_type='${modelType}'
)
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        model_type: (result as any).model_type,
        r_squared: (result as any).r_squared,
        adjusted_r_squared: (result as any).adjusted_r_squared,
        mse: (result as any).mse,
        rmse: (result as any).rmse,
        coefficients: (result as any).coefficients,
        intercept: (result as any).intercept,
        feature_importance: (result as any).feature_importance,
        residuals_stats: (result as any).residuals_stats,
        sample_size: (result as any).sample_size
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Regression analysis failed'
      };
    }
  };

  const performHypothesisTest = async (
    testType: string,
    params: Record<string, any>
  ): Promise<HypothesisTest> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from statistics import statistics_analyzer

# Perform hypothesis test
result = statistics_analyzer.hypothesis_testing('${testType}', **${JSON.stringify(params)})
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        ...(result as any)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hypothesis test failed'
      };
    }
  };

  const analyzeDistribution = async (
    column: string
  ): Promise<DistributionAnalysis> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from statistics import statistics_analyzer

# Analyze distribution
result = statistics_analyzer.distribution_analysis('${column}')
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        type: (result as any).type,
        unique_values: (result as any).unique_values,
        most_frequent: (result as any).most_frequent,
        frequency: (result as any).frequency,
        distribution: (result as any).distribution,
        bin_edges: (result as any).bin_edges,
        frequencies: (result as any).frequencies,
        skewness: (result as any).skewness,
        kurtosis: (result as any).kurtosis,
        is_normal: (result as any).is_normal
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Distribution analysis failed'
      };
    }
  };

  return {
    setData,
    calculateDescriptiveStatistics,
    calculateCorrelation,
    performRegression,
    performHypothesisTest,
    analyzeDistribution,
    loading,
    isInitialized
  };
}

// Utility functions for statistics
export const formatNumber = (num: number, decimals: number = 2): string => {
  if (isNaN(num) || !isFinite(num)) return 'N/A';
  return num.toFixed(decimals);
};

export const formatPercentage = (num: number, decimals: number = 1): string => {
  if (isNaN(num) || !isFinite(num)) return 'N/A';
  return `${(num * 100).toFixed(decimals)}%`;
};

export const interpretCorrelation = (correlation: number): string => {
  const absCorr = Math.abs(correlation);
  if (absCorr >= 0.9) return 'Very strong';
  if (absCorr >= 0.7) return 'Strong';
  if (absCorr >= 0.5) return 'Moderate';
  if (absCorr >= 0.3) return 'Weak';
  return 'Very weak';
};

export const interpretPValue = (pValue: number): string => {
  if (pValue < 0.001) return 'Highly significant (p < 0.001)';
  if (pValue < 0.01) return 'Very significant (p < 0.01)';
  if (pValue < 0.05) return 'Significant (p < 0.05)';
  if (pValue < 0.1) return 'Marginally significant (p < 0.1)';
  return 'Not significant (p >= 0.1)';
};

export const calculateOutliers = (data: number[], method: 'iqr' | 'zscore' = 'iqr'): {
  outliers: number[];
  indices: number[];
  count: number;
} => {
  if (method === 'iqr') {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers: number[] = [];
    const indices: number[] = [];
    
    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });
    
    return { outliers, indices, count: outliers.length };
  } else {
    // Z-score method
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
    
    const outliers: number[] = [];
    const indices: number[] = [];
    
    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / std);
      if (zScore > 3) {
        outliers.push(value);
        indices.push(index);
      }
    });
    
    return { outliers, indices, count: outliers.length };
  }
};