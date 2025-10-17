'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Download, 
  Calculator,
  Info,
  CheckCircle,
  AlertTriangle,
  Minus
} from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import Plotly from 'plotly.js-dist-min';

interface StatisticsPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

interface DistributionData {
  bins: number[];
  frequencies: number[];
  type: 'numeric' | 'categorical';
  distribution?: Record<string, number>;
}

export function StatisticsPanel({ data, dataColumns, className }: StatisticsPanelProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [distribution, setDistribution] = useState<DistributionData | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { executePython, isInitialized } = usePythonExecution();

  // Get numeric columns for analysis
  const numericColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0]);
      setSelectedColumns([numericColumns[0]]);
    }
  }, [numericColumns]);

  useEffect(() => {
    if (selectedColumns.length > 0 && isInitialized) {
      calculateStatistics();
    }
  }, [selectedColumns, isInitialized]);

  const calculateStatistics = async () => {
    if (!isInitialized || selectedColumns.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from statistics import statistics_analyzer

# Set data and calculate statistics
df = pd.DataFrame(${JSON.stringify(data)})
statistics_analyzer.set_data(df)
result = statistics_analyzer.descriptive_statistics(${JSON.stringify(selectedColumns)})
result
      `;

      const result = await executePython(code);
      
      if ((result as any).success) {
        setStatistics((result as any).statistics);
      } else {
        setError((result as any).error || 'Failed to calculate statistics');
      }
    } catch (error) {
      setError('Error calculating statistics');
      console.error('Statistics calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDistribution = async (column: string) => {
    if (!isInitialized) return;

    setLoading(true);
    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from statistics import statistics_analyzer

# Set data and analyze distribution
df = pd.DataFrame(${JSON.stringify(data)})
statistics_analyzer.set_data(df)
result = statistics_analyzer.distribution_analysis('${column}')
result
      `;

      const result = await executePython(code);
      
      if ((result as any).success) {
        setDistribution({
          bins: (result as any).bin_edges || [],
          frequencies: (result as any).frequencies || [],
          type: (result as any).type,
          distribution: (result as any).distribution
        });
      }
    } catch (error) {
      console.error('Distribution analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedColumn) {
      analyzeDistribution(selectedColumn);
    }
  }, [selectedColumn, isInitialized]);

  const renderStatCards = (): StatCard[] => {
    if (!statistics || selectedColumns.length === 0) return [];

    const cards: StatCard[] = [];
    
    selectedColumns.forEach(column => {
      const stats = statistics[column];
      if (!stats) return;

      cards.push(
        {
          title: 'Count',
          value: stats.count.toLocaleString(),
          description: 'Total number of values',
          icon: <Calculator className="h-4 w-4" />
        },
        {
          title: 'Mean',
          value: stats.mean.toFixed(2),
          description: 'Average value',
          icon: <TrendingUp className="h-4 w-4" />
        },
        {
          title: 'Median',
          value: stats.median.toFixed(2),
          description: 'Middle value',
          icon: <Minus className="h-4 w-4" />
        },
        {
          title: 'Std Dev',
          value: stats.std.toFixed(2),
          description: 'Standard deviation',
          icon: <Activity className="h-4 w-4" />
        }
      );
    });

    return cards;
  };

  const renderDetailedStats = () => {
    if (!statistics || selectedColumns.length === 0) return null;

    return selectedColumns.map(column => {
      const stats = statistics[column];
      if (!stats) return null;

      return (
        <Card key={column} className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {column}
            </CardTitle>
            <CardDescription>
              Detailed statistics for {column}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Range</div>
                <div className="text-lg font-semibold">
                  {stats.min.toFixed(2)} - {stats.max.toFixed(2)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">IQR</div>
                <div className="text-lg font-semibold">{stats.iqr.toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Skewness</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  {stats.skewness.toFixed(3)}
                  {Math.abs(stats.skewness) > 1 ? (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Kurtosis</div>
                <div className="text-lg font-semibold">{stats.kurtosis.toFixed(3)}</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Q1 (25%)</div>
                  <div>{stats.q25.toFixed(2)}</div>
                </div>
                <div>
                  <div className="font-medium">Q2 (50%)</div>
                  <div>{stats.q50.toFixed(2)}</div>
                </div>
                <div>
                  <div className="font-medium">Q3 (75%)</div>
                  <div>{stats.q75.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  const renderDistributionChart = () => {
    if (!distribution || distribution.type !== 'numeric') return null;

    const plotData = [{
      x: distribution.bins.slice(1),
      y: distribution.frequencies,
      type: 'bar',
      name: selectedColumn,
      marker: {
        color: '#3b82f6',
        opacity: 0.7
      }
    }];

    const layout = {
      title: `Distribution of ${selectedColumn}`,
      xaxis: { title: selectedColumn },
      yaxis: { title: 'Frequency' },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-64 w-full" id="distribution-chart">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const exportStatistics = () => {
    if (!statistics) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      columns: selectedColumns,
      statistics: statistics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics-${Date.now()}.json`;
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
            <Calculator className="h-5 w-5" />
            Statistics Analysis
          </CardTitle>
          <CardDescription>
            Calculate descriptive statistics for your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No numeric columns found in your data. Statistics analysis requires numeric data.
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
              <Calculator className="h-5 w-5" />
              Statistics Analysis
            </CardTitle>
            <CardDescription>
              Calculate descriptive statistics for your data
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedColumn} onValueChange={(value) => {
              setSelectedColumn(value);
              setSelectedColumns([value]);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportStatistics} disabled={!statistics}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
            <span className="text-sm text-muted-foreground">Calculating statistics...</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderStatCards().map((card, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        {card.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            {renderDetailedStats()}
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Analysis</CardTitle>
                <CardDescription>
                  Visual representation of data distribution for {selectedColumn}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {distribution?.type === 'categorical' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Categorical distribution:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {distribution.distribution && Object.entries(distribution.distribution).map(([value, count]) => (
                        <div key={value} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{value}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  renderDistributionChart()
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
