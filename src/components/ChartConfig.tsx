'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, LineChart, PieChart, Dot, TrendingUp, Settings, Network, GitBranch, Activity, Loader2 } from 'lucide-react'
import { ChartRecommendationEngine, ChartRecommendation, DataParser } from '@/lib/java-modules'

interface ChartConfigProps {
  data?: any
  onChartTypeChange?: (chartType: string) => void
  onConfigChange?: (config: any) => void
}

const chartTypes = [
  { id: 'line', name: 'Line Chart', icon: LineChart, description: 'Perfect for time series data', category: 'basic' },
  { id: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Great for categorical comparisons', category: 'basic' },
  { id: 'pie', name: 'Pie Chart', icon: PieChart, description: 'Shows parts of a whole', category: 'basic' },
  { id: 'scatter', name: 'Scatter Plot', icon: Dot, description: 'Reveals correlations', category: 'basic' },
  { id: 'area', name: 'Area Chart', icon: TrendingUp, description: 'Shows cumulative data', category: 'basic' },
  { id: 'sankey', name: 'Sankey Diagram', icon: GitBranch, description: 'Visualizes flow between entities', category: 'advanced' },
  { id: 'network', name: 'Network Graph', icon: Network, description: 'Shows relationships between nodes', category: 'advanced' },
  { id: 'heatmap', name: 'Heatmap', icon: Activity, description: 'Displays data density patterns', category: 'advanced' },
]

export function ChartConfig({ data, onChartTypeChange, onConfigChange }: ChartConfigProps) {
  const [selectedChartType, setSelectedChartType] = useState('line')
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [config, setConfig] = useState({
    title: 'My Chart',
    xAxis: '',
    yAxis: '',
    color: '#2563eb',
    showLegend: true,
    showGrid: true,
    showLabels: true,
    fontSize: 12,
    fontFamily: 'Arial',
    colorScheme: 'default',
    backgroundColor: '#ffffff',
    chartWidth: 400,
    chartHeight: 300,
    animation: true,
    opacity: 1.0,
  })

  const generateRecommendations = useCallback(async (data: any) => {
    setIsLoadingRecommendations(true)
    
    const getHeuristicRecommendations = (data: any): ChartRecommendation[] => {
      // Convert data to our ParsedData format
      const parsedData = {
        headers: data.headers || [],
        rows: data.rows || [],
        metadata: {
          rowCount: data.rows?.length || 0,
          columnCount: data.headers?.length || 0,
          format: 'unknown'
        },
        errors: []
      }
      
      // Use our new TypeScript recommendation engine
      const recommendations = ChartRecommendationEngine.analyze(parsedData)
      
      // Convert to the format expected by the UI (add missing properties)
      return recommendations.map(rec => ({
        ...rec,
        alternativeCharts: getAlternativeCharts(rec.chartType),
        dataInsights: getDataInsights(rec.chartType, rec.reasoning)
      }))
    }
    
    try {
      // Use heuristic recommendations
      const recommendations = getHeuristicRecommendations(data)
      setRecommendations(recommendations)
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      // Use fallback recommendations on error
      const fallbackRecommendations = getHeuristicRecommendations(data)
      setRecommendations(fallbackRecommendations)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [])

  // Generate chart recommendations
  useEffect(() => {
    if (data?.headers && data?.rows) {
      generateRecommendations(data)
    }
  }, [data, generateRecommendations])

  // Call onConfigChange when config changes (memoized to prevent infinite loops)
  useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  
  const getAlternativeCharts = (chartType: string): string[] => {
    const alternatives: Record<string, string[]> = {
      'Line Chart': ['area', 'bar'],
      'Bar Chart': ['pie', 'line'],
      'Pie Chart': ['bar', 'line'],
      'Scatter Plot': ['line', 'heatmap'],
      'Histogram': ['box-plot', 'line'],
      'Box Plot': ['histogram', 'scatter'],
      'Heatmap': ['scatter', 'bar'],
      'Horizontal Bar Chart': ['bar', 'pie']
    }
    return alternatives[chartType] || ['bar', 'line']
  }
  
  const getDataInsights = (chartType: string, reasoning: string): string[] => {
    const insights: Record<string, string[]> = {
      'Line Chart': ['Time-based trends visible', 'Seasonal patterns may exist'],
      'Bar Chart': ['Category comparisons possible', 'Distribution patterns visible'],
      'Pie Chart': ['Parts of whole relationships', 'Proportional data representation'],
      'Scatter Plot': ['Correlations between variables', 'Outliers may be present'],
      'Histogram': ['Data distribution analysis', 'Statistical patterns visible'],
      'Box Plot': ['Statistical summary view', 'Outlier detection'],
      'Heatmap': ['Multi-dimensional patterns', 'Data density visualization']
    }
    return insights[chartType] || ['Basic data overview', 'Simple comparisons possible']
  }

  const handleChartTypeChange = useCallback((chartType: string) => {
    setSelectedChartType(chartType)
    onChartTypeChange?.(chartType)
  }, [onChartTypeChange])

  const handleConfigChange = useCallback((key: string, value: any) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig, [key]: value }
      return newConfig
    })
  }, [])

  const getAvailableColumns = () => {
    if (!data?.headers) return []
    return data.headers.map((header: string, index: number) => ({
      value: header,
      label: header,
      index
    }))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Chart Configuration
      </h2>

      {/* Chart Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Chart Type
        </label>
        
        {/* Basic Charts */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Basic Charts</h4>
          <div className="grid grid-cols-2 gap-2">
            {chartTypes.filter(chart => chart.category === 'basic').map((chart) => {
              const Icon = chart.icon
              return (
                <button
                  key={chart.id}
                  onClick={() => handleChartTypeChange(chart.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedChartType === chart.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {chart.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {chart.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Advanced Charts */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Advanced Charts</h4>
          <div className="grid grid-cols-2 gap-2">
            {chartTypes.filter(chart => chart.category === 'advanced').map((chart) => {
              const Icon = chart.icon
              return (
                <button
                  key={chart.id}
                  onClick={() => handleChartTypeChange(chart.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedChartType === chart.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {chart.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {chart.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chart Recommendations */}
      {data?.headers && data?.rows && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Chart Recommendations
            </label>
            <div className="flex items-center space-x-2">
              {isLoadingRecommendations && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              )}
              {recommendations.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {recommendations.length} suggestions
                </span>
              )}
            </div>
          </div>
          
          
          {isLoadingRecommendations && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyzing your data...
                </p>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {recommendations
              .sort((a, b) => b.confidence - a.confidence)
              .map((rec, index) => {
                const chartTypeInfo = chartTypes.find(c => c.id === rec.chartType)
                const Icon = chartTypeInfo?.icon || BarChart3
                const isTopRecommendation = index === 0
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      isTopRecommendation
                        ? 'bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/30 border-primary-300 dark:border-primary-700 ring-2 ring-primary-200 dark:ring-primary-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => handleChartTypeChange(rec.chartType)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          isTopRecommendation 
                            ? 'bg-primary-100 dark:bg-primary-800' 
                            : 'bg-gray-100 dark:bg-gray-600'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            isTopRecommendation 
                              ? 'text-primary-600 dark:text-primary-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-semibold ${
                              isTopRecommendation 
                                ? 'text-primary-900 dark:text-primary-200' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {rec.chartType.charAt(0).toUpperCase() + rec.chartType.slice(1)} Chart
                            </h4>
                            {isTopRecommendation && (
                              <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${
                            isTopRecommendation 
                              ? 'text-primary-700 dark:text-primary-300' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {rec.reasoning}
                          </p>
                          {rec.dataInsights && rec.dataInsights.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                                Key insights:
                              </p>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                {rec.dataInsights.slice(0, 2).map((insight, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-1">•</span>
                                    <span>{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {chartTypeInfo && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {chartTypeInfo.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-lg font-bold ${
                          isTopRecommendation 
                            ? 'text-primary-900 dark:text-primary-200' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {Math.round(rec.confidence * 100)}%
                        </div>
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              isTopRecommendation ? 'bg-primary-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          confidence
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
          {recommendations.length > 0 && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              💡 Click on any recommendation to apply it instantly
            </div>
          )}
        </div>
      )}

      {/* Basic Configuration */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chart Title
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => handleConfigChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              X-Axis
            </label>
            <select
              value={config.xAxis}
              onChange={(e) => handleConfigChange('xAxis', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select column</option>
              {getAvailableColumns().map((col: any) => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Y-Axis
            </label>
            <select
              value={config.yAxis}
              onChange={(e) => handleConfigChange('yAxis', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select column</option>
              {getAvailableColumns().map((col: any) => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={config.color}
              onChange={(e) => handleConfigChange('color', e.target.value)}
              className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={config.color}
              onChange={(e) => handleConfigChange('color', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Advanced Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
            Advanced Settings
          </h3>

          {/* Color Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Scheme
            </label>
            <select
              value={config.colorScheme}
              onChange={(e) => handleConfigChange('colorScheme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="default">Default</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="orange">Orange</option>
              <option value="red">Red</option>
              <option value="gray">Gray</option>
            </select>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Background Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={config.backgroundColor}
                onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Family
              </label>
              <select
                value={config.fontFamily}
                onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {config.fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="24"
                step="1"
                value={config.fontSize}
                onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Width: {config.chartWidth}px
              </label>
              <input
                type="range"
                min="200"
                max="800"
                step="50"
                value={config.chartWidth}
                onChange={(e) => handleConfigChange('chartWidth', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height: {config.chartHeight}px
              </label>
              <input
                type="range"
                min="150"
                max="600"
                step="50"
                value={config.chartHeight}
                onChange={(e) => handleConfigChange('chartHeight', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Opacity: {Math.round(config.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={config.opacity}
              onChange={(e) => handleConfigChange('opacity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Display Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showLegend}
                onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Legend
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showGrid}
                onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Grid
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showLabels}
                onChange={(e) => handleConfigChange('showLabels', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Labels
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.animation}
                onChange={(e) => handleConfigChange('animation', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable Animation
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
