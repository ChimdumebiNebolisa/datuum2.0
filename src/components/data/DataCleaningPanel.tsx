'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  RotateCcw,
  Search,
  Type,
  Zap,
  Copy
} from 'lucide-react';
import { useToast } from '@/lib/toast';

interface DataCleaningPanelProps {
  data: any[];
  columns: string[];
  onDataChange?: (_newData: any[]) => void;
  className?: string;
}

interface CleaningIssue {
  type: 'missing' | 'duplicate' | 'outlier' | 'format' | 'whitespace' | 'case';
  column: string;
  count: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface CleaningOperation {
  id: string;
  type: string;
  column: string;
  config: any;
  applied: boolean;
}

export function DataCleaningPanel({ data, columns, onDataChange, className }: DataCleaningPanelProps) {
  const [issues, setIssues] = useState<CleaningIssue[]>([]);
  const [operations, setOperations] = useState<CleaningOperation[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [missingValueStrategy, setMissingValueStrategy] = useState<'remove' | 'mean' | 'median' | 'mode' | 'fill'>('remove');
  const [missingValueFill, setMissingValueFill] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'remove' | 'keep_first' | 'keep_last'>('remove');
  const [whitespaceStrategy, setWhitespaceStrategy] = useState<'trim' | 'remove' | 'normalize'>('trim');
  const [caseStrategy, setCaseStrategy] = useState<'lower' | 'upper' | 'title' | 'none'>('none');
  const [outlierStrategy, setOutlierStrategy] = useState<'remove' | 'cap' | 'transform'>('remove');
  const [outlierMethod, setOutlierMethod] = useState<'iqr' | 'zscore'>('iqr');
  const [outlierThreshold, setOutlierThreshold] = useState(1.5);
  const [activeTab, setActiveTab] = useState('detect');

  const { toast } = useToast();

  const detectIssues = useCallback(() => {
    const detectedIssues: CleaningIssue[] = [];

    columns.forEach(column => {
      const values = data.map(row => row[column]);
      
      // Missing values
      const missingCount = values.filter(val => val == null || val === '' || val === undefined).length;
      if (missingCount > 0) {
        detectedIssues.push({
          type: 'missing',
          column,
          count: missingCount,
          description: `${missingCount} missing values`,
          severity: missingCount > data.length * 0.1 ? 'high' : missingCount > data.length * 0.05 ? 'medium' : 'low'
        });
      }

      // Duplicates
      const uniqueValues = new Set(values);
      const duplicateCount = values.length - uniqueValues.size;
      if (duplicateCount > 0) {
        detectedIssues.push({
          type: 'duplicate',
          column,
          count: duplicateCount,
          description: `${duplicateCount} duplicate values`,
          severity: duplicateCount > data.length * 0.2 ? 'high' : duplicateCount > data.length * 0.1 ? 'medium' : 'low'
        });
      }

      // Whitespace issues
      const stringValues = values.filter(val => typeof val === 'string');
      const whitespaceCount = stringValues.filter(val => val !== val.trim()).length;
      if (whitespaceCount > 0) {
        detectedIssues.push({
          type: 'whitespace',
          column,
          count: whitespaceCount,
          description: `${whitespaceCount} values with extra whitespace`,
          severity: 'low'
        });
      }

      // Case inconsistencies
      const textValues = stringValues.filter(val => val.length > 0);
      if (textValues.length > 0) {
        const firstCase = textValues[0][0];
        const caseInconsistent = textValues.some(val => val[0] !== firstCase);
        if (caseInconsistent) {
          detectedIssues.push({
            type: 'case',
            column,
            count: textValues.length,
            description: 'Inconsistent case formatting',
            severity: 'low'
          });
        }
      }

      // Numeric outliers (simplified detection)
      const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
      if (numericValues.length > 10) {
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const std = Math.sqrt(numericValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numericValues.length);
        const outliers = numericValues.filter(val => Math.abs(val - mean) > 2 * std);
        if (outliers.length > 0) {
          detectedIssues.push({
            type: 'outlier',
            column,
            count: outliers.length,
            description: `${outliers.length} potential outliers`,
            severity: outliers.length > numericValues.length * 0.1 ? 'high' : 'medium'
          });
        }
      }
    });

    setIssues(detectedIssues);
  }, [data, columns]);

  useEffect(() => {
    detectIssues();
  }, [detectIssues]);

  const addMissingValueOperation = () => {
    if (!selectedColumn) {
      toast({
        title: "Error",
        description: "Please select a column",
      });
      return;
    }

    const operation: CleaningOperation = {
      id: Date.now().toString(),
      type: 'missing_values',
      column: selectedColumn,
      config: {
        strategy: missingValueStrategy,
        fillValue: missingValueFill
      },
      applied: false
    };

    setOperations([...operations, operation]);
  };

  const addDuplicateOperation = () => {
    if (!selectedColumn) {
      toast({
        title: "Error",
        description: "Please select a column",
      });
      return;
    }

    const operation: CleaningOperation = {
      id: Date.now().toString(),
      type: 'duplicates',
      column: selectedColumn,
      config: {
        strategy: duplicateStrategy
      },
      applied: false
    };

    setOperations([...operations, operation]);
  };

  const addWhitespaceOperation = () => {
    if (!selectedColumn) {
      toast({
        title: "Error",
        description: "Please select a column",
      });
      return;
    }

    const operation: CleaningOperation = {
      id: Date.now().toString(),
      type: 'whitespace',
      column: selectedColumn,
      config: {
        strategy: whitespaceStrategy
      },
      applied: false
    };

    setOperations([...operations, operation]);
  };

  const addCaseOperation = () => {
    if (!selectedColumn) {
      toast({
        title: "Error",
        description: "Please select a column",
      });
      return;
    }

    const operation: CleaningOperation = {
      id: Date.now().toString(),
      type: 'case',
      column: selectedColumn,
      config: {
        strategy: caseStrategy
      },
      applied: false
    };

    setOperations([...operations, operation]);
  };

  const addOutlierOperation = () => {
    if (!selectedColumn) {
      toast({
        title: "Error",
        description: "Please select a column",
      });
      return;
    }

    const operation: CleaningOperation = {
      id: Date.now().toString(),
      type: 'outliers',
      column: selectedColumn,
      config: {
        strategy: outlierStrategy,
        method: outlierMethod,
        threshold: outlierThreshold
      },
      applied: false
    };

    setOperations([...operations, operation]);
  };

  const applyOperations = () => {
    let newData = [...data];

    operations.forEach(operation => {
      if (operation.applied) return;

      switch (operation.type) {
        case 'missing_values':
          newData = handleMissingValues(newData, operation.column, operation.config);
          break;
        case 'duplicates':
          newData = handleDuplicates(newData, operation.column, operation.config);
          break;
        case 'whitespace':
          newData = handleWhitespace(newData, operation.column, operation.config);
          break;
        case 'case':
          newData = handleCase(newData, operation.column, operation.config);
          break;
        case 'outliers':
          newData = handleOutliers(newData, operation.column, operation.config);
          break;
      }
    });

    // Mark operations as applied
    setOperations(operations.map(op => ({ ...op, applied: true })));
    
    onDataChange?.(newData);
    
    toast({
      title: "Success",
      description: `Applied ${operations.filter(op => !op.applied).length} cleaning operations`,
    });

    // Re-detect issues
    setTimeout(() => detectIssues(), 100);
  };

  const handleMissingValues = (data: any[], column: string, config: any) => {
    const { strategy, fillValue } = config;
    
    if (strategy === 'remove') {
      return data.filter(row => row[column] != null && row[column] !== '');
    }
    
    if (strategy === 'fill') {
      return data.map(row => ({
        ...row,
        [column]: row[column] == null || row[column] === '' ? fillValue : row[column]
      }));
    }
    
    if (strategy === 'mean' || strategy === 'median' || strategy === 'mode') {
      const numericValues = data
        .map(row => row[column])
        .filter(val => typeof val === 'number' && !isNaN(val));
      
      if (numericValues.length === 0) return data;
      
      let replacementValue;
      if (strategy === 'mean') {
        replacementValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      } else if (strategy === 'median') {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        replacementValue = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      } else { // mode
        const frequency: { [key: number]: number } = {};
        numericValues.forEach(val => {
          frequency[val] = (frequency[val] || 0) + 1;
        });
        replacementValue = Object.keys(frequency).reduce((a, b) => 
          frequency[Number(a)] > frequency[Number(b)] ? a : b
        );
      }
      
      return data.map(row => ({
        ...row,
        [column]: row[column] == null || row[column] === '' ? replacementValue : row[column]
      }));
    }
    
    return data;
  };

  const handleDuplicates = (data: any[], column: string, config: any) => {
    const { strategy } = config;
    
    if (strategy === 'remove') {
      const seen = new Set();
      return data.filter(row => {
        const value = row[column];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    if (strategy === 'keep_first') {
      const seen = new Set();
      return data.filter(row => {
        const value = row[column];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    if (strategy === 'keep_last') {
      const seen = new Set();
      return data.reverse().filter(row => {
        const value = row[column];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      }).reverse();
    }
    
    return data;
  };

  const handleWhitespace = (data: any[], column: string, config: any) => {
    const { strategy } = config;
    
    return data.map(row => {
      const value = row[column];
      if (typeof value !== 'string') return row;
      
      let cleanedValue = value;
      if (strategy === 'trim') {
        cleanedValue = value.trim();
      } else if (strategy === 'remove') {
        cleanedValue = value.replace(/\s+/g, '');
      } else if (strategy === 'normalize') {
        cleanedValue = value.replace(/\s+/g, ' ').trim();
      }
      
      return { ...row, [column]: cleanedValue };
    });
  };

  const handleCase = (data: any[], column: string, config: any) => {
    const { strategy } = config;
    
    return data.map(row => {
      const value = row[column];
      if (typeof value !== 'string') return row;
      
      let transformedValue = value;
      if (strategy === 'lower') {
        transformedValue = value.toLowerCase();
      } else if (strategy === 'upper') {
        transformedValue = value.toUpperCase();
      } else if (strategy === 'title') {
        transformedValue = value.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      }
      
      return { ...row, [column]: transformedValue };
    });
  };

  const handleOutliers = (data: any[], column: string, config: any) => {
    const { strategy, method, threshold } = config;
    const values = data.map(row => row[column]).filter(val => typeof val === 'number' && !isNaN(val));
    
    if (values.length === 0) return data;
    
    let outlierIndices: number[] = [];
    
    if (method === 'iqr') {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - threshold * iqr;
      const upperBound = q3 + threshold * iqr;
      
      outlierIndices = data
        .map((row, idx) => ({ row, idx, value: row[column] }))
        .filter(item => typeof item.value === 'number' && (item.value < lowerBound || item.value > upperBound))
        .map(item => item.idx);
    } else if (method === 'zscore') {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
      
      outlierIndices = data
        .map((row, idx) => ({ row, idx, value: row[column] }))
        .filter(item => typeof item.value === 'number' && Math.abs(item.value - mean) > threshold * std)
        .map(item => item.idx);
    }
    
    if (strategy === 'remove') {
      return data.filter((_, idx) => !outlierIndices.includes(idx));
    } else if (strategy === 'cap') {
      const values = data.map(row => row[column]).filter(val => typeof val === 'number' && !isNaN(val));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
      const capValue = mean + threshold * std;
      
      return data.map((row, idx) => ({
        ...row,
        [column]: outlierIndices.includes(idx) ? capValue : row[column]
      }));
    }
    
    return data;
  };

  const removeOperation = (id: string) => {
    setOperations(operations.filter(op => op.id !== id));
  };

  const clearOperations = () => {
    setOperations([]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'missing': return <AlertTriangle className="h-4 w-4" />;
      case 'duplicate': return <Copy className="h-4 w-4" />;
      case 'outlier': return <Zap className="h-4 w-4" />;
      case 'whitespace': return <Type className="h-4 w-4" />;
      case 'case': return <Type className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Data Cleaning
            </CardTitle>
            <CardDescription>
              Detect and fix data quality issues
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={detectIssues} className="flex-1 sm:flex-none">
              <Search className="h-4 w-4 mr-2" />
              Re-scan
            </Button>
            <Button variant="outline" size="sm" onClick={clearOperations} className="flex-1 sm:flex-none">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button 
              onClick={applyOperations}
              disabled={operations.length === 0 || operations.every(op => op.applied)}
              className="flex-1 sm:flex-none"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Operations
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detect">Detect Issues</TabsTrigger>
            <TabsTrigger value="clean">Clean Data</TabsTrigger>
          </TabsList>

          <TabsContent value="detect" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-medium">Detected Issues ({issues.length})</h4>
                <Badge variant="outline">
                  {issues.filter(i => i.severity === 'high').length} High
                </Badge>
              </div>
              
              {issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p>No data quality issues detected!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {issues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getIssueIcon(issue.type)}
                        <div>
                          <div className="font-medium">{issue.column}</div>
                          <div className="text-sm text-muted-foreground">{issue.description}</div>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clean" className="space-y-4">
            <div className="space-y-6">
              {/* Missing Values */}
              <div>
                <h4 className="font-medium mb-3">Missing Values</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={missingValueStrategy} onValueChange={(value: any) => setMissingValueStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remove">Remove rows</SelectItem>
                      <SelectItem value="mean">Fill with mean</SelectItem>
                      <SelectItem value="median">Fill with median</SelectItem>
                      <SelectItem value="mode">Fill with mode</SelectItem>
                      <SelectItem value="fill">Fill with value</SelectItem>
                    </SelectContent>
                  </Select>
                  {missingValueStrategy === 'fill' && (
                    <Input
                      placeholder="Fill value"
                      value={missingValueFill}
                      onChange={(e) => setMissingValueFill(e.target.value)}
                      className="sm:col-span-2 lg:col-span-1"
                    />
                  )}
                </div>
                <Button onClick={addMissingValueOperation} className="mt-3 w-full sm:w-auto">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Add Missing Values Fix
                </Button>
              </div>

              {/* Duplicates */}
              <div>
                <h4 className="font-medium mb-3">Duplicates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={duplicateStrategy} onValueChange={(value: any) => setDuplicateStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remove">Remove all duplicates</SelectItem>
                      <SelectItem value="keep_first">Keep first occurrence</SelectItem>
                      <SelectItem value="keep_last">Keep last occurrence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addDuplicateOperation} className="mt-3 w-full sm:w-auto">
                  <Copy className="h-4 w-4 mr-2" />
                  Add Duplicate Fix
                </Button>
              </div>

              {/* Whitespace */}
              <div>
                <h4 className="font-medium mb-3">Whitespace</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={whitespaceStrategy} onValueChange={(value: any) => setWhitespaceStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trim">Trim whitespace</SelectItem>
                      <SelectItem value="remove">Remove all whitespace</SelectItem>
                      <SelectItem value="normalize">Normalize whitespace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addWhitespaceOperation} className="mt-3 w-full sm:w-auto">
                  <Type className="h-4 w-4 mr-2" />
                  Add Whitespace Fix
                </Button>
              </div>

              {/* Case */}
              <div>
                <h4 className="font-medium mb-3">Case Formatting</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={caseStrategy} onValueChange={(value: any) => setCaseStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No change</SelectItem>
                      <SelectItem value="lower">Lowercase</SelectItem>
                      <SelectItem value="upper">Uppercase</SelectItem>
                      <SelectItem value="title">Title Case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addCaseOperation} className="mt-3 w-full sm:w-auto">
                  <Type className="h-4 w-4 mr-2" />
                  Add Case Fix
                </Button>
              </div>

              {/* Outliers */}
              <div>
                <h4 className="font-medium mb-3">Outliers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={outlierStrategy} onValueChange={(value: any) => setOutlierStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remove">Remove outliers</SelectItem>
                      <SelectItem value="cap">Cap outliers</SelectItem>
                      <SelectItem value="transform">Transform outliers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={outlierMethod} onValueChange={(value: any) => setOutlierMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iqr">IQR Method</SelectItem>
                      <SelectItem value="zscore">Z-Score Method</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Threshold"
                    value={outlierThreshold}
                    onChange={(e) => setOutlierThreshold(Number(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="5"
                  />
                </div>
                <Button onClick={addOutlierOperation} className="mt-3 w-full sm:w-auto">
                  <Zap className="h-4 w-4 mr-2" />
                  Add Outlier Fix
                </Button>
              </div>
            </div>

            {/* Operations List */}
            {operations.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Pending Operations ({operations.filter(op => !op.applied).length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {operations.map(operation => (
                    <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Wrench className="h-4 w-4" />
                        <span className="text-sm">
                          {operation.type.replace('_', ' ')} on {operation.column}
                        </span>
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
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}