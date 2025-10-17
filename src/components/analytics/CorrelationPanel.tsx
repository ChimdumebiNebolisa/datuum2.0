'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Download, 
  Grid3X3,
  Info,
  CheckCircle,
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import Plotly from 'plotly.js-dist-min';

interface CorrelationPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface CorrelationResult {
  column1: string;
  column2: string;
  correlation: number;
  p_value?: number;
  significant?: boolean;
  strength: string;
}

export function CorrelationPanel({ data, dataColumns, className }: CorrelationPanelProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [correlationResults, setCorrelationResults] = useState<any>(null);
  const [correlationMethod, setCorrelationMethod] = useState<'pearson' | 'spearman' | 'kendall'>('pearson');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('heatmap');
  const [selectedPair, setSelectedPair] = useState<CorrelationResult | null>(null);

  const { executePython, isInitialized } = usePythonExecution();

  // Get numeric columns for analysis
  const numericColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });

  useEffect(() => {
    if (numericColumns.length >= 2 && selectedColumns.length === 0) {
      setSelectedColumns(numericColumns.slice(0, Math.min(5, numericColumns.length)));
    }
  }, [numericColumns]);

  useEffect(() => {
    if (selectedColumns.length >= 2 && isInitialized) {
      calculateCorrelations();
    }
  }, [selectedColumns, correlationMethod, isInitialized]);

  const calculateCorrelations = async () => {
    if (!isInitialized || selectedColumns.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from statistics import statistics_analyzer

# Set data and calculate correlations
df = pd.DataFrame(${JSON.stringify(data)})
statistics_analyzer.set_data(df)
result = statistics_analyzer.correlation_analysis(
    columns=${JSON.stringify(selectedColumns)}, 
    method='${correlationMethod}'
)
result
      `;

      const result = await executePython(code);
      
      if ((result as any).success) {
        setCorrelationResults(result);
      } else {
        setError((result as any).error || 'Failed to calculate correlations');
      }
    } catch (error) {
      setError('Error calculating correlations');
      console.error('Correlation calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCorrelationHeatmap = () => {
    if (!correlationResults?.correlation_matrix) return null;

    const matrix = correlationResults.correlation_matrix;
    const columns = Object.keys(matrix);
    const z = columns.map(col1 => 
      columns.map(col2 => matrix[col1][col2] || 0)
    );

    const plotData = [{
      z: z,
      x: columns,
      y: columns,
      type: 'heatmap',
      colorscale: 'RdBu',
      zmid: 0,
      hoverongaps: false,
      hovertemplate: '<b>%{x}</b> vs <b>%{y}</b><br>Correlation: %{z:.3f}<extra></extra>'
    }];

    const layout = {
      title: `${correlationMethod.charAt(0).toUpperCase() + correlationMethod.slice(1)} Correlation Matrix`,
      xaxis: { 
        side: 'bottom',
        tickangle: -45
      },
      yaxis: { 
        autorange: 'reversed'
      },
      margin: { l: 100, r: 50, t: 50, b: 100 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-96 w-full" id="correlation-heatmap">
        {/* Plotly heatmap will be rendered here */}
      </div>
    );
  };

  const renderCorrelationTable = () => {
    if (!correlationResults?.correlations) return null;

    return (
      <div className="space-y-2">
        {correlationResults.correlations.map((corr: CorrelationResult, index: number) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
            onClick={() => setSelectedPair(corr)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{corr.column1}</Badge>
                <span className="text-muted-foreground">vs</span>
                <Badge variant="outline">{corr.column2}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{corr.correlation.toFixed(3)}</span>
                <Badge 
                  variant={Math.abs(corr.correlation) > 0.7 ? 'default' : 
                          Math.abs(corr.correlation) > 0.5 ? 'secondary' : 'outline'}
                >
                  {corr.strength}
                </Badge>
                {corr.significant !== undefined && (
                  corr.significant ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )
                )}
              </div>
            </div>
            {corr.p_value !== undefined && (
              <div className="text-sm text-muted-foreground">
                p = {corr.p_value.toFixed(3)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderScatterPlot = () => {
    if (!selectedPair || !data.length) return null;

    const { column1, column2 } = selectedPair;
    const x = data.map(row => row[column1]).filter(val => typeof val === 'number' && !isNaN(val));
    const y = data.map(row => row[column2]).filter(val => typeof val === 'number' && !isNaN(val));

    const plotData = [{
      x: x,
      y: y,
      type: 'scatter',
      mode: 'markers',
      name: `${column1} vs ${column2}`,
      marker: {
        color: '#3b82f6',
        size: 6,
        opacity: 0.7
      },
      hovertemplate: `<b>${column1}</b>: %{x}<br><b>${column2}</b>: %{y}<extra></extra>`
    }];

    const layout = {
      title: `${column1} vs ${column2}`,
      xaxis: { title: column1 },
      yaxis: { title: column2 },
      margin: { l: 60, r: 50, t: 50, b: 60 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-96 w-full" id="scatter-plot">
        {/* Plotly scatter plot will be rendered here */}
      </div>
    );
  };

  const renderMethodInfo = () => {
    const methodInfo = {
      pearson: {
        name: 'Pearson',
        description: 'Measures linear correlation between variables',
        use: 'Best for normally distributed data with linear relationships'
      },
      spearman: {
        name: 'Spearman',
        description: 'Measures monotonic correlation (rank-based)',
        use: 'Best for non-linear relationships and ordinal data'
      },
      kendall: {
        name: 'Kendall',
        description: 'Measures concordance between rankings',
        use: 'Best for small datasets and when outliers are present'
      }
    };

    const info = methodInfo[correlationMethod];
    
    return (
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4" />
          <span className="font-medium">{info.name} Correlation</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{info.description}</p>
        <p className="text-xs text-muted-foreground">{info.use}</p>
      </div>
    );
  };

  const exportCorrelations = () => {
    if (!correlationResults) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      method: correlationMethod,
      columns: selectedColumns,
      correlations: correlationResults.correlations,
      correlation_matrix: correlationResults.correlation_matrix
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correlations-${Date.now()}.json`;
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

  if (numericColumns.length < 2) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Correlation Analysis
          </CardTitle>
          <CardDescription>
            Analyze relationships between numeric variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Need at least 2 numeric columns for correlation analysis.
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
              <TrendingUp className="h-5 w-5" />
              Correlation Analysis
            </CardTitle>
            <CardDescription>
              Analyze relationships between numeric variables
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={correlationMethod} onValueChange={(value: any) => setCorrelationMethod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pearson">Pearson</SelectItem>
                <SelectItem value="spearman">Spearman</SelectItem>
                <SelectItem value="kendall">Kendall</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCorrelations} disabled={!correlationResults}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderMethodInfo()}

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {numericColumns.map(col => (
              <Badge 
                key={col}
                variant={selectedColumns.includes(col) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  if (selectedColumns.includes(col)) {
                    setSelectedColumns(selectedColumns.filter(c => c !== col));
                  } else {
                    setSelectedColumns([...selectedColumns, col]);
                  }
                }}
              >
                {col}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click columns to include/exclude from analysis (minimum 2 required)
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Calculating correlations...</span>
          </div>
        )}

        {correlationResults && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="scatter" disabled={!selectedPair}>Scatter Plot</TabsTrigger>
            </TabsList>

            <TabsContent value="heatmap" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    Correlation Heatmap
                  </CardTitle>
                  <CardDescription>
                    Visual representation of correlations between variables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderCorrelationHeatmap()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Correlation Pairs
                  </CardTitle>
                  <CardDescription>
                    Detailed correlation values with significance testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderCorrelationTable()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scatter" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Scatter Plot
                  </CardTitle>
                  <CardDescription>
                    Visualize the relationship between {selectedPair?.column1} and {selectedPair?.column2}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderScatterPlot()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
