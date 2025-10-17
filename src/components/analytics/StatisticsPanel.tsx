'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Calculator,
  CheckCircle,
  AlertTriangle,
  Minus
} from 'lucide-react';
import { exportAnalyticsData } from '@/lib/analytics-utils';
import { DataRow, StatisticsResult, DistributionResult, PythonExecutionResult } from '@/types/analytics';
import { BaseAnalyticsPanel } from './shared/BaseAnalyticsPanel';
import { useAnalyticsPanel } from './shared/useAnalyticsPanel';
import { ColumnSelector } from './shared/ColumnSelector';
import { MethodInfo } from './shared/MethodInfo';

interface StatisticsPanelProps {
  data: DataRow[];
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

interface StatisticsExecutionResult extends PythonExecutionResult {
  statistics?: Record<string, StatisticsResult>;
}

interface DistributionExecutionResult extends PythonExecutionResult {
  bin_edges?: number[];
  frequencies?: number[];
  type?: 'numeric' | 'categorical';
  distribution?: Record<string, number>;
}

// interface DistributionData {
//   bins: number[];
//   frequencies: number[];
//   type: 'numeric' | 'categorical';
//   distribution?: Record<string, number>;
// }

/**
 * StatisticsPanel component for displaying descriptive statistics and data distribution
 * 
 * @param data - Array of data objects to analyze
 * @param dataColumns - Array of column names in the data
 * @param className - Optional CSS class name for styling
 * @returns JSX element containing statistics analysis interface
 */
export function StatisticsPanel({ data, dataColumns, className }: StatisticsPanelProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<Record<string, StatisticsResult> | null>(null);
  const [distribution, setDistribution] = useState<DistributionResult | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  const {
    loading,
    error,
    isInitialized,
    hasValidData,
    numericColumns,
    executeWithErrorHandling
  } = useAnalyticsPanel({
    data,
    dataColumns,
    autoExecute: false,
    minColumnsRequired: 1,
    analysisType: 'Statistics Analysis'
  });

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0]);
      setSelectedColumns([numericColumns[0]]);
    }
  }, [numericColumns, selectedColumn]);

  const calculateStatistics = useCallback(async () => {
    if (!isInitialized || selectedColumns.length === 0) return;

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

    await executeWithErrorHandling(
      code,
      (result) => {
        const typedResult = result as StatisticsExecutionResult;
        setStatistics(typedResult.statistics || {});
      },
      'Failed to calculate statistics'
    );
  }, [isInitialized, selectedColumns, data, executeWithErrorHandling]);

  useEffect(() => {
    if (selectedColumns.length > 0 && isInitialized) {
      calculateStatistics();
    }
  }, [selectedColumns, isInitialized, calculateStatistics]);

  const analyzeDistribution = useCallback(async (column: string) => {
    if (!isInitialized) return;

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

    await executeWithErrorHandling(
      code,
      (result) => {
        const typedResult = result as DistributionExecutionResult;
        setDistribution({
          bins: typedResult.bin_edges || [],
          frequencies: typedResult.frequencies || [],
          type: typedResult.type || 'numeric',
          distribution: typedResult.distribution
        });
      },
      'Failed to analyze distribution'
    );
  }, [isInitialized, data, executeWithErrorHandling]);

  useEffect(() => {
    if (selectedColumn) {
      analyzeDistribution(selectedColumn);
    }
  }, [selectedColumn, analyzeDistribution]);

  const getStatCards = (): StatCard[] => {
    if (!statistics || selectedColumns.length === 0) return [];

    const cards: StatCard[] = [];
    
    selectedColumns.forEach(column => {
      const stats = statistics?.[column];
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

  const getDetailedStats = () => {
    if (!statistics || selectedColumns.length === 0) return null;

    return selectedColumns.map(column => {
      const stats = statistics?.[column];
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
                  {stats.skewness?.toFixed(3) || 'N/A'}
                  {stats.skewness && Math.abs(stats.skewness) > 1 ? (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Kurtosis</div>
                <div className="text-lg font-semibold">{stats.kurtosis?.toFixed(3) || 'N/A'}</div>
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

  const getDistributionChart = () => {
    if (!distribution || distribution.type !== 'numeric') return null;

    // Plot data and layout configuration for Plotly histogram
    // const plotData = [{
    //   x: distribution.bins.slice(1),
    //   y: distribution.frequencies,
    //   type: 'bar',
    //   name: selectedColumn,
    //   marker: {
    //     color: '#3b82f6',
    //     opacity: 0.7
    //   }
    // }];

    // const layout = {
    //   title: `Distribution of ${selectedColumn}`,
    //   xaxis: { title: selectedColumn },
    //   yaxis: { title: 'Frequency' },
    //   margin: { l: 50, r: 50, t: 50, b: 50 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

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

    exportAnalyticsData(exportData, `statistics-${Date.now()}`);
  };

  return (
    <BaseAnalyticsPanel
      title="Statistics Analysis"
      description="Calculate descriptive statistics for your data"
      icon={<Calculator className="h-5 w-5" />}
      data={data}
      dataColumns={dataColumns}
      className={className}
      isInitialized={isInitialized}
      loading={loading}
      error={error}
      hasValidData={hasValidData}
      noDataMessage="No numeric columns found in your data. Statistics analysis requires numeric data."
      onExport={exportStatistics}
      canExport={!!statistics}
    >
      {/* Column Selection */}
      <div className="mb-6">
        <ColumnSelector
          columns={numericColumns}
          selectedColumns={[selectedColumn]}
          onSelectionChange={(columns) => {
            const newColumn = columns[0] || '';
            setSelectedColumn(newColumn);
            setSelectedColumns([newColumn]);
          }}
          multiSelect={false}
          label="Select Column"
          description="Choose a numeric column for statistics analysis"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getStatCards().map((card, index) => (
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
            {getDetailedStats()}
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
                  getDistributionChart()
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </BaseAnalyticsPanel>
  );
}
