// Simple Python execution worker (Pyodide will be loaded dynamically)
import { logger } from '@/lib/logger';
import { getPyodideScriptUrl, getPyodideIndexUrl, getPyodidePackages, logPyodideConfig } from '@/lib/pyodide-config';

// TypeScript declarations for worker environment
declare global {
  interface WorkerGlobalScope {
    pyodide: any;
  }
  function importScripts(...urls: string[]): void;
}

let pyodide: any = null;
let isInitialized = false;

// Initialize Pyodide and load required packages
async function initializePyodide() {
  if (isInitialized) return pyodide;
  
  try {
    // Log configuration in debug mode
    logPyodideConfig();
    
    // Get configuration
    const scriptUrl = getPyodideScriptUrl();
    const indexUrl = getPyodideIndexUrl();
    
    // Worker environment - use importScripts
    importScripts(scriptUrl);
    // @ts-ignore
    const { loadPyodide } = self.pyodide;
    
    pyodide = await loadPyodide({
      indexURL: indexUrl
    });

    // Load essential packages one by one with progress tracking
    const packages = getPyodidePackages();
    for (const pkg of packages) {
      try {
        await pyodide.loadPackage(pkg);
      } catch (error) {
        logger.warn(`Failed to load package ${pkg}:`, error);
        // Continue with other packages
      }
    }

    isInitialized = true;
    return pyodide;
  } catch (error) {
    logger.error('Failed to initialize Pyodide:', error);
    throw error;
  }
}

// Execute Python code and return results
async function executePython(code: string, context: Record<string, any> = {}) {
  const py = await initializePyodide();
  
  try {
    // Set context variables
    for (const [key, value] of Object.entries(context)) {
      py.globals.set(key, value);
    }

    // Execute Python code
    const result = py.runPython(code);
    
    // Convert result to JavaScript
    if (result && typeof result.toJs === 'function') {
      return result.toJs({ dict_converter: Object.fromEntries });
    }
    
    return result;
  } catch (error) {
    logger.error('Python execution error:', error);
    throw error;
  }
}

// Load Python modules from public directory
async function loadPythonModule(moduleName: string) {
  const py = await initializePyodide();
  
  try {
    const response = await fetch(`/python/${moduleName}.py`);
    const code = await response.text();
    
    py.runPython(code);
    return py.globals.get(moduleName.replace('.py', ''));
  } catch (error) {
    logger.error(`Failed to load module ${moduleName}:`, error);
    throw error;
  }
}

// Message handler for Web Worker
self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'INITIALIZE':
        await initializePyodide();
        result = { success: true };
        break;
        
      case 'EXECUTE':
        result = await executePython(payload.code, payload.context);
        break;
        
      case 'LOAD_MODULE':
        result = await loadPythonModule(payload.moduleName);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    self.postMessage({
      type: 'SUCCESS',
      payload: result,
      id
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      id
    });
  }
});

export { initializePyodide, executePython, loadPythonModule };