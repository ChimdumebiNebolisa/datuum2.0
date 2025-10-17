'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  Download, 
  Calendar,
  BarChart3,
  Info,
  CheckCircle,
  AlertTriangle,
  Activity,
  Zap
} from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import Plotly from 'plotly.js-dist-min';

interface TimeSeriesPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface TimeSeriesResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  forecast: number[];
  confidence_interval: {
    lower: number[];
    upper: number[];
  };
  metrics: {
    mse: number;
    mae: number;
    mape: number;
  };
  decomposition: {
    trend_strength: number;
    seasonal_strength: number;
    noise_strength: number;
  };
}

export function TimeSeriesPanel({ data, dataColumns, className }: TimeSeriesPanelProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [timeColumn, setTimeColumn] = useState<string>('');
  const [timeSeriesResult, setTimeSeriesResult] = useState<TimeSeriesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('decomposition');
  const [forecastPeriods, setForecastPeriods] = useState(12);
  const [seasonalPeriod, setSeasonalPeriod] = useState(12);
  const [smoothingFactor, setSmoothingFactor] = useState(0.3);

  const { executePython, isInitialized } = usePythonExecution();

  // Get numeric columns for analysis
  const numericColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });

  // Get potential time columns
  const timeColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 5).map(row => row[col]);
    return sampleValues.some(val => 
      typeof val === 'string' && 
      (val.includes('-') || val.includes('/') || val.includes(' ')) ||
      typeof val === 'number' && val > 1000
    );
  });

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(numericColumns[0]);
    }
    if (timeColumns.length > 0 && !timeColumn) {
      setTimeColumn(timeColumns[0]);
    }
  }, [numericColumns, timeColumns]);

  useEffect(() => {
    if (selectedColumn && isInitialized) {
      analyzeTimeSeries();
    }
  }, [selectedColumn, timeColumn, isInitialized]);

  const analyzeTimeSeries = async () => {
    if (!isInitialized || !selectedColumn) return;

    setLoading(true);
    setError(null);

    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})

# Sort by time column if available
${timeColumn ? `df = df.sort_values('${timeColumn}')` : ''}

# Get the time series data
ts_data = df['${selectedColumn}'].dropna().values

if len(ts_data) < 12:
    result = {
        'success': False,
        'error': 'Need at least 12 data points for time series analysis'
    }
