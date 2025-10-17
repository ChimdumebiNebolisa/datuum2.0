'use client'

import { useState, useEffect, useCallback } from 'react'
import { Filter, SortAsc, SortDesc, Edit3, Trash2, Plus, X, Check, RotateCcw } from 'lucide-react'

interface DataTransformProps {
  data?: any
  onDataTransform?: (transformedData: any) => void
}

interface FilterRule {
  id: string
  column: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'not_empty'
  value: string
}

interface SortRule {
  id: string
  column: string
  direction: 'asc' | 'desc'
}

interface RenameRule {
  id: string
  oldName: string
  newName: string
}

export function DataTransform({ data, onDataTransform }: DataTransformProps) {
  const [transformedData, setTransformedData] = useState(data)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sorts, setSorts] = useState<SortRule[]>([])
  const [renames, setRenames] = useState<RenameRule[]>([])
  const [showAddFilter, setShowAddFilter] = useState(false)
  const [showAddSort, setShowAddSort] = useState(false)
  const [showAddRename, setShowAddRename] = useState(false)
  const [newFilter, setNewFilter] = useState<Partial<FilterRule>>({})
  const [newSort, setNewSort] = useState<Partial<SortRule>>({})
  const [newRename, setNewRename] = useState<Partial<RenameRule>>({})

  const applyTransformations = useCallback(() => {
    if (!data) return

    let result = { ...data }

    // Apply renames
    if (renames.length > 0) {
      const renameMap = new Map(renames.map(r => [r.oldName, r.newName]))
      result.headers = result.headers.map((h: string) => renameMap.get(h) || h)
    }

    // Apply filters
    if (filters.length > 0) {
      result.rows = result.rows.filter((row: string[]) => {
        return filters.every(filter => {
          const columnIndex = result.headers.indexOf(filter.column)
          if (columnIndex === -1) return true

          const cellValue = row[columnIndex] || ''
          const filterValue = filter.value

          switch (filter.operator) {
            case 'equals':
              return cellValue === filterValue
            case 'contains':
              return cellValue.toLowerCase().includes(filterValue.toLowerCase())
            case 'greater':
              return parseFloat(cellValue) > parseFloat(filterValue)
            case 'less':
              return parseFloat(cellValue) < parseFloat(filterValue)
            case 'not_empty':
              return cellValue.trim() !== ''
            default:
              return true
          }
        })
      })
    }

    // Apply sorts
    if (sorts.length > 0) {
      result.rows = [...result.rows].sort((a, b) => {
        for (const sort of sorts) {
          const columnIndex = result.headers.indexOf(sort.column)
          if (columnIndex === -1) continue

          const aVal = a[columnIndex] || ''
          const bVal = b[columnIndex] || ''

          let comparison = 0
          if (isNumeric(aVal) && isNumeric(bVal)) {
            comparison = parseFloat(aVal) - parseFloat(bVal)
          } else {
            comparison = aVal.localeCompare(bVal)
          }

          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison
          }
        }
        return 0
      })
    }

    // Update metadata
    result.metadata = {
      ...result.metadata,
      rowCount: result.rows.length
    }

    setTransformedData(result)
    onDataTransform?.(result)
  }, [data, filters, sorts, renames, onDataTransform])

  useEffect(() => {
    if (data) {
      setTransformedData(data)
      applyTransformations()
    }
  }, [data, filters, sorts, renames, applyTransformations])

  const isNumeric = (str: string): boolean => {
    return !isNaN(parseFloat(str)) && isFinite(parseFloat(str))
  }

  const addFilter = () => {
    if (newFilter.column && newFilter.operator && newFilter.value !== undefined) {
      const filter: FilterRule = {
        id: Date.now().toString(),
        column: newFilter.column,
        operator: newFilter.operator as any,
        value: newFilter.value
      }
      setFilters([...filters, filter])
      setNewFilter({})
      setShowAddFilter(false)
    }
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const addSort = () => {
    if (newSort.column && newSort.direction) {
      const sort: SortRule = {
        id: Date.now().toString(),
        column: newSort.column,
        direction: newSort.direction as any
      }
      setSorts([...sorts, sort])
      setNewSort({})
      setShowAddSort(false)
    }
  }

  const removeSort = (id: string) => {
    setSorts(sorts.filter(s => s.id !== id))
  }

  const addRename = () => {
    if (newRename.oldName && newRename.newName) {
      const rename: RenameRule = {
        id: Date.now().toString(),
        oldName: newRename.oldName,
        newName: newRename.newName
      }
      setRenames([...renames, rename])
      setNewRename({})
      setShowAddRename(false)
    }
  }

  const removeRename = (id: string) => {
    setRenames(renames.filter(r => r.id !== id))
  }

  const resetTransformations = () => {
    setFilters([])
    setSorts([])
    setRenames([])
    setTransformedData(data)
    onDataTransform?.(data)
  }

  const getAvailableColumns = () => {
    if (!data?.headers) return []
    return data.headers.map((header: string) => ({
      value: header,
      label: header
    }))
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Transform
        </h2>
        <div className="text-center py-8">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No data to transform</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload a file to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Data Transform
        </h2>
        <button
          onClick={resetTransformations}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h3>
          <button
            onClick={() => setShowAddFilter(!showAddFilter)}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <Plus className="h-4 w-4" />
            <span>Add Filter</span>
          </button>
        </div>

        {showAddFilter && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select
                value={newFilter.column || ''}
                onChange={(e) => setNewFilter({ ...newFilter, column: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              >
                <option value="">Select column</option>
                 {getAvailableColumns().map((col: any) => (
                  <option key={col.value} value={col.value}>{col.label}</option>
                ))}
              </select>

              <select
                value={newFilter.operator || ''}
                onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              >
                <option value="">Operator</option>
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="greater">Greater than</option>
                <option value="less">Less than</option>
                <option value="not_empty">Not empty</option>
              </select>

              <input
                type="text"
                value={newFilter.value || ''}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                placeholder="Value"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              />

              <div className="flex space-x-1">
                <button
                  onClick={addFilter}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowAddFilter(false)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filters.map(filter => (
            <div key={filter.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {filter.column} {filter.operator} "{filter.value}"
              </span>
              <button
                onClick={() => removeFilter(filter.id)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sorts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort</h3>
          <button
            onClick={() => setShowAddSort(!showAddSort)}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <Plus className="h-4 w-4" />
            <span>Add Sort</span>
          </button>
        </div>

        {showAddSort && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={newSort.column || ''}
                onChange={(e) => setNewSort({ ...newSort, column: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              >
                <option value="">Select column</option>
                 {getAvailableColumns().map((col: any) => (
                  <option key={col.value} value={col.value}>{col.label}</option>
                ))}
              </select>

              <select
                value={newSort.direction || ''}
                onChange={(e) => setNewSort({ ...newSort, direction: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              >
                <option value="">Direction</option>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>

              <div className="flex space-x-1">
                <button
                  onClick={addSort}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowAddSort(false)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sorts.map(sort => (
            <div key={sort.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                {sort.direction === 'asc' ? (
                  <SortAsc className="h-4 w-4 text-gray-500" />
                ) : (
                  <SortDesc className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {sort.column} ({sort.direction})
                </span>
              </div>
              <button
                onClick={() => removeSort(sort.id)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rename Columns */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Rename Columns</h3>
          <button
            onClick={() => setShowAddRename(!showAddRename)}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <Plus className="h-4 w-4" />
            <span>Rename</span>
          </button>
        </div>

        {showAddRename && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={newRename.oldName || ''}
                onChange={(e) => setNewRename({ ...newRename, oldName: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              >
                <option value="">Select column</option>
                 {getAvailableColumns().map((col: any) => (
                  <option key={col.value} value={col.value}>{col.label}</option>
                ))}
              </select>

              <input
                type="text"
                value={newRename.newName || ''}
                onChange={(e) => setNewRename({ ...newRename, newName: e.target.value })}
                placeholder="New name"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              />

              <div className="flex space-x-1">
                <button
                  onClick={addRename}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowAddRename(false)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {renames.map(rename => (
            <div key={rename.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {rename.oldName} → {rename.newName}
                </span>
              </div>
              <button
                onClick={() => removeRename(rename.id)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transform Summary */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Transform Summary:</strong>
          <ul className="mt-1 space-y-1">
            <li>• {filters.length} filter(s) applied</li>
            <li>• {sorts.length} sort rule(s) applied</li>
            <li>• {renames.length} column(s) renamed</li>
            <li>• {transformedData?.rows?.length || 0} rows after transformation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
