/**
 * Pyodide Service
 * Handles initialization and execution of Python code in the browser
 */

let pyodideInstance = null;
let pyodideLoading = null;

/**
 * Initialize Pyodide (loads once and caches)
 * @returns {Promise<Object>} Pyodide instance
 */
export async function initPyodide() {
  // If already initialized, return cached instance
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // If currently loading, wait for that to finish
  if (pyodideLoading) {
    return pyodideLoading;
  }

  // Start loading Pyodide
  pyodideLoading = (async () => {
    try {
      console.log('Loading Pyodide...');
      const { loadPyodide } = await import('pyodide');

      pyodideInstance = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/',
      });

      console.log('Pyodide loaded successfully!');
      return pyodideInstance;
    } catch (error) {
      console.error('Failed to load Pyodide:', error);
      pyodideLoading = null;
      throw error;
    }
  })();

  return pyodideLoading;
}

/**
 * Execute Python code using Pyodide
 * @param {string} code - Python code to execute
 * @returns {Promise<Object>} Execution result with output and stderr
 */
export async function executePythonCode(code) {
  try {
    const pyodide = await initPyodide();

    // Capture stdout and stderr
    const captureCode = `
import sys
from io import StringIO

# Capture stdout and stderr
_stdout = StringIO()
_stderr = StringIO()
sys.stdout = _stdout
sys.stderr = _stderr

_execution_error = None

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    _execution_error = str(e)
    import traceback
    traceback.print_exc()

# Get captured output
_output = _stdout.getvalue()
_error = _stderr.getvalue()

# Reset stdout/stderr
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

(_output, _error, _execution_error)
`;

    // Execute the code
    const result = await pyodide.runPythonAsync(captureCode);

    const [output, stderr, executionError] = result.toJs();

    return {
      run: {
        output: output || '',
        stderr: stderr || executionError || '',
        code: executionError ? 1 : 0,
      }
    };
  } catch (error) {
    console.error('Python execution error:', error);
    return {
      run: {
        output: '',
        stderr: error.message || 'Python execution failed',
        code: 1,
      }
    };
  }
}

/**
 * Check if Pyodide is ready
 * @returns {boolean} True if Pyodide is initialized
 */
export function isPyodideReady() {
  return pyodideInstance !== null;
}

/**
 * Get loading status
 * @returns {boolean} True if Pyodide is currently loading
 */
export function isPyodideLoading() {
  return pyodideLoading !== null && pyodideInstance === null;
}
