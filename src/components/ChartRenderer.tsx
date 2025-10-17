'use client';

import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, RotateCcw } from 'lucide-react';

interface ChartRendererProps {
  data: any[];
  chartType: string;
  config?: {
    x_axis?: string;
    y_axis?: string;
    color_axis?: string;
    title?: string;
    [key: string]: any;
  };
  className?: string;
}

export function ChartRenderer({ data, chartType, config, className }: ChartRendererProps) {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current || !data.length) return;

    const plotData = generatePlotData(data, chartType, config);
    const layout = generateLayout(chartType, config);

    Plotly.newPlot(plotRef.current, plotData as any, layout as any, {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
      displaylogo: false
    });

    // Handle resize
    const handleResize = () => {
      if (plotRef.current) {
        Plotly.Plots.resize(plotRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data, chartType, config]);

  const generatePlotData = (data: any[], type: string, config: any) => {
    if (!data.length) return [];

    const xAxis = config?.x_axis || Object.keys(data[0])[0];
    const yAxis = config?.y_axis || Object.keys(data[0])[1];
    const colorAxis = config?.color_axis;

    const x = data.map(row => row[xAxis]);
    const y = data.map(row => row[yAxis]);
    const color = colorAxis ? data.map(row => row[colorAxis]) : undefined;

    switch (type) {
      case 'bar':
        return [{
          x: x,
          y: y,
          type: 'bar',
          name: yAxis,
          marker: {
            color: color || '#3b82f6',
            opacity: 0.8
          }
        }];

      case 'line':
        return [{
          x: x,
          y: y,
          type: 'scatter',
          mode: 'lines+markers',
          name: yAxis,
          line: {
            color: color ? undefined : '#3b82f6',
            width: 2
          },
          marker: {
            size: 6
          }
        }];

      case 'scatter':
        return [{
          x: x,
          y: y,
          type: 'scatter',
          mode: 'markers',
          name: `${yAxis} vs ${xAxis}`,
          marker: {
            color: color || '#3b82f6',
            size: 8,
            opacity: 0.7
          }
        }];

      case 'pie':
        // Group data by x-axis values
        const pieData = x.reduce((acc: any, val, i) => {
          acc[val] = (acc[val] || 0) + (y[i] || 0);
          return acc;
        }, {});
        
        return [{
          labels: Object.keys(pieData),
          values: Object.values(pieData),
          type: 'pie',
          marker: {
            colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
          }
        }];

      case 'histogram':
        return [{
          x: y,
          type: 'histogram',
          name: yAxis,
          marker: {
            color: '#3b82f6',
            opacity: 0.7
          }
        }];

      case 'box':
        return [{
          y: y,
          type: 'box',
          name: yAxis,
          marker: {
            color: '#3b82f6'
          }
        }];

      case 'heatmap':
        // Create correlation matrix if we have multiple numeric columns
        const numericColumns = Object.keys(data[0]).filter(key => 
          typeof data[0][key] === 'number'
        );
        
        if (numericColumns.length >= 2) {
          const correlationData = numericColumns.map(col1 => 
            numericColumns.map(col2 => {
              const col1Data = data.map(row => row[col1]);
              const col2Data = data.map(row => row[col2]);
              return calculateCorrelation(col1Data, col2Data);
            })
          );
          
          return [{
            z: correlationData,
            x: numericColumns,
            y: numericColumns,
            type: 'heatmap',
            colorscale: 'RdBu',
            zmid: 0
          }];
        }
        return [];

      default:
        return [{
          x: x,
          y: y,
          type: 'bar',
          name: yAxis
        }];
    }
  };

  const generateLayout = (type: string, config: any) => {
    const baseLayout = {
      title: {
        text: config?.title || `Chart: ${type}`,
        font: { size: 16 }
      },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' },
      xaxis: {
        gridcolor: 'hsl(var(--border))',
        linecolor: 'hsl(var(--border))'
      },
      yaxis: {
        gridcolor: 'hsl(var(--border))',
        linecolor: 'hsl(var(--border))'
      }
    };

    switch (type) {
      case 'pie':
        return {
          ...baseLayout,
          showlegend: true,
          legend: { orientation: 'v' }
        };
      case 'heatmap':
        return {
          ...baseLayout,
          xaxis: { ...baseLayout.xaxis, side: 'bottom' },
          yaxis: { ...baseLayout.yaxis, autorange: 'reversed' }
        };
      default:
        return baseLayout;
    }
  };

  const calculateCorrelation = (x: number[], y: number[]) => {
    if (x.length !== y.length) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const downloadChart = (format: 'png' | 'svg' | 'jpeg' = 'png') => {
    if (!plotRef.current) return;
    
    Plotly.downloadImage(plotRef.current, {
      format: format,
      width: 800,
      height: 600,
      filename: `chart-${chartType}`
    });
  };

  const resetView = () => {
    if (plotRef.current) {
      Plotly.relayout(plotRef.current, {});
    }
  };

  if (!data.length) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available for visualization</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize">{chartType} Chart</CardTitle>
            <CardDescription>
              {data.length} data points
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadChart('png')}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={plotRef} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        />
      </CardContent>
    </Card>
  );
}
