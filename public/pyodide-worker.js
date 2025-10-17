// Simple Python execution worker (Pyodide will be loaded dynamically)
// This is a standalone version for static export deployment

// Configuration
const PYODIDE_VERSION = '0.26.0';
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide';
const PYODIDE_PACKAGES = ['numpy', 'pandas', 'scipy', 'matplotlib', 'scikit-learn', 'seaborn'];

let pyodide = null;
let isInitialized = false;

// Simple logger for worker environment
const logger = {
  warn: (message, ...args) => console.warn(`[Pyodide Worker] ${message}`, ...args),
  error: (message, ...args) => console.error(`[Pyodide Worker] ${message}`, ...args),
  info: (message, ...args) => console.info(`[Pyodide Worker] ${message}`, ...args)
};

// Initialize Pyodide and load required packages
async function initializePyodide() {
  if (isInitialized) return pyodide;
  
  try {
    logger.info('Initializing Pyodide...');
    
    // Get configuration
    const scriptUrl = `${PYODIDE_CDN_URL}/v${PYODIDE_VERSION}/full/pyodide.js`;
    const indexUrl = `${PYODIDE_CDN_URL}/v${PYODIDE_VERSION}/full`;
    
    // Worker environment - use importScripts
    importScripts(scriptUrl);
    const { loadPyodide } = self.pyodide;
    
    pyodide = await loadPyodide({
      indexURL: indexUrl
    });

    // Load essential packages one by one with progress tracking
    for (const pkg of PYODIDE_PACKAGES) {
      try {
        logger.info(`Loading package: ${pkg}`);
        await pyodide.loadPackage(pkg);
      } catch (error) {
        logger.warn(`Failed to load package ${pkg}:`, error);
        // Continue with other packages
      }
    }

    isInitialized = true;
    logger.info('Pyodide initialization completed');
    return pyodide;
  } catch (error) {
    logger.error('Failed to initialize Pyodide:', error);
    throw error;
  }
}

// Execute Python code and return results
async function executePython(code, context = {}) {
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
async function loadPythonModule(moduleName) {
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

// Export for compatibility
export { initializePyodide, executePython, loadPythonModule };