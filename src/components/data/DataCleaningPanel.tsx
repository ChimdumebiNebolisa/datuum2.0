'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Trash2, 
  RotateCcw,
  Search,
  Filter,
  Type,
  Calendar,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';

interface DataCleaningPanelProps {
  data: any[];
  columns: string[];
  onDataChange: (newData: any[]) => void;
  className?: string;
}

interface CleaningIssue {
  type: 'missing' | 'duplicate' | 'outlier' | 'format' | 'invalid';
  column: string;
  rowIndex: number;
  value: any;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface DataQualityReport {
  totalRows: number;
  totalColumns: number;
  issues: CleaningIssue[];
  columnStats: Record<string, {
    nullCount: number;
    nullPercentage: number;
    uniqueCount: number;
    dataType: string;
    issues: CleaningIssue[];
  }>;
}

export function DataCleaningPanel({ data, columns, onDataChange, className }: DataCleaningPanelProps) {
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [cleaningRules, setCleaningRules] = useState({
    trimWhitespace: true,
    standardizeCase: false,
    caseType: 'lower' as 'lower' | 'upper' | 'title',
    removeSpecialChars: false,
    convertToNumeric: true,
    dateFormat: 'auto',
    customDateFormat: '',
    handleNulls: 'keep' as 'keep' | 'remove' | 'fill',
    nullFillValue: '',
    outlierMethod: 'iqr' as 'iqr' | 'zscore' | 'none',
    outlierThreshold: 1.5
  });

  useEffect(() => {
    if (data.length > 0) {
      analyzeDataQuality();
    }
  }, [data, columns]);

  const analyzeDataQuality = () => {
    const issues: CleaningIssue[] = [];
    const columnStats: Record<string, any> = {};

    // Analyze each column
    columns.forEach(column => {
      const values = data.map((row, index) => ({ value: row[column], index }));
      const nonNullValues = values.filter(v => v.value !== null && v.value !== undefined && v.value !== '');
      
      columnStats[column] = {
        nullCount: values.length - nonNullValues.length,
        nullPercentage: ((values.length - nonNullValues.length) / values.length) * 100,
        uniqueCount: new Set(nonNullValues.map(v => String(v.value))).size,
        dataType: detectDataType(nonNullValues.map(v => v.value)),
        issues: []
      };

      // Check for missing values
      values.forEach(({ value, index }) => {
        if (value === null || value === undefined || value === '') {
          const issue: CleaningIssue = {
            type: 'missing',
            column,
            rowIndex: index,
            value,
            description: 'Missing value',
            severity: 'medium'
          };
          issues.push(issue);
          columnStats[column].issues.push(issue);
        }
      });

      // Check for format issues
      nonNullValues.forEach(({ value, index }) => {
        const strValue = String(value);
        
        // Check for leading/trailing whitespace
        if (strValue !== strValue.trim()) {
          const issue: CleaningIssue = {
            type: 'format',
            column,
            rowIndex: index,
            value,
            description: 'Has leading/trailing whitespace',
            severity: 'low'
          };
          issues.push(issue);
          columnStats[column].issues.push(issue);
        }

        // Check for inconsistent case (if text)
        if (columnStats[column].dataType === 'text') {
          const hasUpper = /[A-Z]/.test(strValue);
          const hasLower = /[a-z]/.test(strValue);
          if (hasUpper && hasLower && strValue.length > 1) {
            const issue: CleaningIssue = {
              type: 'format',
              column,
              rowIndex: index,
              value,
              description: 'Inconsistent case',
              severity: 'low'
            };
            issues.push(issue);
            columnStats[column].issues.push(issue);
          }
        }
      });

      // Check for duplicates
      if (columnStats[column].uniqueCount < nonNullValues.length) {
        const valueCounts = nonNullValues.reduce((acc, { value }) => {
          const key = String(value);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        Object.entries(valueCounts).forEach(([value, count]) => {
          if (count > 1) {
            const issue: CleaningIssue = {
              type: 'duplicate',
              column,
              rowIndex: -1, // Multiple rows
              value,
              description: `Duplicate value appears ${count} times`,
              severity: 'medium'
            };
            issues.push(issue);
          }
        });
      }

      // Check for outliers (numeric columns)
      if (columnStats[column].dataType === 'numeric' && nonNullValues.length > 10) {
        const numericValues = nonNullValues
          .map(v => Number(v.value))
          .filter(v => !isNaN(v));
        
        if (numericValues.length > 0) {
          const q1 = numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length * 0.25)];
          const q3 = numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length * 0.75)];
          const iqr = q3 - q1;
          const lowerBound = q1 - (cleaningRules.outlierThreshold * iqr);
          const upperBound = q3 + (cleaningRules.outlierThreshold * iqr);

          numericValues.forEach((value, i) => {
            if (value < lowerBound || value > upperBound) {
              const originalIndex = nonNullValues.findIndex(v => Number(v.value) === value)?.index;
              if (originalIndex !== undefined) {
                const issue: CleaningIssue = {
                  type: 'outlier',
                  column,
                  rowIndex: originalIndex,
                  value,
                  description: `Potential outlier (${value})`,
                  severity: 'high'
                };
                issues.push(issue);
                columnStats[column].issues.push(issue);
              }
            }
          });
        }
      }
    });

