// JavaScript wrapper for Python data processing module
import { usePythonExecution } from '../pyodide-bridge';

export interface DataProcessingResult {
  success: boolean;
  error?: string;
  data?: any;
  shape?: [number, number];
  columns?: string[];
  dtypes?: Record<string, string>;
  missing_values?: Record<string, number>;
  memory_usage?: number;
}

export interface DataCleaningResult {
  success: boolean;
  error?: string;
  original_shape?: [number, number];
  new_shape?: [number, number];
  operations_performed?: string[];
  columns?: string[];
  dtypes?: Record<string, string>;
}

export interface DataTransformationResult {
  success: boolean;
  error?: string;
  transformations_applied?: string[];
  new_shape?: [number, number];
  columns?: string[];
}

export function useDataProcessing() {
  const { executePython, isInitialized, loading } = usePythonExecution();

  const loadData = async (
    data: any,
    fileType: string = 'csv',
    options: Record<string, any> = {}
  ): Promise<DataProcessingResult> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from data_processor import data_processor

# Load the data
result = data_processor.load_data(data, file_type='${fileType}', **${JSON.stringify(options)})
result
      `;

      const result = await executePython(code, { data });
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        data: result,
        shape: (result as any).shape,
        columns: (result as any).columns,
        dtypes: (result as any).dtypes,
        missing_values: (result as any).missing_values,
        memory_usage: (result as any).memory_usage
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data loading failed'
      };
    }
  };

  const cleanData = async (
    operations?: string[]
  ): Promise<DataCleaningResult> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from data_processor import data_processor

# Clean the data
result = data_processor.clean_data(${operations ? JSON.stringify(operations) : 'None'})
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        original_shape: (result as any).original_shape,
        new_shape: (result as any).new_shape,
        operations_performed: (result as any).operations_performed,
        columns: (result as any).columns,
        dtypes: (result as any).dtypes
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data cleaning failed'
      };
    }
  };

  const transformData = async (
    transformations: Array<{
      type: string;
      column: string;
      params: Record<string, any>;
    }>
  ): Promise<DataTransformationResult> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from data_processor import data_processor

# Transform the data
transformations = ${JSON.stringify(transformations)}
result = data_processor.transform_data(transformations)
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        transformations_applied: (result as any).transformations_applied,
        new_shape: (result as any).new_shape,
        columns: (result as any).columns
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data transformation failed'
      };
    }
  };

  const getDataInfo = async (): Promise<DataProcessingResult> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from data_processor import data_processor

# Get data information
result = data_processor.get_data_info()
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        data: result,
        shape: (result as any).shape,
        columns: (result as any).columns,
        dtypes: (result as any).dtypes,
        missing_values: (result as any).missing_values,
        memory_usage: (result as any).memory_usage
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get data info'
      };
    }
  };

  const exportData = async (
    format: string = 'csv'
  ): Promise<{ success: boolean; error?: string; data?: string; format?: string; shape?: [number, number] }> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from data_processor import data_processor

# Export data
result = data_processor.export_data('${format}')
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        data: (result as any).data,
        format: (result as any).format,
        shape: (result as any).shape
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data export failed'
      };
    }
  };

  const resetData = async (): Promise<{ success: boolean; error?: string; message?: string; shape?: [number, number] }> => {
    if (!isInitialized) {
      return { success: false, error: 'Python not initialized' };
    }

    try {
      const code = `
import sys
sys.path.append('/python')
from data_processor import data_processor

# Reset data
result = data_processor.reset_data()
result
      `;

      const result = await executePython(code);
      
      return {
        success: (result as any).success,
        error: (result as any).error,
        message: (result as any).message,
        shape: (result as any).shape
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data reset failed'
      };
    }
  };

  return {
    loadData,
    cleanData,
    transformData,
    getDataInfo,
    exportData,
    resetData,
    loading,
    isInitialized
  };
}

// Utility functions for data processing
export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      let value: any = values[index] || '';
      
      // Try to parse as number
      if (value && !isNaN(Number(value))) {
        value = Number(value);
      }
      
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return data;
};

export const parseJSON = (jsonText: string): any => {
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

export const validateData = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { valid: false, errors };
  }
  
  if (data.length === 0) {
    errors.push('Data cannot be empty');
    return { valid: false, errors };
  }
  
  // Check if all objects have the same keys
  const firstKeys = Object.keys(data[0]);
  for (let i = 1; i < data.length; i++) {
    const keys = Object.keys(data[i]);
    if (keys.length !== firstKeys.length || !keys.every(key => firstKeys.includes(key))) {
      errors.push(`Row ${i + 1} has different structure than the first row`);
    }
  }
  
  return { valid: errors.length === 0, errors };
};