else:
    # Seasonal decomposition
    try:
        decomposition = seasonal_decompose(ts_data, model='additive', period=${seasonalPeriod})
        trend = decomposition.trend[~np.isnan(decomposition.trend)].tolist()
        seasonal = decomposition.seasonal[~np.isnan(decomposition.seasonal)].tolist()
        residual = decomposition.resid[~np.isnan(decomposition.resid)].tolist()
    except:
        # Fallback to simple decomposition
        trend = np.convolve(ts_data, np.ones(3)/3, mode='valid').tolist()
        seasonal = (ts_data - trend).tolist()
        residual = (ts_data - trend - seasonal).tolist()

    # Exponential smoothing forecast
    try:
        model = ExponentialSmoothing(ts_data, trend='add', seasonal='add', seasonal_periods=${seasonalPeriod})
        fitted_model = model.fit(smoothing_level=${smoothingFactor})
        forecast = fitted_model.forecast(steps=${forecastPeriods}).tolist()
        
        # Simple confidence interval (approximation)
        last_value = ts_data[-1]
        std_dev = np.std(ts_data)
        confidence_lower = [max(0, f - 1.96 * std_dev) for f in forecast]
        confidence_upper = [f + 1.96 * std_dev for f in forecast]
    except:
        # Simple linear trend forecast
        x = np.arange(len(ts_data))
        coeffs = np.polyfit(x, ts_data, 1)
        forecast_x = np.arange(len(ts_data), len(ts_data) + ${forecastPeriods})
        forecast = (coeffs[0] * forecast_x + coeffs[1]).tolist()
        confidence_lower = [f * 0.8 for f in forecast]
        confidence_upper = [f * 1.2 for f in forecast]

    # Calculate metrics
    if len(forecast) > 0:
        # Use last part of data for validation
        split_point = int(len(ts_data) * 0.8)
        train_data = ts_data[:split_point]
        test_data = ts_data[split_point:]
        
        if len(test_data) > 0:
            # Simple forecast for validation
            x_train = np.arange(len(train_data))
            coeffs = np.polyfit(x_train, train_data, 1)
            x_test = np.arange(len(train_data), len(train_data) + len(test_data))
            pred = coeffs[0] * x_test + coeffs[1]
            
            mse = mean_squared_error(test_data, pred)
            mae = mean_absolute_error(test_data, pred)
            mape = np.mean(np.abs((test_data - pred) / test_data)) * 100
        else:
            mse = mae = mape = 0
    else:
        mse = mae = mape = 0

    # Calculate decomposition strengths
    trend_strength = np.var(trend) / np.var(ts_data) if len(trend) > 0 else 0
    seasonal_strength = np.var(seasonal) / np.var(ts_data) if len(seasonal) > 0 else 0
    noise_strength = np.var(residual) / np.var(ts_data) if len(residual) > 0 else 0

    result = {
        'success': True,
        'trend': trend,
        'seasonal': seasonal,
        'residual': residual,
        'forecast': forecast,
        'confidence_interval': {
            'lower': confidence_lower,
            'upper': confidence_upper
        },
        'metrics': {
            'mse': float(mse),
            'mae': float(mae),
            'mape': float(mape)
        },
        'decomposition': {
            'trend_strength': float(trend_strength),
            'seasonal_strength': float(seasonal_strength),
            'noise_strength': float(noise_strength)
        }
    }

