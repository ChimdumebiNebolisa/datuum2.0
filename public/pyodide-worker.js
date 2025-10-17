/**
 * Pyodide Web Worker for Python Execution
 * 
 * This worker handles Python code execution in the browser using Pyodide.
 * It loads Python packages like pandas, numpy, scipy, and matplotlib.
 */

let pyodide = null;
let isLoaded = false;

// Load Pyodide and required packages
async function loadPyodide() {
  if (isLoaded) return pyodide;
  
  try {
    // Import Pyodide
    self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js');
    
    // Initialize Pyodide
    pyodide = await self.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.0/full/'
    });
    
    // Install required packages
    await pyodide.loadPackage(['pandas', 'numpy', 'scipy', 'matplotlib', 'scikit-learn', 'seaborn']);
    
    // Load our custom Python modules
    await loadPythonModules();
    
    isLoaded = true;
    console.log('Pyodide loaded successfully with packages:', pyodide.loadedPackages);
    
    return pyodide;
  } catch (error) {
    console.error('Failed to load Pyodide:', error);
    throw error;
  }
}

// Load custom Python modules
async function loadPythonModules() {
  const modules = [
    'data_processor.py',
    'statistics.py', 
    'ml_insights.py',
    'chart_recommender.py',
    'time_series.py'
  ];
  
  for (const module of modules) {
    try {
      // Load Python module from public/python/ directory
      const response = await fetch(`/python/${module}`);
      if (response.ok) {
        const code = await response.text();
        pyodide.runPython(code);
        console.log(`Loaded Python module: ${module}`);
      } else {
        console.warn(`Could not load Python module: ${module}`);
      }
    } catch (error) {
      console.warn(`Error loading Python module ${module}:`, error);
    }
  }
}

// Message handler for worker communication
self.onmessage = async function(e) {
  const { id, type, payload } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'INIT':
        result = await loadPyodide();
        self.postMessage({ id, type: 'INIT_SUCCESS', payload: { loaded: true } });
        break;
        
      case 'EXECUTE_PYTHON':
        if (!pyodide) {
          throw new Error('Pyodide not initialized');
        }
        
        const { code, context = {} } = payload;
        
        // Set context variables
        for (const [key, value] of Object.entries(context)) {
          pyodide.globals.set(key, value);
        }
        
        // Execute Python code
        result = pyodide.runPython(code);
        
        // Get result (handle different return types)
        let resultData;
        if (result && typeof result === 'object' && result.toJs) {
          // Convert Pyodide objects to JavaScript
          resultData = result.toJs({ dict_converter: Object.fromEntries });
        } else {
          resultData = result;
        }
        
        self.postMessage({ 
          id, 
          type: 'EXECUTE_SUCCESS', 
          payload: { result: resultData } 
        });
        break;
        
      case 'GET_PYTHON_VARIABLE':
        if (!pyodide) {
          throw new Error('Pyodide not initialized');
        }
        
        const { variableName } = payload;
        const variable = pyodide.globals.get(variableName);
        
        let variableData;
        if (variable && typeof variable === 'object' && variable.toJs) {
          variableData = variable.toJs({ dict_converter: Object.fromEntries });
        } else {
          variableData = variable;
        }
        
        self.postMessage({ 
          id, 
          type: 'GET_VARIABLE_SUCCESS', 
          payload: { variable: variableData } 
        });
        break;
        
      case 'SET_PYTHON_VARIABLE':
        if (!pyodide) {
          throw new Error('Pyodide not initialized');
        }
        
        const { name, value } = payload;
        pyodide.globals.set(name, value);
        
        self.postMessage({ 
          id, 
          type: 'SET_VARIABLE_SUCCESS', 
          payload: { success: true } 
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ 
      id, 
      type: 'ERROR', 
      payload: { 
        error: error.message,
        stack: error.stack 
      } 
    });
  }
};

// Signal that worker is ready
self.postMessage({ type: 'WORKER_READY' });
