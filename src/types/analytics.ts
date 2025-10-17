/**
 * TypeScript interfaces for analytics components
 */

/**
 * Base data row interface
 */
export interface DataRow {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Data information interface
 */
export interface DataInfo {
  rows: number;
  columns: string[];
  fileSize: number;
  fileName: string;
}

/**
 * Statistics result interface
 */
export interface StatisticsResult {
  column: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q2: number;
  q3: number;
  q25: number;
  q50: number;
  q75: number;
  iqr: number;
  skewness?: number;
  kurtosis?: number;
}

/**
 * Distribution analysis result
 */
export interface DistributionResult {
  type: 'numeric' | 'categorical';
  distribution?: Record<string, number>;
  bins?: number[];
  frequencies?: number[];
}

/**
 * Clustering result interface
 */
export interface ClusteringResult {
  method: string;
  parameters: Record<string, any>;
  n_clusters: number;
  silhouette_score?: number;
  inertia?: number;
  labels: number[];
}

/**
 * Correlation result interface
 */
export interface CorrelationResult {
  correlation_matrix: number[][];
  columns: string[];
  method: string;
  significant_pairs?: Array<{
    column1: string;
    column2: string;
    correlation: number;
    p_value: number;
  }>;
}

/**
 * Outlier result interface
 */
export interface OutlierResult {
  outliers: number[];
  outlier_indices: number[];
  outlier_values: number[];
  method: string;
  parameters: Record<string, any>;
  summary: {
    total_outliers: number;
    percentage: number;
    mean_with_outliers: number;
    mean_without_outliers: number;
  };
}

/**
 * Regression result interface
 */
export interface RegressionResult {
  method: string;
  equation?: string;
  coefficients?: number[];
  r_squared?: number;
  mse?: number;
  predictions?: number[];
  residuals?: number[];
  metrics?: {
    mse: number;
    rmse: number;
    mae: number;
    r2: number;
  };
}

/**
 * Time series result interface
 */
export interface TimeSeriesResult {
  decomposition?: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
  moving_average?: {
    window: number;
    values: number[];
  };
  forecast?: {
    values: number[];
    confidence_interval?: {
      lower: number[];
      upper: number[];
    };
  };
}

/**
 * Chart recommendation interface
 */
export interface ChartRecommendation {
  chart_type: string;
  confidence: number;
  reasoning: string;
  suggested_columns: string[];
}

/**
 * Chart configuration interface
 */
export interface ChartConfig {
  type: string;
  data: any;
  layout?: any;
  config?: any;
}

/**
 * Python execution result interface
 */
export interface PythonExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  execution_time?: number;
}

/**
 * Data processing operation interface
 */
export interface DataOperation {
  type: 'missing' | 'duplicate' | 'whitespace' | 'case' | 'outlier' | 'calculate' | 'filter' | 'sort' | 'add_column' | 'delete_column' | 'rename_column';
  column?: string;
  config?: Record<string, any>;
  applied?: boolean;
}

/**
 * Cleaning issue interface
 */
export interface CleaningIssue {
  type: 'missing' | 'duplicate' | 'whitespace' | 'case' | 'outlier';
  column: string;
  count: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Transform operation interface
 */
export interface TransformOperation {
  id: string;
  type: 'add_column' | 'delete_column' | 'rename_column' | 'sort' | 'filter' | 'calculate';
  config: Record<string, any>;
  applied?: boolean;
}
