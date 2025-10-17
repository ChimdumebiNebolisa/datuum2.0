'use client'

import { useEffect, useRef, useState, useId } from 'react'
import { Download, Maximize2, RotateCcw, Copy } from 'lucide-react'
import { ChartRenderer, createChart, destroyChart } from '@/lib/chart-renderer'
import { exportChartAsPDF } from '@/lib/export-utils'
import { LoadingOverlay, LoadingButton } from './LoadingStates'
import { ariaLabels, announceToScreenReader, chartAccessibility } from '@/lib/accessibility'

interface ChartCanvasProps {
  data?: any
  chartType?: string
  config?: any
}

export function ChartCanvas({ data, chartType = 'line', config }: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRendererRef = useRef<ChartRenderer | null>(null)
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const renderInProgressRef = useRef(false)
  const renderCountRef = useRef(0)
  const lastRenderDataRef = useRef<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Generate unique IDs for accessibility using React's useId hook (SSR-safe)
  const uniqueId = useId()
  const chartId = `chart-${uniqueId}`
  const chartDescriptionId = `chart-description-${uniqueId}`
  
  // Development mode detection for React Strict Mode handling
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Additional render guard for React Strict Mode
  const renderGuardRef = useRef<number>(0)
  const lastSuccessfulRenderRef = useRef<string | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when chart is focused or no input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            handleExport('png')
            break
          case 'c':
            if (chartRendererRef.current) {
              event.preventDefault()
              handleCopyToClipboard()
            }
            break
          case 'r':
            event.preventDefault()
            handleReset()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Memoize config values to prevent unnecessary re-renders
  const configTitle = config?.title
  const configShowLegend = config?.showLegend
  const configShowGrid = config?.showGrid

  useEffect(() => {
    const renderChart = async () => {
      // Prevent multiple simultaneous renders
      if (renderInProgressRef.current || !isMountedRef.current) return
      
      if (!canvasRef.current || !data) return

      // React Strict Mode double-mounting safeguard with enhanced logic
      renderCountRef.current++
      renderGuardRef.current++
      
      const currentRenderData = JSON.stringify({ 
        data: data.headers, 
        chartType, 
        config: configTitle,
        rowsCount: data.rows?.length || 0
      })
      
      if (isDevelopment) {
        // In development, check if this is a duplicate render with same data
        if (lastRenderDataRef.current === currentRenderData && renderCountRef.current % 2 === 0) {
          console.log('Skipping duplicate render in React Strict Mode')
          return
        }
        
        // Additional guard: prevent rapid successive renders of same data
        if (lastSuccessfulRenderRef.current === currentRenderData && renderGuardRef.current < 3) {
          console.log('Skipping rapid successive render attempt')
          return
        }
        
        lastRenderDataRef.current = currentRenderData
      }

      // Cancel any previous render operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this render operation
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // Set render state
      renderInProgressRef.current = true
      setIsLoading(true)
      setError(null)

      try {
        // Check if component is still mounted and operation not aborted
        if (!isMountedRef.current || signal.aborted) return

        // Validate canvas element before proceeding
        if (!canvasRef.current || !canvasRef.current.isConnected) {
          throw new Error('Canvas element is not available or not connected to DOM')
        }

        // Destroy existing chart more safely with timeout
        if (chartRendererRef.current) {
          try {
            // Use Promise.race to prevent hanging on chart destruction
            await Promise.race([
              destroyChart(chartRendererRef.current),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Chart destruction timeout')), 5000)
              )
            ])
          } catch (destroyError) {
            console.warn('Error destroying existing chart:', destroyError)
            // Force cleanup even if destruction failed
            chartRendererRef.current = null
          }
        }

        // Check if component is still mounted after cleanup
        if (!isMountedRef.current || signal.aborted) return

        // Enhanced delay to ensure canvas is properly cleared and ready
        await new Promise(resolve => setTimeout(resolve, 75))

        // Final check before creating chart
        if (!isMountedRef.current || signal.aborted) return

        // Validate canvas is still valid
        if (!canvasRef.current || !canvasRef.current.isConnected) {
          throw new Error('Canvas element became invalid during render preparation')
        }

        // Create new chart with enhanced error handling
        try {
          chartRendererRef.current = await Promise.race([
            createChart(canvasRef.current, {
              type: chartType as any,
              data,
              options: {
                plugins: {
                  title: {
                    display: true,
                    text: configTitle || 'My Chart'
                  },
                  legend: {
                    display: configShowLegend !== false
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: configShowGrid !== false
                    }
                  },
                  y: {
                    grid: {
                      display: configShowGrid !== false
                    }
                  }
                }
              }
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Chart creation timeout')), 10000)
            )
          ])
        } catch (chartCreationError) {
          // Clean up any partial chart creation
          if (chartRendererRef.current) {
            try {
              await destroyChart(chartRendererRef.current)
            } catch (cleanupError) {
              console.warn('Error cleaning up failed chart creation:', cleanupError)
            }
            chartRendererRef.current = null
          }
          throw chartCreationError
        }
        
        // Check if component is still mounted before final setup
        if (!isMountedRef.current || signal.aborted) return
        
        // Enhance canvas for accessibility
        if (canvasRef.current && data) {
          const title = configTitle || 'My Chart'
          const description = chartAccessibility.generateDescription(data, chartType)
          chartAccessibility.enhanceCanvas(canvasRef.current, title, chartDescriptionId)
          
          // Announce chart rendering completion
          announceToScreenReader(`Chart rendered: ${title}`)
        }
        
        // Mark this as a successful render for future guard checks
        lastSuccessfulRenderRef.current = currentRenderData
        
      } catch (err) {
        // Don't set error if operation was aborted or component unmounted
        if (signal.aborted || !isMountedRef.current) return

        console.error('Chart rendering error:', err)
        const errorMsg = err instanceof Error ? err.message : 'Failed to render chart'
        
        // Provide more helpful error messages
        if (errorMsg.includes('Canvas is already in use')) {
          setError('Chart rendering conflict. Please try refreshing the page or resetting the chart.')
        } else if (errorMsg.includes('Invalid data')) {
          setError('The data format is not compatible with chart rendering. Please check your data structure.')
        } else if (errorMsg.includes('Missing data')) {
          setError('Insufficient data to render chart. Please ensure your data has enough rows and columns.')
        } else if (errorMsg.includes('timeout')) {
          setError('Chart rendering timed out. Please try again or check your data size.')
        } else if (errorMsg.includes('not connected')) {
          setError('Chart container is not ready. Please try again.')
        } else {
          setError(`Chart rendering failed: ${errorMsg}. Please try a different chart type or check your data.`)
        }
      } finally {
        // Reset render state
        renderInProgressRef.current = false
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    // Only render if we have valid data
    if (data && data.headers && data.rows && data.rows.length > 0) {
      renderChart()
    } else if (data && (!data.headers || !data.rows || data.rows.length === 0)) {
      // Show error for invalid data structure - but only if we're not already in a render loop
      if (!renderInProgressRef.current) {
        setError('Invalid data structure. Please ensure your data has headers and rows.')
      }
    }

    // Cleanup on unmount or dependency change
    return () => {
      isMountedRef.current = false
      
      // Abort any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Clean up chart renderer
      if (chartRendererRef.current) {
        destroyChart(chartRendererRef.current).catch(error => {
          console.warn('Error cleaning up chart on unmount:', error)
        })
        chartRendererRef.current = null
      }
      
      // Reset state
      renderInProgressRef.current = false
      setIsLoading(false)
    }
  }, [data, chartType, configTitle, configShowLegend, configShowGrid]) // chartDescriptionId is stable from useId()

  const handleExport = async (format: 'png' | 'svg' | 'pdf' = 'png') => {
    if (!chartRendererRef.current || !canvasRef.current) return

    try {
      if (format === 'pdf') {
        // Use jsPDF for proper PDF export
        await exportChartAsPDF({
          chart: canvasRef.current,
          title: config?.title || 'My Chart',
          metadata: {
            createdAt: new Date(),
            chartType: chartType || 'unknown',
            dataSource: 'Datuum 2.0'
          }
        }, {
          filename: `chart_${chartType || 'unknown'}`,
          quality: 0.9
        })
      } else {
        // Use existing export for PNG and SVG
        const dataUrl = chartRendererRef.current.export(format)
        const link = document.createElement('a')
        link.download = `chart.${format}`
        link.href = dataUrl
        link.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!chartRendererRef.current) return

    try {
      const dataUrl = chartRendererRef.current.export('png')
      // Convert data URL to blob for clipboard
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      
      // Show success feedback
      announceToScreenReader('Chart copied to clipboard')
    } catch (error) {
      console.error('Copy to clipboard failed:', error)
      announceToScreenReader('Failed to copy chart')
    }
  }

  const handleReset = async () => {
    if (chartRendererRef.current) {
      try {
        await destroyChart(chartRendererRef.current)
        chartRendererRef.current = null
      } catch (error) {
        console.warn('Error resetting chart:', error)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Visualization
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Reset chart"
            aria-label={ariaLabels.chart.reset}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copy to clipboard"
            aria-label="Copy chart to clipboard"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <div className="relative group">
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={ariaLabels.chart.export}
              aria-haspopup="menu"
            >
              <Download className="h-4 w-4" />
            </button>
            <div 
              className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              role="menu"
              aria-label="Export options"
            >
              <button
                onClick={() => handleExport('png')}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                role="menuitem"
              >
                PNG
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                role="menuitem"
              >
                SVG
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg"
                role="menuitem"
              >
                PDF
              </button>
            </div>
          </div>
          
          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <LoadingOverlay 
          isVisible={isLoading}
          message="Rendering chart..."
        />

        {error && (
          <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">Chart Error</p>
              <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!data && !error && (
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No data to visualize</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Upload a file to get started
              </p>
            </div>
          </div>
        )}

        <div className={`relative ${!data ? 'hidden' : ''}`}>
          <canvas
            key={`${chartId}-${data ? `${JSON.stringify(data.headers).slice(0, 50)}-${data.rows?.length || 0}` : 'no-data'}-${chartType}-${config?.title || 'default'}`}
            id={chartId}
            ref={canvasRef}
            className="w-full h-64 border border-gray-200 dark:border-gray-600 rounded-lg"
            aria-describedby={chartDescriptionId}
          />
          {data && (
            <div 
              id={chartDescriptionId} 
              className="sr-only"
            >
              {chartAccessibility.generateDescription(data, chartType)}
            </div>
          )}
        </div>
      </div>

      {/* Chart Info */}
      {data && config && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Chart Type:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                {chartType} Chart
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Data Points:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {data.rows?.length || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
