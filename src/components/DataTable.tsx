'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Plus,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: any[];
  columns: string[];
  onDataChange?: (_newData: any[]) => void;
  className?: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  column: string;
  value: string;
  type: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
}

interface EditableCell {
  rowIndex: number;
  columnKey: string;
}

export function DataTable({ data, columns, onDataChange, className }: DataTableProps) {
  const [localData, setLocalData] = useState<any[]>(data);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...localData];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(row =>
        visibleColumns.some(col => 
          String(row[col] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    filters.forEach(filter => {
      filtered = filtered.filter(row => {
        const value = String(row[filter.column] || '').toLowerCase();
        const filterValue = filter.value.toLowerCase();

        switch (filter.type) {
          case 'contains':
            return value.includes(filterValue);
          case 'equals':
            return value === filterValue;
          case 'startsWith':
            return value.startsWith(filterValue);
          case 'endsWith':
            return value.endsWith(filterValue);
          case 'greaterThan':
            return Number(value) > Number(filterValue);
          case 'lessThan':
            return Number(value) < Number(filterValue);
          default:
            return true;
        }
      });
    });

    return filtered;
  }, [localData, searchTerm, filters, visibleColumns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (column: string) => {
    if (sortConfig?.column === column) {
      setSortConfig(sortConfig.direction === 'asc' ? 
        { column, direction: 'desc' } : null
      );
    } else {
      setSortConfig({ column, direction: 'asc' });
    }
  };

  const handleEditCell = (rowIndex: number, columnKey: string, value: any) => {
    const newData = [...localData];
    const actualIndex = localData.findIndex((_, idx) => 
      filteredData.includes(localData[idx]) && 
      filteredData.indexOf(localData[idx]) === rowIndex
    );
    
    if (actualIndex !== -1) {
      newData[actualIndex] = { ...newData[actualIndex], [columnKey]: value };
      setLocalData(newData);
      onDataChange?.(newData);
    }
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = localData.filter((_, idx) => idx !== rowIndex);
    setLocalData(newData);
    onDataChange?.(newData);
  };

  const handleAddRow = () => {
    const newRow = columns.reduce((acc, col) => {
      acc[col] = '';
      return acc;
    }, {} as any);
    
    const newData = [...localData, newRow];
    setLocalData(newData);
    onDataChange?.(newData);
  };

  const handleDeleteSelected = () => {
    const indicesToDelete = Array.from(selectedRows).sort((a, b) => b - a);
    const newData = localData.filter((_, idx) => !indicesToDelete.includes(idx));
    setLocalData(newData);
    onDataChange?.(newData);
    setSelectedRows(new Set());
  };

  const addFilter = () => {
    setFilters([...filters, { column: columns[0], value: '', type: 'contains' }]);
  };

  const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const exportData = () => {
    const csvContent = [
      visibleColumns.join(','),
      ...localData.map(row => 
        visibleColumns.map(col => `"${String(row[col] || '')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (column: string) => {
    if (sortConfig?.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const renderCell = (row: any, rowIndex: number, columnKey: string) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === columnKey;
    const value = row[columnKey];

    if (isEditing) {
      return (
        <Input
          value={value || ''}
          onChange={(e) => handleEditCell(rowIndex, columnKey, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingCell(null);
            }
            if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className="h-8 w-full"
          autoFocus
        />
      );
    }

    return (
      <div 
        className="flex items-center gap-2 min-h-[32px] px-2 py-1 cursor-pointer hover:bg-muted/50 rounded"
        onClick={() => setEditingCell({ rowIndex, columnKey })}
        title="Click to edit"
        role="button"
        tabIndex={0}
        aria-label={`Edit cell ${columnKey} in row ${rowIndex + 1}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setEditingCell({ rowIndex, columnKey });
          }
        }}
      >
        <span className="truncate">{String(value || '')}</span>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Data Table
            </CardTitle>
            <CardDescription>
              {localData.length} rows × {columns.length} columns
              {filteredData.length !== localData.length && (
                <span className="text-primary ml-2">
                  ({filteredData.length} filtered)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters panel">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={exportData} aria-label="Export data to CSV">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleAddRow} aria-label="Add new row to table">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          
          {selectedRows.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} aria-label={`Delete ${selectedRows.size} selected rows`}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedRows.size})
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              <Button variant="outline" size="sm" onClick={addFilter} aria-label="Add new filter">
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </div>
            
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select 
                  value={filter.column} 
                  onValueChange={(value) => updateFilter(index, { column: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filter.type} 
                  onValueChange={(value: any) => updateFilter(index, { type: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="startsWith">Starts with</SelectItem>
                    <SelectItem value="endsWith">Ends with</SelectItem>
                    <SelectItem value="greaterThan">Greater than</SelectItem>
                    <SelectItem value="lessThan">Less than</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(index, { value: e.target.value })}
                  placeholder="Filter value"
                  className="flex-1"
                />
                
                <Button variant="outline" size="sm" onClick={() => removeFilter(index)} aria-label={`Remove filter ${index + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Column Visibility */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Columns:</span>
          {columns.map(col => (
            <Badge 
              key={col}
              variant={visibleColumns.includes(col) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleColumnVisibility(col)}
              role="button"
              tabIndex={0}
              aria-label={`${visibleColumns.includes(col) ? 'Hide' : 'Show'} column ${col}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleColumnVisibility(col);
                }
              }}
            >
              {visibleColumns.includes(col) ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              {col}
            </Badge>
          ))}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="w-12 p-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(paginatedData.map((_, idx) => idx)));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                    />
                  </th>
                  {visibleColumns.map(col => (
                    <th key={col} className="p-2 text-left">
                      <button
                        className="flex items-center gap-2 hover:bg-muted/80 p-1 rounded"
                        onClick={() => handleSort(col)}
                        aria-label={`Sort by ${col}`}
                        title={`Sort by ${col}`}
                      >
                        <span className="font-medium">{col}</span>
                        {renderSortIcon(col)}
                      </button>
                    </th>
                  ))}
                  <th className="w-16 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={cn(
                    "border-t hover:bg-muted/50",
                    selectedRows.has(rowIndex) && "bg-primary/10"
                  )}>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedRows);
                          if (e.target.checked) {
                            newSelected.add(rowIndex);
                          } else {
                            newSelected.delete(rowIndex);
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </td>
                    {visibleColumns.map(col => (
                      <td key={col} className="p-1">
                        {renderCell(row, rowIndex, col)}
                      </td>
                    ))}
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(rowIndex)}
                        aria-label={`Delete row ${rowIndex + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
