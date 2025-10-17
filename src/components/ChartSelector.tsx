'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Zap, 
  Activity, 
  Box, 
  Grid3X3,
  TrendingUp,
  Target,
  CheckCircle
} from 'lucide-react';

interface ChartType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  suitableFor: string[];
  score?: number;
  confidence?: string;
}

interface ChartSelectorProps {
  onSelectChart: (chartType: string, config: any) => void;
  recommendations?: Array<{
    chart_type: string;
    score: number;
    description: string;
    suitable_for: string[];
    confidence: string;
  }>;
  dataColumns?: string[];
  className?: string;
}

export function ChartSelector({ 
  onSelectChart, 
  recommendations = [], 
  dataColumns = [],
  className 
}: ChartSelectorProps) {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const chartTypes: ChartType[] = [
    {
      id: 'bar',
      name: 'Bar Chart',
      description: 'Compare values across categories',
      icon: <BarChart3 className="h-5 w-5" />,
      suitableFor: ['Categorical data', 'Comparisons', 'Rankings']
    },
    {
      id: 'line',
      name: 'Line Chart',
      description: 'Show trends and changes over time',
      icon: <LineChart className="h-5 w-5" />,
      suitableFor: ['Time series', 'Trends', 'Continuous data']
    },
    {
      id: 'scatter',
      name: 'Scatter Plot',
      description: 'Show relationships between two variables',
      icon: <Zap className="h-5 w-5" />,
      suitableFor: ['Correlations', 'Distributions', 'Outliers']
    },
    {
      id: 'pie',
      name: 'Pie Chart',
      description: 'Show proportions of a whole',
      icon: <PieChart className="h-5 w-5" />,
      suitableFor: ['Part-to-whole', 'Proportions', 'Percentages']
    },
    {
      id: 'histogram',
      name: 'Histogram',
      description: 'Show distribution of a single variable',
      icon: <Activity className="h-5 w-5" />,
      suitableFor: ['Distributions', 'Frequency', 'Bins']
    },
    {
      id: 'box',
      name: 'Box Plot',
      description: 'Show distribution and outliers',
      icon: <Box className="h-5 w-5" />,
      suitableFor: ['Distributions', 'Outliers', 'Quartiles']
    },
    {
      id: 'heatmap',
      name: 'Heatmap',
      description: 'Show correlation matrix or 2D patterns',
      icon: <Grid3X3 className="h-5 w-5" />,
      suitableFor: ['Correlations', 'Patterns', 'Matrix data']
    }
  ];

  // Merge recommendations with chart types
  const chartsWithRecommendations = chartTypes.map(chart => {
    const recommendation = recommendations.find(rec => rec.chart_type === chart.id);
    return {
      ...chart,
      score: recommendation?.score || 0,
      confidence: recommendation?.confidence || 'Low'
    };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleChartSelect = (chartType: ChartType) => {
    setSelectedChart(chartType.id);
    
    // Generate basic configuration
    const config = generateChartConfig(chartType.id, dataColumns);
    onSelectChart(chartType.id, config);
  };

  const generateChartConfig = (chartType: string, columns: string[]) => {
    const config: any = {
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
    };

    switch (chartType) {
      case 'bar':
      case 'line':
        if (columns.length >= 2) {
          config.x_axis = columns[0];
          config.y_axis = columns[1];
        }
        break;
      case 'scatter':
        if (columns.length >= 2) {
          config.x_axis = columns[0];
          config.y_axis = columns[1];
          if (columns.length >= 3) {
            config.color_axis = columns[2];
          }
        }
        break;
      case 'pie':
        if (columns.length >= 1) {
          config.label_column = columns[0];
          config.value_column = columns[1] || columns[0];
        }
        break;
      case 'histogram':
      case 'box':
        if (columns.length >= 1) {
          config.column = columns[0];
        }
        break;
      case 'heatmap':
        config.columns = columns;
        break;
    }

    return config;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-gray-500';
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Choose Chart Type
          </CardTitle>
          <CardDescription>
            Select the best visualization for your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Recommendations</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on your data characteristics, here are the best chart types:
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartsWithRecommendations.map((chart) => (
              <Card 
                key={chart.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedChart === chart.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleChartSelect(chart)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {chart.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{chart.name}</h3>
                        {chart.score && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${getScoreColor(chart.score)}`}>
                              {Math.round(chart.score * 100)}% match
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getConfidenceColor(chart.confidence)}`}
                            >
                              {chart.confidence}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedChart === chart.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {chart.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {chart.suitableFor.slice(0, 2).map((use) => (
                      <Badge key={use} variant="outline" className="text-xs">
                        {use}
                      </Badge>
                    ))}
                    {chart.suitableFor.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{chart.suitableFor.length - 2} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {dataColumns.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Available Columns</h4>
              <div className="flex flex-wrap gap-2">
                {dataColumns.map((column) => (
                  <Badge key={column} variant="secondary" className="text-xs">
                    {column}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
