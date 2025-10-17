'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowRight,
  Calculator,
  Filter,
  SortAsc,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/lib/toast';
import { safeEvaluate, isValidFormula } from '@/lib/formula-parser';

interface DataTransformPanelProps {
  data: any[];
  columns: string[];
  onDataChange?: (_newData: any[]) => void;
  className?: string;
}

interface TransformOperation {
  id: string;
  type: 'add_column' | 'delete_column' | 'rename_column' | 'change_type' | 'sort' | 'filter' | 'calculate';
  config: any;
  applied: boolean;
}

export function DataTransformPanel({ data, columns, onDataChange, className }: DataTransformPanelProps) {
  const [operations, setOperations] = useState<TransformOperation[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'string' | 'number' | 'boolean'>('string');
  const [newColumnValue, setNewColumnValue] = useState('');
  const [renameColumn, setRenameColumn] = useState('');
  const [newColumnNameValue, setNewColumnNameValue] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterType, setFilterType] = useState<'contains' | 'equals' | 'greater' | 'less'>('contains');
  const [calculateFormula, setCalculateFormula] = useState('');
  const [calculateColumnName, setCalculateColumnName] = useState('');
  const [activeTab, setActiveTab] = useState('add');

  const { toast } = useToast();

  const addColumn = () => {
    if (!newColumnName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a column name",
      });
      return;
    }

    if (columns.includes(newColumnName)) {
      toast({
        title: "Error",
        description: "Column already exists",
      });
      return;
    }

    const operation: TransformOperation = {
      id: Date.now().toString(),
      type: 'add_column',
      config: {
        name: newColumnName,
        type: newColumnType,
        value: newColumnValue
      },
      applied: false
    };

    setOperations([...operations, operation]);
    setNewColumnName('');
    setNewColumnValue('');
  };

  const deleteColumn = (columnName: string) => {
    const operation: TransformOperation = {
      id: Date.now().toString(),
      type: 'delete_column',
      config: { name: columnName },
      applied: false
    };

    setOperations([...operations, operation]);
  };

  const renameColumnOperation = () => {
    if (!renameColumn || !newColumnNameValue.trim()) {
      toast({
        title: "Error",
        description: "Please select a column and enter a new name",
      });
      return;
    }

    if (columns.includes(newColumnNameValue) && renameColumn !== newColumnNameValue) {
      toast({
        title: "Error",
        description: "Column name already exists",
      });
      return;
    }

    const operation: TransformOperation = {
      id: Date.now().toString(),
      type: 'rename_column',
      config: {
        oldName: renameColumn,
        newName: newColumnNameValue
      },
      applied: false
    };

    setOperations([...operations, operation]);
    setRenameColumn('');
    setNewColumnNameValue('');
  };

  const addSortOperation = () => {
    if (!sortColumn) {
      toast({
        title: "Error",
        description: "Please select a column to sort",
      });
      return;
    }

    const operation: TransformOperation = {
      id: Date.now().toString(),
      type: 'sort',
      config: {
        column: sortColumn,
        direction: sortDirection
      },
      applied: false
    };

    setOperations([...operations, operation]);
    setSortColumn('');
  };

  const addFilterOperation = () => {
    if (!filterColumn || !filterValue.trim()) {
      toast({
        title: "Error",
        description: "Please select a column and enter a filter value",
      });
      return;
    }

    const operation: TransformOperation = {
      id: Date.now().toString(),
      type: 'filter',
      config: {
        column: filterColumn,
        value: filterValue,
        type: filterType
      },
      applied: false
    };

    setOperations([...operations, operation]);
    setFilterColumn('');
    setFilterValue('');
  };

  const addCalculateOperation = () => {
    if (!calculateFormula.trim() || !calculateColumnName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a formula and column name",
      });
      return;
    }

    const operation: TransformOperation = {
      id: Date.now().toString(),
      type: 'calculate',
      config: {
        formula: calculateFormula,
        columnName: calculateColumnName
      },
      applied: false
    };

    setOperations([...operations, operation]);
    setCalculateFormula('');
    setCalculateColumnName('');
  };

  const applyOperations = () => {
    let newData = [...data];
    let newColumns = [...columns];

    operations.forEach(operation => {
      if (operation.applied) return;

      switch (operation.type) {
        case 'add_column':
          const { name, type, value } = operation.config;
          newData = newData.map(row => ({
            ...row,
            [name]: type === 'number' ? Number(value) : 
                   type === 'boolean' ? Boolean(value) : value
          }));
          newColumns.push(name);
          break;

        case 'delete_column':
          const columnToDelete = operation.config.name;
          newData = newData.map(row => {
            const newRow = { ...row };
            delete newRow[columnToDelete];
            return newRow;
          });
          newColumns = newColumns.filter(col => col !== columnToDelete);
          break;

        case 'rename_column':
          const { oldName, newName } = operation.config;
          newData = newData.map(row => {
            const newRow = { ...row };
            newRow[newName] = newRow[oldName];
            delete newRow[oldName];
            return newRow;
          });
          newColumns = newColumns.map(col => col === oldName ? newName : col);
          break;

        case 'sort':
          const { column, direction } = operation.config;
          newData.sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];
            
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return direction === 'asc' ? 1 : -1;
            if (bVal == null) return direction === 'asc' ? -1 : 1;
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            
            if (aStr < bStr) return direction === 'asc' ? -1 : 1;
            if (aStr > bStr) return direction === 'asc' ? 1 : -1;
            return 0;
          });
          break;

        case 'filter':
          const { column: filterCol, value: filterVal, type: filterTypeVal } = operation.config;
          newData = newData.filter(row => {
            const value = String(row[filterCol] || '').toLowerCase();
            const filterValue = filterVal.toLowerCase();

            switch (filterTypeVal) {
              case 'contains':
                return value.includes(filterValue);
              case 'equals':
                return value === filterValue;
              case 'greater':
                return Number(value) > Number(filterValue);
              case 'less':
                return Number(value) < Number(filterValue);
              default:
                return true;
            }
          });
          break;

        case 'calculate':
          // Safe formula evaluation using custom parser
          const { formula, columnName: calcColName } = operation.config;
          try {
            // Validate formula before processing
            if (!isValidFormula(formula)) {
              toast({
                title: "Error",
                description: "Invalid or unsafe formula",
              });
              return;
            }

            newData = newData.map(row => {
              let evalFormula = formula;
              
              // Replace column references with actual values
              columns.forEach(col => {
                const value = row[col];
                const numValue = typeof value === 'number' ? value : 0;
                evalFormula = evalFormula.replace(new RegExp(`\\b${col}\\b`, 'g'), numValue.toString());
              });
              
              // Safe evaluation using custom parser
              const result = safeEvaluate(evalFormula);
              return { ...row, [calcColName]: result };
            });
            newColumns.push(calcColName);
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Invalid formula",
            });
            return;
          }
          break;
      }
    });

    // Mark operations as applied
    setOperations(operations.map(op => ({ ...op, applied: true })));
    
    onDataChange?.(newData);
    
    toast({
      title: "Success",
      description: `Applied ${operations.filter(op => !op.applied).length} operations`,
    });
  };

  const removeOperation = (id: string) => {
    setOperations(operations.filter(op => op.id !== id));
  };

  const clearOperations = () => {
    setOperations([]);
  };

  const renderOperation = (operation: TransformOperation) => {
    const getOperationIcon = (type: string) => {
      switch (type) {
        case 'add_column': return <Plus className="h-4 w-4" />;
        case 'delete_column': return <Trash2 className="h-4 w-4" />;
        case 'rename_column': return <Edit className="h-4 w-4" />;
        case 'sort': return <SortAsc className="h-4 w-4" />;
        case 'filter': return <Filter className="h-4 w-4" />;
        case 'calculate': return <Calculator className="h-4 w-4" />;
        default: return <Settings className="h-4 w-4" />;
      }
    };

    const getOperationDescription = (operation: TransformOperation) => {
      switch (operation.type) {
        case 'add_column':
          return `Add column "${operation.config.name}" (${operation.config.type})`;
        case 'delete_column':
          return `Delete column "${operation.config.name}"`;
        case 'rename_column':
          return `Rename "${operation.config.oldName}" to "${operation.config.newName}"`;
        case 'sort':
          return `Sort by "${operation.config.column}" (${operation.config.direction})`;
        case 'filter':
          return `Filter "${operation.config.column}" ${operation.config.type} "${operation.config.value}"`;
        case 'calculate':
          return `Calculate "${operation.config.columnName}" = ${operation.config.formula}`;
        default:
          return 'Unknown operation';
      }
    };

    return (
      <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          {getOperationIcon(operation.type)}
          <span className="text-sm">{getOperationDescription(operation)}</span>
          {operation.applied && (
            <Badge variant="secondary" className="text-xs">Applied</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeOperation(operation.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Data Transform
            </CardTitle>
            <CardDescription>
              Add, delete, rename columns and apply transformations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearOperations}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button 
              onClick={applyOperations}
              disabled={operations.length === 0 || operations.every(op => op.applied)}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Apply Operations
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="add" className="text-xs sm:text-sm">Add Column</TabsTrigger>
            <TabsTrigger value="modify" className="text-xs sm:text-sm">Modify</TabsTrigger>
            <TabsTrigger value="sort" className="text-xs sm:text-sm">Sort & Filter</TabsTrigger>
            <TabsTrigger value="calculate" className="text-xs sm:text-sm">Calculate</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <Input
                placeholder="Column name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
              />
              <Select value={newColumnType} onValueChange={(value: any) => setNewColumnType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Default value"
                value={newColumnValue}
                onChange={(e) => setNewColumnValue(e.target.value)}
                className="sm:col-span-2 lg:col-span-1"
              />
            </div>
            <Button onClick={addColumn} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </TabsContent>

          <TabsContent value="modify" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Rename Column</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
                    value={newColumnNameValue}
                    onChange={(e) => setNewColumnNameValue(e.target.value)}
                  />
                  <Button onClick={renameColumnOperation} className="sm:col-span-2 lg:col-span-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Delete Column</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {columns.map(col => (
                    <Button
                      key={col}
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteColumn(col)}
                      className="justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="truncate">{col}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sort" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Sort Data</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  <Select value={sortColumn} onValueChange={setSortColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortDirection} onValueChange={(value: any) => setSortDirection(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addSortOperation} className="sm:col-span-2 lg:col-span-1">
                    <SortAsc className="h-4 w-4 mr-2" />
                    Add Sort
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Filter Data</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="greater">Greater than</SelectItem>
                      <SelectItem value="less">Less than</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Filter value"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                  <Button onClick={addFilterOperation}>
                    <Filter className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calculate" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Calculate Column</h4>
                <div className="space-y-4">
                  <Input
                    placeholder="Column name (e.g., total, average)"
                    value={calculateColumnName}
                    onChange={(e) => setCalculateColumnName(e.target.value)}
                  />
                  <Input
                    placeholder="Formula (e.g., sales * 0.1, price + tax)"
                    value={calculateFormula}
                    onChange={(e) => setCalculateFormula(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground">
                    <p>Available columns: {columns.join(', ')}</p>
                    <p>Supported operations: +, -, *, /, (, )</p>
                  </div>
                  <Button onClick={addCalculateOperation} className="w-full sm:w-auto">
                    <Calculator className="h-4 w-4 mr-2" />
                    Add Calculation
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Operations List */}
        {operations.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Pending Operations ({operations.filter(op => !op.applied).length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {operations.map(renderOperation)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}