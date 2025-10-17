'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, Download, Eye, EyeOff, ChevronLeft, ChevronRight, BarChart3, Hash, Calendar, Type } from 'lucide-react'

interface DataPreviewProps {
  data?: any
  onDataTransform?: (transformedData: any) => void
}

export function DataPreview({ data, onDataTransform }: DataPreviewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Initialize visible columns when data changes
  useMemo(() => {
    if (data?.headers && visibleColumns.size === 0) {
      setVisibleColumns(new Set(data.headers))
    }
  }, [data?.headers, visibleColumns.size])

  const filteredAndSortedData = useMemo(() => {
    if (!data?.rows) return []

    let filtered = data.rows

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((row: string[]) =>
        row.some(cell => cell.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply sorting
    if (sortConfig) {
      const columnIndex = data.headers.indexOf(sortConfig.key)
      if (columnIndex !== -1) {
        filtered = [...filtered].sort((a, b) => {
          const aVal = a[columnIndex] || ''
          const bVal = b[columnIndex] || ''
          
          if (sortConfig.direction === 'asc') {
            return aVal.localeCompare(bVal)
          } else {
            return bVal.localeCompare(aVal)
          }
        })
      }
    }

    return filtered
  }, [data?.rows, data?.headers, searchTerm, sortConfig])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  const getColumnType = (columnIndex: number) => {
    if (!data?.rows) return 'string'
    
    const values = data.rows
      .map((row: any) => row[columnIndex])
      .filter((val: any) => val && val.trim())
      .slice(0, 100) // Sample first 100 values
    
    if (values.length === 0) return 'string'
    
    // Enhanced type detection
    const numericCount = values.filter((val: any) => !isNaN(Number(val)) && val !== '').length
    const booleanCount = values.filter((val: any) => 
      /^(true|false|yes|no|y|n|1|0)$/i.test(val.trim())
    ).length
    
    // Enhanced date detection - multiple formats
    const dateCount = values.filter((val: any) => {
      const str = val.toString().trim()
      return (
        // ISO format: 2023-12-25
        /^\d{4}-\d{2}-\d{2}/.test(str) ||
        // US format: 12/25/2023
        /^\d{1,2}\/\d{1,2}\/\d{4}/.test(str) ||
        // EU format: 25/12/2023
        /^\d{1,2}\/\d{1,2}\/\d{4}/.test(str) ||
        // Long format: Dec 25, 2023
        /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/.test(str) ||
        // Timestamp: 2023-12-25T10:30:00
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)
      )
    }).length
    
    // Categorical detection - limited unique values
    const uniqueValues = new Set(values.map((val: any) => val.toString().toLowerCase()))
    const isCategorical = uniqueValues.size <= Math.min(10, values.length * 0.5)
    
    // Type priority: boolean > date > number > categorical > string
    if (booleanCount / values.length > 0.8) return 'boolean'
    if (dateCount / values.length > 0.7) return 'date'
    if (numericCount / values.length > 0.8) return 'number'
    if (isCategorical) return 'categorical'
    return 'string'
  }

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash className="h-3 w-3" />
      case 'date': return <Calendar className="h-3 w-3" />
      case 'boolean': return <div className="h-3 w-3 rounded-full bg-orange-500" />
      case 'categorical': return <div className="h-3 w-3 rounded bg-purple-500" />
      default: return <Type className="h-3 w-3" />
    }
  }

  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.key === column) {
        return prev.direction === 'asc' 
          ? { key: column, direction: 'desc' }
          : null
      }
      return { key: column, direction: 'asc' }
    })
  }

  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(column)) {
        newSet.delete(column)
      } else {
        newSet.add(column)
      }
      return newSet
    })
  }

  const exportData = (format: 'csv' | 'json') => {
    if (!data) return

    const visibleHeaders = data.headers.filter((h: string) => visibleColumns.has(h))
    const visibleRows = paginatedData.map((row: any) => 
      data.headers.map((h: string, i: number) => 
        visibleColumns.has(h) ? row[i] : null
      ).filter(Boolean)
    )

    if (format === 'csv') {
      const csvContent = [
        visibleHeaders.join(','),
        ...visibleRows.map((row: any) => row.join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'data.csv'
      link.click()
      URL.revokeObjectURL(url)
    } else {
      const jsonData = visibleRows.map((row: any) => {
        const obj: any = {}
        visibleHeaders.forEach((header: any, i: number) => {
          obj[header] = row[i]
        })
        return obj
      })
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'data.json'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Preview
        </h2>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No data to preview</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Upload a file to get started</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Data Preview
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportData('csv')}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportData('json')}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Download className="h-4 w-4" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {data.metadata?.rowCount || 0}
          </div>
          <div className="text-sm text-primary-700 dark:text-primary-300">Total Rows</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.metadata?.columnCount || 0}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Columns</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {filteredAndSortedData.length}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Filtered Rows</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {data.metadata?.format || 'Unknown'}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Format</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      {/* Column Visibility Controls */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {data.headers.map((header: string, index: number) => {
            const type = getColumnType(index)
            const isVisible = visibleColumns.has(header)
            return (
              <button
                key={header}
                onClick={() => toggleColumnVisibility(header)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  isVisible
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {getColumnIcon(type)}
                <span>{header}</span>
                {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              {data.headers.map((header: string, index: number) => {
                const type = getColumnType(index)
                const isVisible = visibleColumns.has(header)
                if (!isVisible) return null
                
                return (
                  <th
                    key={header}
                    className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center space-x-2">
                      {getColumnIcon(type)}
                      <span>{header}</span>
                      {sortConfig?.key === header && (
                        <span className="text-primary-500">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row: string[], rowIndex: number) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {data.headers.map((header: string, colIndex: number) => {
                  const isVisible = visibleColumns.has(header)
                  if (!isVisible) return null
                  
                  return (
                    <td key={colIndex} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {row[colIndex] || '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
