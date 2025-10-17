/**
 * Pyodide configuration utility
 * 
 * This module provides centralized configuration for Pyodide,
 * allowing easy customization of CDN URLs and versions via environment variables.
 */

export interface PyodideConfig {
  version: string;
  cdnUrl: string;
  baseUrl: string;
  packages: string[];
  debug: boolean;
}

/**
 * Get Pyodide configuration from environment variables with fallbacks
 */
export function getPyodideConfig(): PyodideConfig {
  const version = process.env.NEXT_PUBLIC_PYODIDE_VERSION || '0.26.0';
  const cdnUrl = process.env.NEXT_PUBLIC_PYODIDE_CDN_URL || 'https://cdn.jsdelivr.net/pyodide';
  const packages = process.env.NEXT_PUBLIC_PYODIDE_PACKAGES 
    ? process.env.NEXT_PUBLIC_PYODIDE_PACKAGES.split(',')
    : ['numpy', 'pandas', 'scipy', 'matplotlib', 'scikit-learn', 'seaborn'];
  const debug = process.env.NEXT_PUBLIC_PYODIDE_DEBUG === 'true';

  // Construct the full CDN URL
  const baseUrl = `${cdnUrl}/v${version}/full`;

  return {
    version,
    cdnUrl,
    baseUrl,
    packages,
    debug
  };
}

/**
 * Get the Pyodide script URL
 */
export function getPyodideScriptUrl(): string {
  const config = getPyodideConfig();
  return `${config.baseUrl}/pyodide.js`;
}

/**
 * Get the Pyodide index URL for package loading
 */
export function getPyodideIndexUrl(): string {
  const config = getPyodideConfig();
  return config.baseUrl;
}

/**
 * Get the list of packages to preload
 */
export function getPyodidePackages(): string[] {
  const config = getPyodideConfig();
  return config.packages;
}

/**
 * Check if debug mode is enabled
 */
export function isPyodideDebugEnabled(): boolean {
  const config = getPyodideConfig();
  return config.debug;
}

/**
 * Log Pyodide configuration (only in debug mode)
 */
export function logPyodideConfig(): void {
  if (isPyodideDebugEnabled()) {
    const config = getPyodideConfig();
    console.log('Pyodide Configuration:', {
      version: config.version,
      cdnUrl: config.cdnUrl,
      baseUrl: config.baseUrl,
      packages: config.packages,
      scriptUrl: getPyodideScriptUrl()
    });
  }
}
