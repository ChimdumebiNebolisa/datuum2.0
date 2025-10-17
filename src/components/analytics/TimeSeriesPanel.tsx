'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Download, 
  TrendingUp,
  BarChart3,
  Info,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { useAnalyticsPanel } from './shared/useAnalyticsPanel';
import { logger } from '@/lib/logger';

interface TimeSeriesPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface TimeSeriesResult {
  method: string;
  trend: number[];
  seasonal: number[];
  residual: number[];
  sma?: number[];
  ema?: number[];
  forecast?: number[];
  confidence_intervals?: {
    upper: number[];
    lower: number[];
  };
  metrics: {
    mse?: number;
    mae?: number;
    rmse?: number;
  };
  decomposition: {
    trend_strength: number;
    seasonal_strength: number;
  };
}

export function TimeSeriesPanel({ data, dataColumns, className }: TimeSeriesPanelProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('decomposition');
  const [timeSeriesResult, setTimeSeriesResult] = useState<TimeSeriesResult | null>(null);
  const [activeTab, setActiveTab] = useState('decomposition');
  const [forecastPeriods, setForecastPeriods] = useState(12);
  const [windowSize, setWindowSize] = useState(12);

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
    analysisType: 'Time Series Analysis'
  });

  const timeSeriesMethods = [
    {
      id: 'decomposition',
      name: 'Seasonal Decomposition',
      description: 'Decompose time series into trend, seasonal, and residual components'
    },
    {
      id: 'moving_average',
      name: 'Moving Average',
      description: 'Calculate simple and exponential moving averages'
    },
    {
      id: 'forecast',
      name: 'Forecasting',
      description: 'Generate future predictions using exponential smoothing'
    }
  ];

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns, selectedColumn]);

  const performTimeSeriesAnalysis = useCallback(async () => {
    if (!isInitialized || !selectedColumn) return;
      let code = '';
      
      if (selectedMethod === 'decomposition') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from scipy import stats
from scipy.signal import periodogram
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
time_series = df['${selectedColumn}'].dropna().values
n = len(time_series)

# Simple seasonal decomposition (assuming monthly data)
period = ${windowSize}
if n < period * 2:
    period = max(2, n // 4)

# Calculate moving average for trend
trend = np.convolve(time_series, np.ones(period)/period, mode='valid')
# Pad trend to match original length
trend_padded = np.full(n, np.nan)
start_idx = period // 2
trend_padded[start_idx:start_idx + len(trend)] = trend

# Calculate seasonal component
seasonal = np.zeros(n)
for i in range(period):
    seasonal[i::period] = np.mean(time_series[i::period]) - np.mean(time_series)

# Calculate residual
residual = time_series - trend_padded - seasonal

# Calculate decomposition strength
trend_strength = max(0, 1 - np.var(residual) / np.var(trend_padded + residual))
seasonal_strength = max(0, 1 - np.var(residual) / np.var(seasonal + residual))

result = {
    'method': 'Seasonal Decomposition',
    'trend': trend_padded.tolist(),
    'seasonal': seasonal.tolist(),
    'residual': residual.tolist(),
    'decomposition': {
        'trend_strength': float(trend_strength),
        'seasonal_strength': float(seasonal_strength)
    }
}
result
        `;
      } else if (selectedMethod === 'moving_average') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
time_series = df['${selectedColumn}'].dropna().values
n = len(time_series)

# Simple Moving Average
window = ${windowSize}
sma = np.full(n, np.nan)
for i in range(window - 1, n):
    sma[i] = np.mean(time_series[i - window + 1:i + 1])

# Exponential Moving Average
alpha = 0.3  # smoothing factor
ema = np.zeros(n)
ema[0] = time_series[0]
for i in range(1, n):
    ema[i] = alpha * time_series[i] + (1 - alpha) * ema[i - 1]

result = {
    'method': 'Moving Average',
    'sma': sma.tolist(),
    'ema': ema.tolist(),
    'original': time_series.tolist()
}
result
        `;
      } else if (selectedMethod === 'forecast') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
time_series = df['${selectedColumn}'].dropna().values
n = len(time_series)

# Simple exponential smoothing forecast
alpha = 0.3
forecast_periods = ${forecastPeriods}

# Initialize
level = time_series[0]
forecast = []
confidence_upper = []
confidence_lower = []

# Calculate level for all historical data
levels = [level]
for i in range(1, n):
    level = alpha * time_series[i] + (1 - alpha) * level
    levels.append(level)

# Generate forecast
current_level = levels[-1]
for i in range(forecast_periods):
    forecast.append(current_level)
    # Simple confidence interval (assuming normal distribution)
    std_error = np.std(time_series) * 0.1  # Simplified
    confidence_upper.append(current_level + 1.96 * std_error)
    confidence_lower.append(current_level - 1.96 * std_error)

# Calculate metrics on last portion of data
test_size = min(10, n // 4)
if test_size > 0:
    test_data = time_series[-test_size:]
    test_forecast = levels[-test_size:]
    mse = np.mean((test_data - test_forecast) ** 2)
    mae = np.mean(np.abs(test_data - test_forecast))
    rmse = np.sqrt(mse)
else:
    mse = mae = rmse = 0

result = {
    'method': 'Exponential Smoothing Forecast',
    'forecast': forecast,
    'confidence_intervals': {
        'upper': confidence_upper,
        'lower': confidence_lower
    },
    'metrics': {
        'mse': float(mse),
        'mae': float(mae),
        'rmse': float(rmse)
    },
    'levels': levels
}
result
        `;
      }

      await executeWithErrorHandling(
        code,
        (result) => {
          setTimeSeriesResult(result as TimeSeriesResult);
        },
        'Failed to perform time series analysis'
      );
    }, [isInitialized, selectedColumn, selectedMethod, windowSize, forecastPeriods, data, executeWithErrorHandling]);

  const renderDecompositionChart = () => {
    if (!timeSeriesResult || selectedMethod !== 'decomposition') return null;

    // const n = data.length;
    // const x = Array.from({ length: n }, (_, i) => i);

    // Plot data and layout configuration for Plotly decomposition chart
    // const plotData = [
    //   {
    //     x: x,
    //     y: data.map(row => row[selectedColumn]).filter(val => typeof val === 'number'),
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Original',
    //     line: { color: '#3b82f6', width: 2 }
    //   },
    //   {
    //     x: x,
    //     y: timeSeriesResult.trend,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Trend',
    //     line: { color: '#ef4444', width: 2 }
    //   },
    //   {
    //     x: x,
    //     y: timeSeriesResult.seasonal,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Seasonal',
    //     line: { color: '#10b981', width: 2 }
    //   },
    //   {
    //     x: x,
    //     y: timeSeriesResult.residual,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Residual',
    //     line: { color: '#f59e0b', width: 2 }
    //   }
    // ];

    // const layout = {
    //   title: 'Seasonal Decomposition',
    //   xaxis: { title: 'Time Period' },
    //   yaxis: { title: selectedColumn },
    //   margin: { l: 60, r: 50, t: 50, b: 60 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

    return (
      <div className="h-96 w-full" id="decomposition-chart">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const renderMovingAverageChart = () => {
    if (!timeSeriesResult || selectedMethod !== 'moving_average') return null;

    // const n = data.length;
    // const x = Array.from({ length: n }, (_, i) => i);

    // Plot data and layout configuration for Plotly moving average chart
    // const plotData = [
    //   {
    //     x: x,
    //     y: data.map(row => row[selectedColumn]).filter(val => typeof val === 'number'),
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Original',
    //     line: { color: '#3b82f6', width: 1, opacity: 0.7 }
    //   },
    //   {
    //     x: x,
    //     y: timeSeriesResult.sma,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Simple MA',
    //     line: { color: '#ef4444', width: 2 }
    //   },
    //   {
    //     x: x,
    //     y: timeSeriesResult.ema,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Exponential MA',
    //     line: { color: '#10b981', width: 2 }
    //   }
    // ];

    // const layout = {
    //   title: 'Moving Average Analysis',
    //   xaxis: { title: 'Time Period' },
    //   yaxis: { title: selectedColumn },
    //   margin: { l: 60, r: 50, t: 50, b: 60 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

    return (
      <div className="h-96 w-full" id="moving-average-chart">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const renderForecastChart = () => {
    if (!timeSeriesResult || selectedMethod !== 'forecast') return null;

    // const n = data.length;
    // const forecastLength = timeSeriesResult.forecast?.length || 0;
    // 
    // const historicalX = Array.from({ length: n }, (_, i) => i);
    // const forecastX = Array.from({ length: forecastLength }, (_, i) => i + n);

    // Plot data and layout configuration for Plotly forecast chart
    // const plotData = [
    //   {
    //     x: historicalX,
    //     y: data.map(row => row[selectedColumn]).filter(val => typeof val === 'number'),
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Historical Data',
    //     line: { color: '#3b82f6', width: 2 }
    //   },
    //   {
    //     x: forecastX,
    //     y: timeSeriesResult.forecast,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Forecast',
    //     line: { color: '#ef4444', width: 2, dash: 'dash' }
    //   },
    //   {
    //     x: forecastX,
    //     y: timeSeriesResult.confidence_intervals?.upper,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Upper Confidence',
    //     line: { color: '#10b981', width: 1, dash: 'dot' },
    //     showlegend: false
    //   },
    //   {
    //     x: forecastX,
    //     y: timeSeriesResult.confidence_intervals?.lower,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Lower Confidence',
    //     line: { color: '#10b981', width: 1, dash: 'dot' },
    //     fill: 'tonexty',
    //     fillcolor: 'rgba(16, 185, 129, 0.1)'
    //   }
    // ];

    // const layout = {
    //   title: 'Time Series Forecast',
    //   xaxis: { title: 'Time Period' },
    //   yaxis: { title: selectedColumn },
    //   margin: { l: 60, r: 50, t: 50, b: 60 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

    return (
      <div className="h-96 w-full" id="forecast-chart">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const exportTimeSeries = () => {
    if (!timeSeriesResult) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      column: selectedColumn,
      method: timeSeriesResult.method,
      result: timeSeriesResult,
      parameters: {
        forecast_periods: forecastPeriods,
        window_size: windowSize
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeseries-${selectedColumn}-${Date.now()}.json`;
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

  if (!hasValidData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Time Series Analysis
          </CardTitle>
          <CardDescription>
            Analyze temporal patterns and forecast future values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No numeric columns found. Time series analysis requires numeric data.
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
              <Calendar className="h-5 w-5" />
              Time Series Analysis
            </CardTitle>
            <CardDescription>
              Analyze temporal patterns and forecast future values
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
            <Button variant="outline" size="sm" onClick={exportTimeSeries} disabled={!timeSeriesResult}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Method Selection and Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Analysis Method</label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSeriesMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Window Size: {windowSize}</label>
            <input
              type="range"
              min="2"
              max="24"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>
          
          {selectedMethod === 'forecast' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Forecast Periods: {forecastPeriods}</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={forecastPeriods}
                onChange={(e) => setForecastPeriods(Number(e.target.value))}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Method Info */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4" />
            <span className="font-medium text-sm">
              {timeSeriesMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {timeSeriesMethods.find(m => m.id === selectedMethod)?.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 mb-6">
          <Button onClick={performTimeSeriesAnalysis} disabled={!selectedColumn}>
            <Target className="h-4 w-4 mr-2" />
            Analyze Time Series
          </Button>
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
            <span className="text-sm text-muted-foreground">Analyzing time series...</span>
          </div>
        )}

        {timeSeriesResult && (
          <>
            {/* Results Summary */}
            {selectedMethod === 'decomposition' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Trend Strength</p>
                        <p className="text-2xl font-bold">
                          {(timeSeriesResult.decomposition.trend_strength * 100).toFixed(1)}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Seasonal Strength</p>
                        <p className="text-2xl font-bold">
                          {(timeSeriesResult.decomposition.seasonal_strength * 100).toFixed(1)}%
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedMethod === 'forecast' && timeSeriesResult.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">RMSE</p>
                        <p className="text-2xl font-bold">{timeSeriesResult.metrics.rmse?.toFixed(2)}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">MAE</p>
                        <p className="text-2xl font-bold">{timeSeriesResult.metrics.mae?.toFixed(2)}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">MSE</p>
                        <p className="text-2xl font-bold">{timeSeriesResult.metrics.mse?.toFixed(2)}</p>
                      </div>
                      <Zap className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Visualization */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="decomposition">Decomposition</TabsTrigger>
                <TabsTrigger value="moving_average">Moving Average</TabsTrigger>
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="decomposition" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Seasonal Decomposition</CardTitle>
                    <CardDescription>
                      Breakdown of trend, seasonal, and residual components
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderDecompositionChart()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="moving_average" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Moving Average Analysis</CardTitle>
                    <CardDescription>
                      Simple and exponential moving averages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderMovingAverageChart()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forecast" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Time Series Forecast</CardTitle>
                    <CardDescription>
                      Future predictions with confidence intervals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderForecastChart()}
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