result
      `;

      const result = await executePython(code);
      
      if ((result as any).success) {
        setTimeSeriesResult(result as any);
      } else {
        setError((result as any).error || 'Failed to analyze time series');
      }
    } catch (error) {
      setError('Error analyzing time series');
      console.error('Time series analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDecompositionChart = () => {
    if (!timeSeriesResult || !selectedColumn) return null;

    const { trend, seasonal, residual } = timeSeriesResult;
    const originalData = data.map(row => row[selectedColumn]).filter(val => typeof val === 'number' && !isNaN(val));

    const plotData = [
      {
        x: Array.from({ length: originalData.length }, (_, i) => i),
        y: originalData,
        type: 'scatter',
        mode: 'lines',
        name: 'Original',
        line: { color: '#3b82f6' }
      },
      {
        x: Array.from({ length: trend.length }, (_, i) => i),
        y: trend,
        type: 'scatter',
        mode: 'lines',
        name: 'Trend',
        line: { color: '#ef4444' }
      },
      {
        x: Array.from({ length: seasonal.length }, (_, i) => i),
        y: seasonal,
        type: 'scatter',
        mode: 'lines',
        name: 'Seasonal',
        line: { color: '#10b981' }
      },
      {
        x: Array.from({ length: residual.length }, (_, i) => i),
        y: residual,
        type: 'scatter',
        mode: 'lines',
        name: 'Residual',
        line: { color: '#f59e0b' }
      }
    ];

    const layout = {
      title: `Time Series Decomposition - ${selectedColumn}`,
      xaxis: { title: 'Time' },
      yaxis: { title: selectedColumn },
      margin: { l: 60, r: 50, t: 50, b: 60 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-96 w-full" id="decomposition-chart">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const renderForecastChart = () => {
    if (!timeSeriesResult || !selectedColumn) return null;

    const { forecast, confidence_interval } = timeSeriesResult;
    const originalData = data.map(row => row[selectedColumn]).filter(val => typeof val === 'number' && !isNaN(val));
    const forecastX = Array.from({ length: forecast.length }, (_, i) => originalData.length + i);

    const plotData = [
      {
        x: Array.from({ length: originalData.length }, (_, i) => i),
        y: originalData,
        type: 'scatter',
        mode: 'lines',
        name: 'Historical Data',
        line: { color: '#3b82f6' }
      },
      {
        x: forecastX,
        y: forecast,
        type: 'scatter',
        mode: 'lines',
        name: 'Forecast',
        line: { color: '#ef4444', dash: 'dash' }
      },
      {
        x: [...forecastX, ...forecastX.slice().reverse()],
        y: [...confidence_interval.upper, ...confidence_interval.lower.slice().reverse()],
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        name: 'Confidence Interval',
        line: { color: 'rgba(239, 68, 68, 0.3)' },
        fillcolor: 'rgba(239, 68, 68, 0.1)'
      }
    ];

    const layout = {
      title: `Forecast - ${selectedColumn}`,
      xaxis: { title: 'Time' },
      yaxis: { title: selectedColumn },
      margin: { l: 60, r: 50, t: 50, b: 60 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-96 w-full" id="forecast-chart">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const renderMetrics = () => {
    if (!timeSeriesResult) return null;

    const { metrics, decomposition } = timeSeriesResult;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MSE</p>
                <p className="text-2xl font-bold">{metrics.mse.toFixed(2)}</p>
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
                <p className="text-2xl font-bold">{metrics.mae.toFixed(2)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MAPE</p>
                <p className="text-2xl font-bold">{metrics.mape.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDecompositionStrength = () => {
    if (!timeSeriesResult) return null;

    const { decomposition } = timeSeriesResult;

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Trend Strength</span>
            <span className="text-sm text-muted-foreground">{(decomposition.trend_strength * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${decomposition.trend_strength * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Seasonal Strength</span>
            <span className="text-sm text-muted-foreground">{(decomposition.seasonal_strength * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${decomposition.seasonal_strength * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Noise Strength</span>
            <span className="text-sm text-muted-foreground">{(decomposition.noise_strength * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-yellow-600 h-2 rounded-full" 
              style={{ width: `${decomposition.noise_strength * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const exportTimeSeries = () => {
    if (!timeSeriesResult) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      column: selectedColumn,
      timeColumn: timeColumn,
      parameters: {
        forecastPeriods,
        seasonalPeriod,
        smoothingFactor
      },
      results: timeSeriesResult
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

  if (numericColumns.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Time Series Analysis
          </CardTitle>
          <CardDescription>
            Analyze trends, seasonality, and forecast future values
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
              <TrendingUp className="h-5 w-5" />
              Time Series Analysis
            </CardTitle>
            <CardDescription>
              Analyze trends, seasonality, and forecast future values
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportTimeSeries} disabled={!timeSeriesResult}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Value Column</label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {timeColumns.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Time Column (Optional)</label>
              <Select value={timeColumn} onValueChange={setTimeColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {timeColumns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Forecast Periods: {forecastPeriods}</label>
            <Slider
              value={[forecastPeriods]}
              onValueChange={(value) => setForecastPeriods(value[0])}
              min={1}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Seasonal Period: {seasonalPeriod}</label>
            <Slider
              value={[seasonalPeriod]}
              onValueChange={(value) => setSeasonalPeriod(value[0])}
              min={2}
              max={24}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Smoothing Factor: {smoothingFactor.toFixed(1)}</label>
            <Slider
              value={[smoothingFactor]}
              onValueChange={(value) => setSmoothingFactor(value[0])}
              min={0.1}
              max={1}
              step={0.1}
              className="mt-2"
            />
          </div>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="decomposition">Decomposition</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="decomposition" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Time Series Decomposition
                  </CardTitle>
                  <CardDescription>
                    Break down the time series into trend, seasonal, and residual components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderDecompositionChart()}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Decomposition Strength</CardTitle>
                  <CardDescription>
                    Relative strength of each component
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderDecompositionStrength()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forecast" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Forecast
                  </CardTitle>
                  <CardDescription>
                    Predict future values with confidence intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderForecastChart()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Model Performance
                  </CardTitle>
                  <CardDescription>
                    Accuracy metrics for the forecasting model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderMetrics()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
