'use client'

import { useState, useCallback, useId } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Database, Sparkles, Clipboard } from 'lucide-react'
import { SAMPLE_DATASETS, getSampleDataset } from '@/lib/sample-data'
import { LoadingButton, LoadingSpinner } from './LoadingStates'
import { ariaLabels, announceToScreenReader } from '@/lib/accessibility'

interface FileUploadProps {
  onDataParsed?: (data: any) => void
}

export function FileUpload({ onDataParsed }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null)
  const [showSampleData, setShowSampleData] = useState(false)
  const [showPasteData, setShowPasteData] = useState(false)
  const [pastedData, setPastedData] = useState('')
  
  // Generate unique IDs for accessibility using React's useId hook (SSR-safe)
  const uniqueId = useId()
  const fileInputId = `file-upload-${uniqueId}`
  const dropzoneId = `dropzone-${uniqueId}`
  const pasteTextareaId = `paste-textarea-${uniqueId}`

  const parseFileContent = useCallback(async (content: string, mimeType: string) => {
    // Parse using TypeScript modules
    // Using native TypeScript data processing modules
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time
    
    if (mimeType.includes('csv') || content.includes(',')) {
      return parseCSV(content)
    } else if (mimeType.includes('json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return parseJSON(content)
    } else {
      throw new Error('Unsupported file format')
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file) return

    setIsProcessing(true)
    setUploadStatus('idle')
    setErrorMessage('')
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type
    })

    try {
      const content = await readFileContent(file)
      const parsedData = await parseFileContent(content, file.type)
      
      setUploadStatus('success')
      announceToScreenReader('File uploaded successfully')
      onDataParsed?.(parsedData)
    } catch (error) {
      setUploadStatus('error')
      const errorMsg = error instanceof Error ? error.message : 'Failed to process file'
      
      // Provide more helpful error messages
      if (errorMsg.includes('Empty CSV file')) {
        setErrorMessage('The CSV file appears to be empty. Please check your file and try again.')
      } else if (errorMsg.includes('Invalid JSON')) {
        setErrorMessage('The JSON file format is invalid. Please ensure it\'s a valid JSON array or object.')
      } else if (errorMsg.includes('Unsupported file format')) {
        setErrorMessage('File format not supported. Please use CSV, JSON, or XLSX files.')
      } else if (errorMsg.includes('Failed to read file')) {
        setErrorMessage('Could not read the file. Please check if the file is corrupted or try a different file.')
      } else {
        setErrorMessage(`Failed to process file: ${errorMsg}. Please check your file format and try again.`)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [onDataParsed, parseFileContent])

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }


  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length === 0) throw new Error('Empty CSV file')
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim())
    )
    
    return {
      headers,
      rows,
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
        format: 'CSV'
      }
    }
  }

  const parseJSON = (content: string) => {
    try {
      const data = JSON.parse(content)
      if (!Array.isArray(data)) throw new Error('JSON must be an array of objects')
      
      if (data.length === 0) throw new Error('Empty JSON array')
      
      const headers = Object.keys(data[0])
      const rows = data.map(obj => headers.map(key => String(obj[key] || '')))
      
      return {
        headers,
        rows,
        metadata: {
          rowCount: rows.length,
          columnCount: headers.length,
          format: 'JSON'
        }
      }
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleSampleData = (dataset: any) => {
    setUploadStatus('success')
    setFileInfo({
      name: `${dataset.name}.csv`,
      size: JSON.stringify(dataset.data).length,
      type: 'text/csv'
    })
    onDataParsed?.(dataset.data)
  }

  const handlePasteData = useCallback(async () => {
    if (!pastedData.trim()) return

    setIsProcessing(true)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      // Try to parse as JSON first
      let parsedData
      try {
        parsedData = JSON.parse(pastedData)
      } catch {
        // If not JSON, try to parse as CSV/TSV
        parsedData = parsePastedData(pastedData)
      }

      setUploadStatus('success')
      setFileInfo({
        name: 'pasted-data.txt',
        size: pastedData.length,
        type: 'text/plain'
      })
      onDataParsed?.(parsedData)
      setShowPasteData(false)
      setPastedData('')
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse pasted data')
    } finally {
      setIsProcessing(false)
    }
  }, [pastedData, onDataParsed])

  const parsePastedData = (data: string) => {
    const lines = data.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('Data must have at least 2 lines (header + data)')
    }

    // Detect delimiter
    const firstLine = lines[0]
    const delimiter = firstLine.includes('\t') ? '\t' : 
                     firstLine.includes(',') ? ',' : 
                     firstLine.includes(';') ? ';' : ' '

    const headers = firstLine.split(delimiter).map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      return row
    })

    return {
      headers,
      rows,
      delimiter,
      totalRows: rows.length
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Upload Data
      </h2>
      
      <div
        id={dropzoneId}
        role="button"
        tabIndex={0}
        aria-label={ariaLabels.fileUpload.dropzone}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(fileInputId)?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            document.getElementById(fileInputId)?.click()
          }
        }}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {isProcessing ? 'Processing...' : 'Drop your file here'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or click to browse
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Supports CSV, JSON, XLSX files
          </p>
        </div>

        <input
          type="file"
          accept=".csv,.json,.xlsx"
          onChange={handleFileInput}
          className="hidden"
          id={fileInputId}
          disabled={isProcessing}
          aria-label={ariaLabels.fileUpload.input}
        />
        
        <LoadingButton
          isLoading={isProcessing}
          loadingText="Processing..."
          className={`mt-4 inline-block px-4 py-2 rounded-lg font-medium transition-colors ${
            isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 cursor-pointer'
          }`}
          onClick={() => document.getElementById(fileInputId)?.click()}
        >
          Choose File
        </LoadingButton>
      </div>

      {/* Alternative Input Methods */}
      <div className="mt-4 flex gap-2 justify-center">
        <button
          onClick={() => setShowPasteData(!showPasteData)}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Clipboard className="h-4 w-4" />
          <span>Paste Data</span>
        </button>
      </div>

      {/* Paste Data Section */}
      {showPasteData && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Paste Your Data
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Paste CSV, TSV, or JSON data directly. First line should contain headers.
          </p>
          <textarea
            id={pasteTextareaId}
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="Name,Age,City&#10;John,25,New York&#10;Jane,30,Los Angeles"
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm font-mono"
            aria-label="Paste data text area"
            aria-describedby="paste-instructions"
          />
          <div id="paste-instructions" className="sr-only">
            Paste CSV, TSV, or JSON data directly. First line should contain headers.
          </div>
          <div className="mt-3 flex gap-2">
            <LoadingButton
              onClick={handlePasteData}
              isLoading={isProcessing}
              loadingText="Processing..."
              disabled={!pastedData.trim() || isProcessing}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Parse Data
            </LoadingButton>
            <button
              onClick={() => {
                setShowPasteData(false)
                setPastedData('')
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sample Data Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Try Sample Data
          </h3>
          <button
            onClick={() => setShowSampleData(!showSampleData)}
            className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <Sparkles className="h-4 w-4" />
            <span>{showSampleData ? 'Hide' : 'Show'} Samples</span>
          </button>
        </div>

        {showSampleData && (
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {SAMPLE_DATASETS.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => handleSampleData(dataset)}
                className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Database className="h-4 w-4 text-primary-500" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {dataset.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {dataset.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{dataset.data.metadata.rowCount} rows</span>
                      <span>{dataset.data.metadata.columnCount} columns</span>
                      <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                        {dataset.category}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {uploadStatus === 'success' && fileInfo && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                File uploaded successfully
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Upload failed
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
