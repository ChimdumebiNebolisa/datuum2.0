/**
 * Shared utilities for analytics components
 * Provides common functions for data analysis, export functionality, and UI helpers
 */

import { logger } from './logger';

/**
 * Filters columns to find numeric columns based on sample data
 * @param data - Array of data objects to analyze
 * @param dataColumns - Array of column names to check
 * @returns Array of column names that contain numeric data
 */
export function getNumericColumns(data: any[], dataColumns: string[]): string[] {
  return dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });
}

/**
 * Common empty state component for when Python is not initialized
 */
export function getPythonNotInitializedUI() {
  return {
    type: 'loading',
    message: 'Initializing Python environment...'
  };
}

/**
 * Common empty state component for when no numeric columns are found
 */
export function getNoNumericColumnsUI(minColumns: number = 2) {
  return {
    type: 'empty',
    message: `Please select at least ${minColumns} numeric columns to perform analysis`
  };
}

/**
 * Common export functionality for analytics results
 * @param data - Data to export
 * @param filename - Name of the file
 * @param format - Export format ('json' | 'csv')
 */
export function exportAnalyticsData(data: any, filename: string, format: 'json' | 'csv' = 'json') {
  try {
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      // Convert to CSV
      if (Array.isArray(data)) {
        const headers = Object.keys(data[0] || {});
        const csvRows = [headers.join(',')];
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          });
          csvRows.push(values.join(','));
        });
        content = csvRows.join('\n');
      } else {
        content = JSON.stringify(data, null, 2);
      }
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Export failed:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Common loading state UI for analytics panels
 */
export function getLoadingUI(message: string = 'Loading...') {
  return {
    type: 'loading',
    message
  };
}

/**
 * Common error state UI for analytics panels
 */
export function getErrorUI(error: string) {
  return {
    type: 'error',
    message: error
  };
}

/**
 * Common empty state UI for analytics panels
 */
export function getEmptyUI(message: string) {
  return {
    type: 'empty',
    message
  };
}

/**
 * Gets severity color for badges
 * @param severity - Severity level
 * @returns CSS class for severity
 */
export function getSeverityColor(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
}

/**
 * Formats number with appropriate precision
 * @param num - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num) || !isFinite(num)) return 'N/A';
  return num.toFixed(decimals);
}

/**
 * Calculates percentage with proper formatting
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(decimals)}%`;
}
