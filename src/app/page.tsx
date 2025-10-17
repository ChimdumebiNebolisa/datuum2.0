'use client'

import { useState, useEffect } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ChartCanvas } from '@/components/ChartCanvas'
import { ChartConfig } from '@/components/ChartConfig'
import { DataPreview } from '@/components/DataPreview'
import { ProjectManager } from '@/components/ProjectManager'
import { DataTransform } from '@/components/DataTransform'
import { MobilePanel } from '@/components/MobilePanel'
import { Header } from '@/components/Header'
import { BarChart3, Upload, Shield, Zap, Download, ArrowRight, HelpCircle } from 'lucide-react'
import { Project } from '@/lib/storage'
import { HowItWorksModal } from '@/components/HowItWorksModal'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'

export default function Home() {
  const [showApp, setShowApp] = useState(false)
  const [uploadedData, setUploadedData] = useState(null)
  const [chartConfig, setChartConfig] = useState(null)
  const [chartType, setChartType] = useState('line')
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  const handleDataParsed = (data: any) => {
    try {
      // Enhanced data structure validation
      if (!data) {
        throw new Error('No data received from file parsing')
      }
      
      if (!data.headers || !Array.isArray(data.headers)) {
        throw new Error('Invalid data structure: missing or invalid headers array')
      }
      
      if (!data.rows || !Array.isArray(data.rows)) {
        throw new Error('Invalid data structure: missing or invalid rows array')
      }

      if (data.headers.length === 0) {
        throw new Error('Data has no columns - please ensure your file has headers')
      }

      if (data.rows.length === 0) {
        throw new Error('Data has no rows - please ensure your file contains data')
      }

      // Additional validation: check for consistent row lengths
      const expectedRowLength = data.headers.length
      const invalidRows = data.rows.filter((row: any) => !Array.isArray(row) || row.length !== expectedRowLength)
      
      if (invalidRows.length > 0) {
        console.warn(`Found ${invalidRows.length} rows with inconsistent column counts`)
        // Don't throw error, just warn - some data might still be usable
      }

      // Check for at least some numeric data for charting
      let hasNumericData = false
      for (let i = 1; i < data.headers.length && !hasNumericData; i++) {
        const numericRows = data.rows.filter((row: any[]) => {
          if (!row || i >= row.length) return false
          const val = parseFloat(row[i])
          return !isNaN(val) && isFinite(val)
        })
        if (numericRows.length > 0) {
          hasNumericData = true
        }
      }

      if (!hasNumericData) {
        console.warn('Warning: No numeric data found in columns. Chart rendering may be limited.')
      }

      console.log('Data validated successfully:', {
        headers: data.headers.length,
        rows: data.rows.length,
        format: data.metadata?.format || 'unknown',
        hasNumericData,
        invalidRowCount: invalidRows.length
      })

      setUploadedData(data)
      setShowApp(true)
    } catch (error) {
      console.error('Error validating parsed data:', error)
      // The error will be handled by the FileUpload component's error state
      throw error // Re-throw to ensure FileUpload component can handle it
    }
  }

  const handleChartTypeChange = (type: string) => {
    try {
      // Validate chart type
      const validChartTypes = ['line', 'bar', 'pie', 'scatter', 'area', 'sankey', 'network', 'heatmap']
      if (!validChartTypes.includes(type)) {
        console.warn(`Invalid chart type: ${type}. Using default 'line' chart.`)
        setChartType('line')
        return
      }
      
      setChartType(type)
      console.log('Chart type changed to:', type)
    } catch (error) {
      console.error('Error changing chart type:', error)
      // Fallback to line chart
      setChartType('line')
    }
  }

  const handleConfigChange = (config: any) => {
    setChartConfig(config)
  }

  const handleLoadProject = (project: Project) => {
    setUploadedData(project.data)
    setChartConfig(project.chartConfig)
    setChartType(project.chartConfig?.chartType || 'line')
    setShowApp(true)
  }

  const handleNewProject = () => {
    setUploadedData(null)
    setChartConfig(null)
    setChartType('line')
    setShowApp(true)
  }

  const handleExport = () => {
    // This will trigger export functionality
    // The actual export will be handled by the ChartCanvas component
    console.log('Export clicked - functionality handled by ChartCanvas')
  }

  const handleHomeClick = () => {
    setShowApp(false)
    // Reset state when going back to landing page
    setUploadedData(null)
    setChartConfig(null)
    setChartType('line')
  }

  if (showApp) {
    return (
      <main className="min-h-screen">
        <Header 
          onLoadProject={handleLoadProject}
          onNewProject={handleNewProject}
          onExport={handleExport}
          onHomeClick={handleHomeClick}
        />
            <div className="container max-w-screen-2xl mx-auto px-4 py-6">
              {/* Dashboard Grid Layout */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Sidebar - Data Management */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                  <ComponentErrorBoundary>
                    <FileUpload onDataParsed={handleDataParsed} />
                  </ComponentErrorBoundary>
                  
                  <ComponentErrorBoundary>
                    <ProjectManager
                      currentData={uploadedData}
                      currentConfig={chartConfig}
                      onLoadProject={handleLoadProject}
                    />
                  </ComponentErrorBoundary>
                </div>
                
                {/* Main Content Area */}
                <div className="col-span-12 lg:col-span-9 space-y-6">
                  {/* Top Row - Chart */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                      <ComponentErrorBoundary>
                        <ChartCanvas
                          data={uploadedData}
                          chartType={chartType}
                          config={chartConfig}
                        />
                      </ComponentErrorBoundary>
                    </div>
                    <div className="xl:col-span-1">
                      <ComponentErrorBoundary>
                        <ChartConfig
                          data={uploadedData}
                          onChartTypeChange={handleChartTypeChange}
                          onConfigChange={handleConfigChange}
                        />
                      </ComponentErrorBoundary>
                    </div>
                  </div>
                  
                  {/* Bottom Row - Data Tools */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ComponentErrorBoundary>
                      <DataPreview data={uploadedData} />
                    </ComponentErrorBoundary>
                    {uploadedData && (
                      <ComponentErrorBoundary>
                        <DataTransform
                          data={uploadedData}
                          onDataTransform={(transformedData) => {
                            setUploadedData(transformedData)
                          }}
                        />
                      </ComponentErrorBoundary>
                    )}
                  </div>
                </div>
              </div>
            </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Header onHomeClick={handleHomeClick} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
              <Shield className="h-4 w-4 mr-2" />
              Privacy-First Data Visualization
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Visualize Your Data
              <span className="block text-primary-600 dark:text-primary-400">Instantly & Privately</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Upload your files and create beautiful charts in seconds. Everything stays in your browser - 
              your data never leaves your device.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => setShowApp(true)}
                className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload & Visualize Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              
              <button 
                onClick={() => setShowHowItWorks(true)}
                className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                How does this work?
              </button>
            </div>
            
            {/* Quick Upload Demo */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Try it right here
              </h3>
              <FileUpload onDataParsed={handleDataParsed} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose Datuum 2.0?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Built for the modern web with privacy and performance in mind
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Privacy-First
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your data never leaves your browser. Everything processes locally for complete privacy.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Instant Results
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Upload any CSV, JSON, or Excel file and get visualizations in seconds.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                  <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Smart Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Intelligent suggestions help you choose the perfect chart type for your data.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
                  <Download className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Export & Share
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Download your charts as PNG, PDF, or SVG. Share with confidence.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Setup Required
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Just open your browser and start visualizing. No accounts, no installations.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                  <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Multiple Chart Types
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Line charts, bar charts, pie charts, scatter plots, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Three simple steps to beautiful visualizations
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Upload Your Data
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Drag and drop your CSV, JSON, or Excel files. We support all common data formats.
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Choose Chart Type
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get intelligent recommendations or manually select the perfect chart for your data.
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Export & Share
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Download your charts in high quality or share them directly with your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-700">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Visualize Your Data?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Start creating beautiful charts in seconds. No signup required.
            </p>
            <button
              onClick={() => setShowApp(true)}
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Get Started Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Modal */}
      <HowItWorksModal 
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
    </main>
  )
}
