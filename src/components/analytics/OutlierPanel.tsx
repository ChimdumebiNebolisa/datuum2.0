'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  AlertTriangle, 
  Download, 
  Eye,
  EyeOff,
  BarChart3,
  Info,
  CheckCircle
} from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import { logger } from '@/lib/logger';

interface OutlierPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface OutlierMethod {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

interface OutlierResult {
  outliers: number[];
  outlier_indices: number[];
  outlier_values: any[];
  method: string;
  parameters: Record<string, any>;
  summary: {
    total_outliers: number;
    percentage: number;
    mean_with_outliers: number;
    mean_without_outliers: number;
  };
}

export function OutlierPanel({ data, dataColumns, className }: OutlierPanelProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('iqr');
  const [outlierResults, setOutlierResults] = useState<OutlierResult | null>(null);
  const [showOutliers, setShowOutliers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('detection');
  const [threshold, setThreshold] = useState(1.5); // For IQR method
  const [zScoreThreshold, setZScoreThreshold] = useState(3); // For Z-score method

  const { executePython, isInitialized } = usePythonExecution();

  // Get numeric columns for analysis
  const numericColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });

  const outlierMethods: OutlierMethod[] = [
    {
      id: 'iqr',
      name: 'IQR Method',
      description: 'Detects outliers using Interquartile Range (Q3 - Q1)',
      parameters: { threshold: 1.5 }
    },
    {
      id: 'zscore',
      name: 'Z-Score Method',
      description: 'Detects outliers using standard deviations from mean',
      parameters: { threshold: 3 }
    },
    {
      id: 'isolation_forest',
      name: 'Isolation Forest',
      description: 'Machine learning-based outlier detection',
      parameters: { contamination: 0.1 }
    }
  ];

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

