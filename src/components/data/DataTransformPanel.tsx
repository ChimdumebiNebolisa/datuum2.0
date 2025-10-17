'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Filter,
  SortAsc,
  Copy,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DataTransformPanelProps {
  data: any[];
  columns: string[];
  onDataChange: (newData: any[]) => void;
  className?: string;
}

interface TransformOperation {
  id: string;
  type: 'add_row' | 'add_column' | 'delete_row' | 'delete_column' | 'rename_column' | 'change_type' | 'fill_missing' | 'remove_duplicates' | 'filter' | 'sort';
  params: Record<string, any>;
  timestamp: number;
}

export function DataTransformPanel({ data, columns, onDataChange, className }: DataTransformPanelProps) {
  const [operations, setOperations] = useState<TransformOperation[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('string');
  const [newColumnDefault, setNewColumnDefault] = useState('');
  const [renameColumn, setRenameColumn] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [fillMissingColumn, setFillMissingColumn] = useState('');
  const [fillMissingMethod, setFillMissingMethod] = useState('mean');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState('equals');
  const [filterValue, setFilterValue] = useState('');
  const [sortColumns, setSortColumns] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const addOperation = (operation: TransformOperation) => {
    setOperations(prev => [...prev, operation]);
  };

  const executeOperation = (operation: TransformOperation) => {
    let newData = [...data];
    let newColumns = [...columns];

    switch (operation.type) {
      case 'add_row':
        const newRow = columns.reduce((acc, col) => {
          acc[col] = '';
          return acc;
        }, {} as any);
        newData = [...newData, newRow];
        break;

      case 'add_column':
        newColumns.push(operation.params.name);
        newData = newData.map(row => ({
          ...row,
          [operation.params.name]: operation.params.defaultValue || ''
        }));
        break;

      case 'delete_column':
        newColumns = newColumns.filter(col => col !== operation.params.column);
        newData = newData.map(row => {
          const { [operation.params.column]: removed, ...rest } = row;
          return rest;
        });
        break;

      case 'rename_column':
        newColumns = newColumns.map(col => 
          col === operation.params.oldName ? operation.params.newName : col
        );
        newData = newData.map(row => {
          const { [operation.params.oldName]: value, ...rest } = row;
          return { ...rest, [operation.params.newName]: value };
        });
        break;

      case 'fill_missing':
        newData = newData.map(row => {
          if (row[operation.params.column] === null || row[operation.params.column] === undefined || row[operation.params.column] === '') {
            let fillValue = operation.params.value;
            
            if (operation.params.method === 'mean') {
              const numericValues = newData
                .map(r => r[operation.params.column])
                .filter(v => typeof v === 'number' && !isNaN(v));
              fillValue = numericValues.length > 0 ? 
                numericValues.reduce((a, b) => a + b, 0) / numericValues.length : '';
            } else if (operation.params.method === 'median') {
              const numericValues = newData
                .map(r => r[operation.params.column])
                .filter(v => typeof v === 'number' && !isNaN(v))
                .sort((a, b) => a - b);
              fillValue = numericValues.length > 0 ? 
                numericValues[Math.floor(numericValues.length / 2)] : '';
            } else if (operation.params.method === 'mode') {
              const values = newData
                .map(r => r[operation.params.column])
                .filter(v => v !== null && v !== undefined && v !== '');
              const counts = values.reduce((acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              fillValue = Object.keys(counts).reduce((a, b) => 
                counts[a] > counts[b] ? a : b, Object.keys(counts)[0] || ''
              );
            }
            
            return { ...row, [operation.params.column]: fillValue };
          }
          return row;
        });
        break;

      case 'remove_duplicates':
        const seen = new Set();
        newData = newData.filter(row => {
          const key = JSON.stringify(row);
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
        break;

      case 'filter':
        newData = newData.filter(row => {
          const value = row[operation.params.column];
          const filterValue = operation.params.value;

          switch (operation.params.operator) {
            case 'equals':
              return String(value) === String(filterValue);
            case 'not_equals':
              return String(value) !== String(filterValue);
            case 'contains':
              return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'greater_than':
              return Number(value) > Number(filterValue);
            case 'less_than':
              return Number(value) < Number(filterValue);
            case 'is_empty':
              return value === null || value === undefined || value === '';
            case 'is_not_empty':
              return value !== null && value !== undefined && value !== '';
            default:
              return true;
          }
        });
        break;

      case 'sort':
        newData = [...newData].sort((a, b) => {
          for (const col of operation.params.columns) {
            const aVal = a[col];
            const bVal = b[col];
            
            if (aVal < bVal) return operation.params.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return operation.params.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
        break;
    }

    onDataChange(newData);
    addOperation(operation);
  };

  const addRow = () => {
    executeOperation({
      id: Date.now().toString(),
      type: 'add_row',
      params: {},
      timestamp: Date.now()
    });
  };

  const addColumn = () => {
    if (!newColumnName.trim()) return;
    
    executeOperation({
      id: Date.now().toString(),
      type: 'add_column',
      params: {
        name: newColumnName,
        type: newColumnType,
        defaultValue: newColumnDefault
      },
      timestamp: Date.now()
    });
    
    setNewColumnName('');
    setNewColumnDefault('');
  };

  const deleteColumn = (column: string) => {
    executeOperation({
      id: Date.now().toString(),
      type: 'delete_column',
      params: { column },
      timestamp: Date.now()
    });
  };

  const handleRenameColumn = () => {
    if (!renameColumn || !renameTo.trim()) return;
    
    executeOperation({
      id: Date.now().toString(),
      type: 'rename_column',
      params: {
        oldName: renameColumn,
        newName: renameTo
      },
      timestamp: Date.now()
    });
    
    setRenameColumn('');
    setRenameTo('');
  };

  const fillMissingValues = () => {
    if (!fillMissingColumn) return;
    
    executeOperation({
      id: Date.now().toString(),
      type: 'fill_missing',
      params: {
        column: fillMissingColumn,
        method: fillMissingMethod,
        value: newColumnDefault
      },
      timestamp: Date.now()
    });
  };

  const removeDuplicates = () => {
    executeOperation({
      id: Date.now().toString(),
      type: 'remove_duplicates',
      params: {},
      timestamp: Date.now()
    });
  };

  const applyFilter = () => {
    if (!filterColumn || !filterValue) return;
    
    executeOperation({
      id: Date.now().toString(),
      type: 'filter',
      params: {
        column: filterColumn,
        operator: filterOperator,
        value: filterValue
      },
      timestamp: Date.now()
    });
  };

  const applySort = () => {
    if (sortColumns.length === 0) return;
    
    executeOperation({
      id: Date.now().toString(),
      type: 'sort',
      params: {
        columns: sortColumns,
        direction: sortDirection
      },
      timestamp: Date.now()
    });
  };

  const undoLastOperation = () => {
    if (operations.length > 0) {
      setOperations(prev => prev.slice(0, -1));
      // In a real implementation, you'd revert to the previous state
    }
  };

  const getColumnStats = (column: string) => {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    
    return {
      total: data.length,
      nonNull: values.length,
      nullCount: data.length - values.length,
      isNumeric: numericValues.length > 0,
      uniqueValues: new Set(values).size
    };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Data Transformations
        </CardTitle>
        <CardDescription>
          Add, remove, and modify your data structure
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="structure" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="clean">Clean</TabsTrigger>
            <TabsTrigger value="filter">Filter</TabsTrigger>
            <TabsTrigger value="sort">Sort</TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-6">
            {/* Add Row */}
            <div className="space-y-2">
              <h4 className="font-medium">Add Row</h4>
              <Button onClick={addRow} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Empty Row
              </Button>
            </div>

            {/* Add Column */}
            <div className="space-y-4">
              <h4 className="font-medium">Add Column</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                />
                <Select value={newColumnType} onValueChange={setNewColumnType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Default value"
                  value={newColumnDefault}
                  onChange={(e) => setNewColumnDefault(e.target.value)}
                />
              </div>
              <Button onClick={addColumn} disabled={!newColumnName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>

            {/* Rename Column */}
            <div className="space-y-4">
              <h4 className="font-medium">Rename Column</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={renameColumn} onValueChange={setRenameColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="New name"
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                />
              </div>
              <Button onClick={handleRenameColumn} disabled={!renameColumn || !renameTo.trim()}>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename Column
              </Button>
            </div>

            {/* Delete Column */}
            <div className="space-y-4">
              <h4 className="font-medium">Delete Column</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {columns.map(col => (
                  <Button
                    key={col}
                    variant="outline"
                    size="sm"
                    onClick={() => deleteColumn(col)}
                    className="justify-between"
                  >
                    {col}
                    <Minus className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clean" className="space-y-6">
            {/* Fill Missing Values */}
            <div className="space-y-4">
              <h4 className="font-medium">Fill Missing Values</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={fillMissingColumn} onValueChange={setFillMissingColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={fillMissingMethod} onValueChange={setFillMissingMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mean">Mean</SelectItem>
                    <SelectItem value="median">Median</SelectItem>
                    <SelectItem value="mode">Mode</SelectItem>
                    <SelectItem value="custom">Custom Value</SelectItem>
                  </SelectContent>
                </Select>
                {fillMissingMethod === 'custom' && (
                  <Input
                    placeholder="Custom value"
                    value={newColumnDefault}
                    onChange={(e) => setNewColumnDefault(e.target.value)}
                  />
                )}
              </div>
              <Button onClick={fillMissingValues} disabled={!fillMissingColumn}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Fill Missing Values
              </Button>
            </div>

            {/* Remove Duplicates */}
            <div className="space-y-2">
              <h4 className="font-medium">Remove Duplicates</h4>
              <Button onClick={removeDuplicates} variant="outline" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Duplicate Rows
              </Button>
            </div>

            {/* Column Statistics */}
            <div className="space-y-4">
              <h4 className="font-medium">Column Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns.map(col => {
                  const stats = getColumnStats(col);
                  return (
                    <div key={col} className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">{col}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Non-null:</span>
                          <span>{stats.nonNull}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Null:</span>
                          <span className={stats.nullCount > 0 ? 'text-warning' : 'text-success'}>
                            {stats.nullCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unique:</span>
                          <span>{stats.uniqueValues}</span>
                        </div>
                        {stats.isNumeric && (
                          <Badge variant="secondary" className="text-xs">Numeric</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filter" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Data</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={filterColumn} onValueChange={setFilterColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterOperator} onValueChange={setFilterOperator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater than</SelectItem>
                    <SelectItem value="less_than">Less than</SelectItem>
                    <SelectItem value="is_empty">Is empty</SelectItem>
                    <SelectItem value="is_not_empty">Is not empty</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Filter value"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  disabled={filterOperator === 'is_empty' || filterOperator === 'is_not_empty'}
                />
              </div>
              <Button onClick={applyFilter} disabled={!filterColumn || (!filterValue && filterOperator !== 'is_empty' && filterOperator !== 'is_not_empty')}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filter
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sort" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Sort Data</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort by columns (in order)</label>
                  <div className="space-y-2">
                    {sortColumns.map((col, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="flex-1">{col}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSortColumns(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Select onValueChange={(value) => setSortColumns(prev => [...prev, value])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add column to sort" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.filter(col => !sortColumns.includes(col)).map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort Direction</label>
                  <Select value={sortDirection} onValueChange={(value: any) => setSortDirection(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending (A-Z)</SelectItem>
                      <SelectItem value="desc">Descending (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={applySort} disabled={sortColumns.length === 0}>
                <SortAsc className="h-4 w-4 mr-2" />
                Apply Sort
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Operations History */}
        {operations.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Recent Operations</h4>
              <Button variant="outline" size="sm" onClick={undoLastOperation}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Undo Last
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {operations.slice(-5).reverse().map((op) => (
                <div key={op.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                  <Badge variant="outline" className="text-xs">
                    {op.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(op.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
