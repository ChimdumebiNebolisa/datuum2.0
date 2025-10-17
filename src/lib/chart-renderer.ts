/**
 * Chart.js Integration for Datuum 2.0
 * 
 * Provides real Chart.js rendering instead of canvas placeholders
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js'
import { D3ChartRenderer, transformDataForSankey, transformDataForNetwork, transformDataForHeatmap } from './d3-charts'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface ChartRendererConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'sankey' | 'network' | 'heatmap'
  data: any
  options?: Partial<ChartOptions>
  width?: number
  height?: number
}

export class ChartRenderer {
  private chart: ChartJS | null = null
  private canvas: HTMLCanvasElement | null = null
  private d3Renderer: D3ChartRenderer | null = null
  private isD3Chart: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async render(config: ChartRendererConfig) {
    if (!this.canvas) return

    // Check if this is a D3 chart
    const d3ChartTypes = ['sankey', 'network', 'heatmap']
    this.isD3Chart = d3ChartTypes.includes(config.type)

    if (this.isD3Chart) {
      await this.renderD3Chart(config)
    } else {
      this.renderChartJS(config)
    }
  }

  private async renderD3Chart(config: ChartRendererConfig) {
    if (!this.canvas) return

    // Clear existing content
    this.clear()

    // Create container div for D3
    const container = document.createElement('div')
    container.style.width = '100%'
    container.style.height = '100%'
    this.canvas.parentNode?.insertBefore(container, this.canvas)
    this.canvas.style.display = 'none'

    // Create D3 renderer
    this.d3Renderer = new D3ChartRenderer(container)

    try {
      const { width = 400, height = 300 } = config
      const d3Config = { width, height }

      switch (config.type) {
        case 'sankey':
          const sankeyData = transformDataForSankey(config.data)
          await this.d3Renderer.renderSankey(sankeyData, d3Config)
          break
        case 'network':
          const networkData = transformDataForNetwork(config.data)
          await this.d3Renderer.renderNetwork(networkData, d3Config)
          break
        case 'heatmap':
          const heatmapData = transformDataForHeatmap(config.data)
          await this.d3Renderer.renderHeatmap(heatmapData, d3Config)
          break
      }
    } catch (error) {
      console.error('D3 chart rendering failed:', error)
      this.showError('Failed to render advanced chart. Check your data format.')
    }
  }

  private renderChartJS(config: ChartRendererConfig) {
    try {
      // Validate inputs more thoroughly
      if (!config.data || !config.data.headers || !Array.isArray(config.data.headers)) {
        throw new Error('Invalid data format: missing headers array')
      }
      
      if (!config.data.rows || !Array.isArray(config.data.rows)) {
        throw new Error('Invalid data format: missing rows array')
      }

      if (config.data.rows.length === 0) {
        throw new Error('No data available: rows array is empty')
      }

      if (!config.type) {
        throw new Error('Chart type is required')
      }

      // Validate canvas element thoroughly
      if (!this.canvas) {
        throw new Error('Canvas element not available')
      }

      if (!this.canvas.isConnected) {
        throw new Error('Canvas element is not connected to the DOM')
      }

      // Destroy existing chart more thoroughly
      if (this.chart) {
        try {
          this.chart.destroy()
        } catch (error) {
          console.warn('Error destroying existing chart:', error)
        }
        this.chart = null
      }

      // Show canvas for Chart.js
      this.canvas.style.display = 'block'

      // Clear D3 content
      if (this.d3Renderer) {
        this.d3Renderer.clear()
        this.d3Renderer = null
      }

      // Enhanced canvas context clearing with validation
      const ctx = this.canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get 2D context from canvas')
      }

      // Clear the canvas context to ensure clean state
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      
      // Reset canvas context state
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.restore()

      // Prepare chart data with enhanced error handling
      let chartData: ChartData
      let chartOptions: ChartOptions
      
      try {
        chartData = this.prepareChartData(config)
        chartOptions = this.prepareChartOptions(config)
      } catch (dataError) {
        throw new Error(`Failed to prepare chart data: ${dataError instanceof Error ? dataError.message : 'Unknown error'}`)
      }

      // Validate chart data before creating chart
      if (!chartData.datasets || chartData.datasets.length === 0) {
        throw new Error('No valid datasets found. Check your data format.')
      }

      // Additional validation for chart type
      const mappedType = this.mapChartType(config.type)
      if (!mappedType) {
        throw new Error(`Invalid chart type: ${config.type}`)
      }

      // Create chart with additional error handling
      try {
        this.chart = new ChartJS(this.canvas, {
          type: mappedType,
          data: chartData,
          options: chartOptions
        })

        // Verify chart was created successfully
        if (!this.chart) {
          throw new Error('Chart creation returned null')
        }

        console.log('Chart created successfully:', config.type)
        
      } catch (chartCreationError) {
        // Clean up any partial chart creation
        if (this.chart) {
          try {
            this.chart.destroy()
          } catch (cleanupError) {
            console.warn('Error cleaning up failed chart creation:', cleanupError)
          }
          this.chart = null
        }
        throw new Error(`Chart creation failed: ${chartCreationError instanceof Error ? chartCreationError.message : 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Error in renderChartJS:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.showError(`Failed to render chart: ${errorMessage}`)
      throw error // Re-throw to be caught by calling function
    }
  }

  private clear() {
    // Clear any D3 content
    if (this.canvas?.parentNode) {
      const containers = this.canvas.parentNode.querySelectorAll('div')
      containers.forEach(container => {
        // Remove all div containers that are not the canvas element
        container.remove()
      })
    }
  }

  private showError(message: string) {
    if (!this.canvas) return
    
    this.canvas.style.display = 'block'
    const ctx = this.canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.fillStyle = '#fee2e2'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.fillStyle = '#dc2626'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Chart Error', this.canvas.width / 2, this.canvas.height / 2 - 10)
      ctx.font = '12px Arial'
      ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 + 10)
    }
  }

  async destroy() {
    if (this.chart) {
      try {
        this.chart.destroy()
      } catch (error) {
        console.warn('Error destroying chart:', error)
      }
      this.chart = null
    }
    if (this.d3Renderer) {
      this.d3Renderer.clear()
      this.d3Renderer = null
    }
    this.clear()
    
    // Enhanced canvas cleanup
    if (this.canvas) {
      try {
        await cleanupCanvas(this.canvas)
      } catch (error) {
        console.warn('Error during canvas cleanup in destroy:', error)
      }
    }
  }

  export(format: 'png' | 'svg' | 'pdf' = 'png'): string {
    if (this.isD3Chart && this.d3Renderer) {
      return this.d3Renderer.export(format)
    }
    if (this.chart) {
      return this.chart.toBase64Image(format)
    }
    return ''
  }

  private mapChartType(type: string): any {
    switch (type) {
      case 'line': return 'line'
      case 'bar': return 'bar'
      case 'pie': return 'pie'
      case 'scatter': return 'scatter'
      case 'area': return 'line' // Area charts are line charts with fill
      default: return 'line'
    }
  }

  private prepareChartData(config: ChartRendererConfig): ChartData {
    try {
      const { data, type } = config

      if (!data?.headers || !data?.rows) {
        throw new Error('Data is missing headers or rows')
      }

      if (data.headers.length === 0) {
        throw new Error('No headers found in data')
      }

      if (data.rows.length === 0) {
        throw new Error('No data rows found')
      }

      // Validate that all rows have the same length as headers
      const expectedLength = data.headers.length
      const invalidRows = data.rows.filter((row: string[]) => row.length !== expectedLength)
      if (invalidRows.length > 0) {
        console.warn(`${invalidRows.length} rows have inconsistent column counts`)
      }

      const labels = this.extractLabels(data)
      const datasets = this.extractDatasets(data, type)

      if (datasets.length === 0) {
        throw new Error('No valid numeric data found for charting')
      }

      return {
        labels,
        datasets
      }
    } catch (error) {
      console.error('Error preparing chart data:', error)
      throw error
    }
  }

  private extractLabels(data: any): string[] {
    if (!data.headers || data.headers.length === 0) return []
    
    // Use first column as labels for most chart types
    return data.rows.map((row: string[]) => row[0] || '')
  }

  private extractDatasets(data: any, chartType: string) {
    try {
      if (!data.headers || data.rows.length === 0) return []

      const datasets = []

      if (chartType === 'pie') {
        // For pie charts, use first two columns (label, value)
        if (data.headers.length < 2) {
          throw new Error('Pie chart requires at least 2 columns (label and value)')
        }

        const values = data.rows.map((row: string[]) => {
          const val = parseFloat(row[1])
          if (isNaN(val)) {
            console.warn(`Invalid numeric value in row: ${row[1]}`)
            return 0
          }
          return val
        })
        
        const labels = data.rows.map((row: string[]) => row[0] || '')
        
        // Validate that we have valid values
        const validValues = values.filter(v => v > 0)
        if (validValues.length === 0) {
          throw new Error('No valid positive values found for pie chart')
        }
        
        return [{
          label: data.headers[1] || 'Value',
          data: values,
          backgroundColor: this.generateColors(values.length),
          borderWidth: 1
        }]
      }

      // For other chart types, create datasets for each numeric column
      for (let i = 1; i < data.headers.length; i++) {
        const header = data.headers[i]
        if (!header) {
          console.warn(`Empty header at index ${i}, skipping`)
          continue
        }

        const values = data.rows.map((row: string[]) => {
          if (!row || i >= row.length) {
            console.warn(`Row missing data for column ${i}`)
            return 0
          }
          const val = parseFloat(row[i])
          return isNaN(val) ? 0 : val
        })

        // Skip if all values are zero or non-numeric
        const validValues = values.filter(v => v !== 0 && !isNaN(v))
        if (validValues.length === 0) {
          console.warn(`No valid numeric data in column "${header}", skipping`)
          continue
        }

        datasets.push({
          label: header,
          data: values,
          borderColor: this.generateColor(i - 1),
          backgroundColor: chartType === 'area' 
            ? this.generateColor(i - 1, 0.2)
            : this.generateColor(i - 1),
          fill: chartType === 'area',
          tension: 0.4
        })
      }

      return datasets
    } catch (error) {
      console.error('Error extracting datasets:', error)
      throw error
    }
  }

  private prepareChartOptions(config: ChartRendererConfig): ChartOptions {
    const { type, options = {} } = config

    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: (options as any).showLegend !== false,
          position: 'top' as const
        },
        title: {
          display: !!(options as any).title,
          text: (options as any).title || ''
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: type !== 'pie' ? {
        x: {
          display: true,
          grid: {
            display: (options as any).showGrid !== false
          }
        },
        y: {
          display: true,
          grid: {
            display: (options as any).showGrid !== false
          }
        }
      } : undefined,
      elements: {
        point: {
          radius: type === 'scatter' ? 4 : 3,
          hoverRadius: 6
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    }

    return { ...baseOptions, ...options }
  }

  private generateColor(index: number, alpha: number = 1): string {
    const colors = [
      `rgba(59, 130, 246, ${alpha})`,   // Blue
      `rgba(16, 185, 129, ${alpha})`,   // Green
      `rgba(245, 101, 101, ${alpha})`,  // Red
      `rgba(251, 191, 36, ${alpha})`,   // Yellow
      `rgba(139, 92, 246, ${alpha})`,   // Purple
      `rgba(236, 72, 153, ${alpha})`,   // Pink
      `rgba(6, 182, 212, ${alpha})`,    // Cyan
      `rgba(251, 146, 60, ${alpha})`    // Orange
    ]
    return colors[index % colors.length]
  }

  private generateColors(count: number): string[] {
    return Array.from({ length: count }, (_, i) => this.generateColor(i))
  }
}

// Utility functions for chart creation
export async function createChart(canvas: HTMLCanvasElement, config: ChartRendererConfig): Promise<ChartRenderer> {
  try {
    // Validate inputs before proceeding
    if (!canvas) {
      throw new Error('Canvas element is required')
    }
    
    if (!config) {
      throw new Error('Chart configuration is required')
    }
    
    if (!config.data) {
      throw new Error('Chart data is required')
    }

    // More robust canvas cleanup before creating new charts
    await cleanupCanvas(canvas)

    // Validate canvas is still usable after cleanup
    if (!canvas.isConnected) {
      throw new Error('Canvas element is no longer connected to the DOM')
    }

    const renderer = new ChartRenderer(canvas)
    await renderer.render(config)
    return renderer
    
  } catch (error) {
    console.error('Error in createChart:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to create chart: ${errorMessage}`)
  }
}

// Enhanced canvas cleanup function
async function cleanupCanvas(canvas: HTMLCanvasElement): Promise<void> {
  try {
    // Validate canvas element
    if (!canvas || !canvas.nodeName || canvas.nodeName.toLowerCase() !== 'canvas') {
      throw new Error('Invalid canvas element provided')
    }

    // Check if canvas is already being used by Chart.js
    if ((canvas as any).__chartjs__) {
      console.warn('Canvas is already in use, destroying existing chart first')
      try {
        // More thorough chart destruction
        const existingChart = (canvas as any).__chartjs__
        if (existingChart && typeof existingChart.destroy === 'function') {
          existingChart.destroy()
        }
      } catch (error) {
        console.warn('Error destroying existing chart from canvas:', error)
      }
      
      // Clear the reference immediately
      (canvas as any).__chartjs__ = null
    }

    // Get canvas context and clear it thoroughly
    const ctx = canvas.getContext('2d')
    if (ctx) {
      try {
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Reset all canvas properties to default state
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'
        ctx.strokeStyle = 'rgba(0, 0, 0, 0)'
        ctx.lineWidth = 1
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
        ctx.miterLimit = 10
        ctx.shadowBlur = 0
        ctx.shadowColor = 'rgba(0, 0, 0, 0)'
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.restore()
        
        // Clear any remaining drawing state
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      } catch (ctxError) {
        console.warn('Error clearing canvas context:', ctxError)
      }
    }

    // Remove all Chart.js related properties
    const chartJsProps = ['__chartjs__', '__chartjs_meta__', '__chartjs_plugin__']
    chartJsProps.forEach(prop => {
      if ((canvas as any)[prop] !== undefined) {
        delete (canvas as any)[prop]
      }
    })

    // Force garbage collection hint by nullifying any remaining references
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc()
      } catch (e) {
        // GC not available, ignore
      }
    }

    // Small delay to ensure cleanup completes and any pending operations finish
    await new Promise(resolve => setTimeout(resolve, 25))
    
  } catch (error) {
    console.error('Error during canvas cleanup:', error)
    throw new Error(`Failed to clean canvas for new chart: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function destroyChart(renderer: ChartRenderer | null) {
  if (renderer) {
    try {
      await renderer.destroy()
    } catch (error) {
      console.warn('Error destroying chart renderer:', error)
    }
  }
}

// Chart type definitions
export const CHART_TYPES = {
  line: 'Line Chart',
  bar: 'Bar Chart',
  pie: 'Pie Chart',
  scatter: 'Scatter Plot',
  area: 'Area Chart',
  sankey: 'Sankey Diagram',
  network: 'Network Graph',
  heatmap: 'Heatmap'
} as const

export type ChartType = keyof typeof CHART_TYPES
