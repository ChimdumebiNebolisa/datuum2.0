// Pyodide Web Worker for Python execution

let pyodide: any = null;
let isInitialized = false;

// Initialize Pyodide and load required packages
async function initializePyodide() {
  if (isInitialized) return pyodide;
  
  try {
    // Dynamic import to avoid Node.js module issues
    const { loadPyodide } = await import('pyodide');
    
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.0/full/"
    });

    // Load essential packages
    await pyodide.loadPackage([
      'numpy',
      'pandas',
      'scipy',
      'matplotlib',
      'scikit-learn',
      'seaborn'
    ]);

    isInitialized = true;
    return pyodide;
  } catch (error) {
    console.error('Failed to initialize Pyodide:', error);
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
    console.error('Python execution error:', error);
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
    console.error(`Failed to load module ${moduleName}:`, error);
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