    setQualityReport({
      totalRows: data.length,
      totalColumns: columns.length,
      issues,
      columnStats
    });
  };

  const detectDataType = (values: any[]): string => {
    if (values.length === 0) return 'unknown';
    
    const sample = values.slice(0, Math.min(10, values.length));
    const numericCount = sample.filter(v => !isNaN(Number(v)) && String(v).trim() !== '').length;
    const dateCount = sample.filter(v => !isNaN(Date.parse(String(v)))).length;
    const booleanCount = sample.filter(v => 
      ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())
    ).length;

    if (numericCount / sample.length > 0.8) return 'numeric';
    if (dateCount / sample.length > 0.8) return 'date';
    if (booleanCount / sample.length > 0.8) return 'boolean';
    return 'text';
  };

  const cleanData = () => {
    let cleanedData = [...data];

    // Apply cleaning rules
    if (cleaningRules.trimWhitespace) {
      cleanedData = cleanedData.map(row => {
        const cleanedRow = { ...row };
        selectedColumns.forEach(col => {
          if (typeof cleanedRow[col] === 'string') {
            cleanedRow[col] = cleanedRow[col].trim();
          }
        });
        return cleanedRow;
      });
    }

    if (cleaningRules.standardizeCase) {
      cleanedData = cleanedData.map(row => {
        const cleanedRow = { ...row };
        selectedColumns.forEach(col => {
          if (typeof cleanedRow[col] === 'string') {
            switch (cleaningRules.caseType) {
              case 'lower':
                cleanedRow[col] = cleanedRow[col].toLowerCase();
                break;
              case 'upper':
                cleanedRow[col] = cleanedRow[col].toUpperCase();
                break;
              case 'title':
                cleanedRow[col] = cleanedRow[col].replace(/\w\S*/g, (txt) => 
                  txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
                break;
            }
          }
        });
        return cleanedRow;
      });
    }

    if (cleaningRules.removeSpecialChars) {
      cleanedData = cleanedData.map(row => {
        const cleanedRow = { ...row };
        selectedColumns.forEach(col => {
          if (typeof cleanedRow[col] === 'string') {
            cleanedRow[col] = cleanedRow[col].replace(/[^a-zA-Z0-9\s]/g, '');
          }
        });
        return cleanedRow;
      });
    }

    if (cleaningRules.convertToNumeric) {
      cleanedData = cleanedData.map(row => {
        const cleanedRow = { ...row };
        selectedColumns.forEach(col => {
          const value = cleanedRow[col];
          if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
            cleanedRow[col] = Number(value);
          }
        });
        return cleanedRow;
      });
    }

    // Handle null values
    if (cleaningRules.handleNulls === 'remove') {
      cleanedData = cleanedData.filter(row => 
        selectedColumns.every(col => row[col] !== null && row[col] !== undefined && row[col] !== '')
      );
    } else if (cleaningRules.handleNulls === 'fill') {
      cleanedData = cleanedData.map(row => {
        const cleanedRow = { ...row };
        selectedColumns.forEach(col => {
          if (cleanedRow[col] === null || cleanedRow[col] === undefined || cleanedRow[col] === '') {
            cleanedRow[col] = cleaningRules.nullFillValue;
          }
        });
        return cleanedRow;
      });
    }

    onDataChange(cleanedData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'low': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric': return <Hash className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'boolean': return <CheckCircle className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Data Cleaning
        </CardTitle>
        <CardDescription>
          Identify and fix data quality issues
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Quality Analysis</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="clean">Clean Data</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {qualityReport && (
              <>
                {/* Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Rows</p>
                          <p className="text-2xl font-bold">{qualityReport.totalRows}</p>
                        </div>
                        <Eye className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                          <p className="text-2xl font-bold">{qualityReport.issues.length}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-warning" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                          <p className="text-2xl font-bold text-destructive">
                            {qualityReport.issues.filter(i => i.severity === 'high').length}
                          </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Data Quality</p>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(((qualityReport.totalRows * qualityReport.totalColumns - qualityReport.issues.length) / (qualityReport.totalRows * qualityReport.totalColumns)) * 100)}%
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Column Analysis */}
                <div className="space-y-4">
                  <h4 className="font-medium">Column Analysis</h4>
                  <div className="space-y-2">
                    {Object.entries(qualityReport.columnStats).map(([column, stats]) => (
                      <div key={column} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getDataTypeIcon(stats.dataType)}
                            <span className="font-medium">{column}</span>
                            <Badge variant="outline">{stats.dataType}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={stats.issues.length === 0 ? 'secondary' : 'destructive'}>
                              {stats.issues.length} issues
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Null values:</span>
                            <span className="ml-2">{stats.nullCount} ({stats.nullPercentage.toFixed(1)}%)</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Unique values:</span>
                            <span className="ml-2">{stats.uniqueCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Issues:</span>
                            <span className="ml-2">{stats.issues.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quality:</span>
                            <span className="ml-2">
                              {stats.nullPercentage === 0 && stats.issues.length === 0 ? (
                                <span className="text-green-600">Good</span>
                              ) : stats.nullPercentage < 10 && stats.issues.length < 5 ? (
                                <span className="text-warning">Fair</span>
                              ) : (
                                <span className="text-destructive">Poor</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            {qualityReport && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Data Quality Issues</h4>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={showAllIssues}
                      onCheckedChange={setShowAllIssues}
                    />
                    <label className="text-sm">Show all issues</label>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(showAllIssues ? qualityReport.issues : qualityReport.issues.slice(0, 20)).map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(issue.severity)}
                        <Badge variant="outline" className="text-xs">
                          {issue.type}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{issue.column}</div>
                        <div className="text-sm text-muted-foreground">
                          {issue.description}
                        </div>
                        {issue.rowIndex >= 0 && (
                          <div className="text-xs text-muted-foreground">
                            Row {issue.rowIndex + 1}: {String(issue.value)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {qualityReport.issues.length > 20 && !showAllIssues && (
                  <div className="text-center">
                    <Button variant="outline" onClick={() => setShowAllIssues(true)}>
                      Show {qualityReport.issues.length - 20} more issues
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="clean" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Select Columns to Clean</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {columns.map(col => (
                    <div key={col} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedColumns.includes(col)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedColumns(prev => [...prev, col]);
                          } else {
                            setSelectedColumns(prev => prev.filter(c => c !== col));
                          }
                        }}
                      />
                      <label className="text-sm">{col}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cleaning Rules</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={cleaningRules.trimWhitespace}
                      onCheckedChange={(checked) => 
                        setCleaningRules(prev => ({ ...prev, trimWhitespace: !!checked }))
                      }
                    />
                    <label className="text-sm">Trim leading and trailing whitespace</label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cleaningRules.standardizeCase}
                        onCheckedChange={(checked) => 
                          setCleaningRules(prev => ({ ...prev, standardizeCase: !!checked }))
                        }
                      />
                      <label className="text-sm">Standardize text case</label>
                    </div>
                    {cleaningRules.standardizeCase && (
                      <Select value={cleaningRules.caseType} onValueChange={(value: any) => 
                        setCleaningRules(prev => ({ ...prev, caseType: value }))
                      }>
                        <SelectTrigger className="w-48 ml-6">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lower">lowercase</SelectItem>
                          <SelectItem value="upper">UPPERCASE</SelectItem>
                          <SelectItem value="title">Title Case</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={cleaningRules.convertToNumeric}
                      onCheckedChange={(checked) => 
                        setCleaningRules(prev => ({ ...prev, convertToNumeric: !!checked }))
                      }
                    />
                    <label className="text-sm">Convert string numbers to numeric</label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Handle null values</label>
                    <Select value={cleaningRules.handleNulls} onValueChange={(value: any) => 
                      setCleaningRules(prev => ({ ...prev, handleNulls: value }))
                    }>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep">Keep as is</SelectItem>
                        <SelectItem value="remove">Remove rows</SelectItem>
                        <SelectItem value="fill">Fill with value</SelectItem>
                      </SelectContent>
                    </Select>
                    {cleaningRules.handleNulls === 'fill' && (
                      <Input
                        placeholder="Fill value"
                        value={cleaningRules.nullFillValue}
                        onChange={(e) => 
                          setCleaningRules(prev => ({ ...prev, nullFillValue: e.target.value }))
                        }
                        className="w-48"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={cleanData} disabled={selectedColumns.length === 0}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Clean Data
                </Button>
                <Button variant="outline" onClick={analyzeDataQuality}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Re-analyze
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