  const detectOutliers = useCallback(async () => {
    if (!isInitialized || !selectedColumn) return;

    setLoading(true);
    setError(null);

    try {
      let code = '';
      
      if (selectedMethod === 'iqr') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np

# IQR Method
df = pd.DataFrame(${JSON.stringify(data)})
column_data = df['${selectedColumn}'].dropna()
Q1 = column_data.quantile(0.25)
Q3 = column_data.quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - ${threshold} * IQR
upper_bound = Q3 + ${threshold} * IQR

outliers = column_data[(column_data < lower_bound) | (column_data > upper_bound)]
outlier_indices = outliers.index.tolist()

result = {
    'outliers': outliers.tolist(),
    'outlier_indices': outlier_indices,
    'outlier_values': outliers.tolist(),
    'method': 'IQR',
    'parameters': {'threshold': ${threshold}},
    'summary': {
        'total_outliers': len(outliers),
        'percentage': len(outliers) / len(column_data) * 100,
        'mean_with_outliers': float(column_data.mean()),
        'mean_without_outliers': float(column_data.drop(outliers.index).mean())
    }
}
result
        `;
      } else if (selectedMethod === 'zscore') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np

# Z-Score Method
df = pd.DataFrame(${JSON.stringify(data)})
column_data = df['${selectedColumn}'].dropna()
z_scores = np.abs((column_data - column_data.mean()) / column_data.std())

outliers = column_data[z_scores > ${zScoreThreshold}]
outlier_indices = outliers.index.tolist()

result = {
    'outliers': outliers.tolist(),
    'outlier_indices': outlier_indices,
    'outlier_values': outliers.tolist(),
    'method': 'Z-Score',
    'parameters': {'threshold': ${zScoreThreshold}},
    'summary': {
        'total_outliers': len(outliers),
        'percentage': len(outliers) / len(column_data) * 100,
        'mean_with_outliers': float(column_data.mean()),
        'mean_without_outliers': float(column_data.drop(outliers.index).mean())
    }
}
result
        `;
      } else if (selectedMethod === 'isolation_forest') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

# Isolation Forest Method
df = pd.DataFrame(${JSON.stringify(data)})
column_data = df['${selectedColumn}'].dropna().values.reshape(-1, 1)

iso_forest = IsolationForest(contamination=0.1, random_state=42)
outlier_labels = iso_forest.fit_predict(column_data)

outlier_indices = np.where(outlier_labels == -1)[0]
outliers = column_data[outlier_indices].flatten()

result = {
    'outliers': outliers.tolist(),
    'outlier_indices': outlier_indices.tolist(),
    'outlier_values': outliers.tolist(),
    'method': 'Isolation Forest',
    'parameters': {'contamination': 0.1},
    'summary': {
        'total_outliers': len(outliers),
        'percentage': len(outliers) / len(column_data) * 100,
        'mean_with_outliers': float(column_data.mean()),
        'mean_without_outliers': float(np.mean(column_data[outlier_labels == 1]))
    }
}
result
        `;
      }

      const result = await executePython(code);
      
      if (result) {
        setOutlierResults(result as any);
      } else {
        setError('Failed to detect outliers');
      }
    } catch (error) {
      setError('Error detecting outliers');
      logger.error('Outlier detection error:', error);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, selectedColumn, selectedMethod, threshold, zScoreThreshold, data, executePython]);

  useEffect(() => {
    if (selectedColumn && isInitialized) {
      detectOutliers();
    }
  }, [selectedColumn, selectedMethod, threshold, zScoreThreshold, isInitialized, detectOutliers]);

  const renderBoxPlot = () => {
    if (!selectedColumn || !data.length) return null;

    // const columnData = data.map(row => row[selectedColumn]).filter(val => typeof val === 'number' && !isNaN(val));
    // Plot data and layout configuration for Plotly box plot
    // const outlierIndices = outlierResults?.outlier_indices || [];
    
    // const plotData = [{
    //   y: columnData,
    //   type: 'box',
    //   name: selectedColumn,
    //   boxpoints: 'outliers',
    //   marker: {
    //     color: '#3b82f6',
    //     outliercolor: '#ef4444',
    //     line: { color: '#1e40af' }
    //   },
    //   hovertemplate: '<b>' + selectedColumn + '</b><br>Value: %{y}<extra></extra>'
    // }];

    // const layout = {
    //   title: `Box Plot for ${selectedColumn}`,
    //   yaxis: { title: selectedColumn },
    //   margin: { l: 60, r: 50, t: 50, b: 50 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

    return (
      <div className="h-64 w-full" id="box-plot">
        {/* Plotly box plot will be rendered here */}
      </div>
    );
  };

  const renderScatterPlot = () => {
    if (!selectedColumn || !data.length) return null;

    // const columnData = data.map(row => row[selectedColumn]).filter(val => typeof val === 'number' && !isNaN(val));
    // const outlierIndices = outlierResults?.outlier_indices || [];
    // 
    // const x = Array.from({ length: columnData.length }, (_, i) => i);
    // const colors = x.map(i => outlierIndices.includes(i) ? '#ef4444' : '#3b82f6');
    // const sizes = x.map(i => outlierIndices.includes(i) ? 8 : 6);

    // Plot data and layout configuration for Plotly scatter plot
    // const plotData = [{
    //   x: x,
    //   y: columnData,
    //   type: 'scatter',
    //   mode: 'markers',
    //   name: selectedColumn,
    //   marker: {
    //     color: colors,
    //     size: sizes,
    //     opacity: 0.7
    //   },
    //   hovertemplate: `<b>Index:</b> %{x}<br><b>${selectedColumn}:</b> %{y}<extra></extra>`
    // }];

    // const layout = {
    //   title: `${selectedColumn} - Outliers Highlighted`,
    //   xaxis: { title: 'Index' },
    //   yaxis: { title: selectedColumn },
    //   margin: { l: 60, r: 50, t: 50, b: 60 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

    return (
      <div className="h-64 w-full" id="scatter-plot">
        {/* Plotly scatter plot will be rendered here */}
      </div>
    );
  };

  const renderOutlierTable = () => {
    if (!outlierResults?.outliers) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Detected Outliers ({outlierResults.summary.total_outliers})</h4>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOutliers(!showOutliers)}
            >
              {showOutliers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showOutliers ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        
        {showOutliers && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {outlierResults.outliers.map((outlier, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-destructive/10 border border-destructive/20 rounded">
                <span className="text-sm font-mono">{outlier.toFixed(2)}</span>
                <Badge variant="destructive" className="text-xs">
                  Index: {outlierResults.outlier_indices[index]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSummaryStats = () => {
    if (!outlierResults) return null;

    const stats = outlierResults.summary;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Outliers</p>
                <p className="text-2xl font-bold">{stats.total_outliers}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Percentage</p>
                <p className="text-2xl font-bold">{stats.percentage.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mean (With Outliers)</p>
                <p className="text-2xl font-bold">{stats.mean_with_outliers.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mean (Without Outliers)</p>
                <p className="text-2xl font-bold">{stats.mean_without_outliers.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const exportOutliers = () => {
    if (!outlierResults) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      column: selectedColumn,
      method: outlierResults.method,
      parameters: outlierResults.parameters,
      outliers: outlierResults.outliers,
      outlier_indices: outlierResults.outlier_indices,
      summary: outlierResults.summary
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outliers-${selectedColumn}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Initializing Python engine...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (numericColumns.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Outlier Detection
          </CardTitle>
          <CardDescription>
            Detect and analyze outliers in your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No numeric columns found. Outlier detection requires numeric data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Outlier Detection
            </CardTitle>
            <CardDescription>
              Detect and analyze outliers in your data
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportOutliers} disabled={!outlierResults}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Detection Method</label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outlierMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedMethod === 'iqr' && (
            <div>
              <label className="text-sm font-medium">IQR Threshold: {threshold}</label>
              <Slider
                value={[threshold]}
                onValueChange={(value) => setThreshold(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="mt-2"
              />
            </div>
          )}
          
          {selectedMethod === 'zscore' && (
            <div>
              <label className="text-sm font-medium">Z-Score Threshold: {zScoreThreshold}</label>
              <Slider
                value={[zScoreThreshold]}
                onValueChange={(value) => setZScoreThreshold(value[0])}
                min={1}
                max={5}
                step={0.5}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4" />
            <span className="font-medium text-sm">
              {outlierMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {outlierMethods.find(m => m.id === selectedMethod)?.description}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Detecting outliers...</span>
          </div>
        )}

        {outlierResults && (
          <>
            {renderSummaryStats()}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="detection">Detection</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
                <TabsTrigger value="outliers">Outlier List</TabsTrigger>
              </TabsList>

              <TabsContent value="detection" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Box Plot</CardTitle>
                      <CardDescription>
                        Shows outliers beyond the whiskers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderBoxPlot()}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Scatter Plot</CardTitle>
                      <CardDescription>
                        Outliers highlighted in red
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderScatterPlot()}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="visualization" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution Comparison</CardTitle>
                    <CardDescription>
                      Compare data with and without outliers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 w-full" id="distribution-comparison">
                      {/* Distribution comparison chart will be rendered here */}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outliers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Outliers</CardTitle>
                    <CardDescription>
                      List of all detected outlier values and their indices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderOutlierTable()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
