'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Target, 
  Download, 
  TrendingUp,
  BarChart3,
  Info,
  AlertTriangle,
  Calculator,
  Activity
} from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import { logger } from '@/lib/logger';

interface RegressionPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface RegressionResult {
  method: string;
  equation: string;
  coefficients: Record<string, number>;
  metrics: {
    r_squared: number;
    adjusted_r_squared: number;
    rmse: number;
    mae: number;
    mse: number;
  };
  predictions: number[];
  residuals: number[];
  p_values?: Record<string, number>;
  confidence_intervals?: Record<string, [number, number]>;
}

export function RegressionPanel({ data, dataColumns, className }: RegressionPanelProps) {
  const [selectedXColumns, setSelectedXColumns] = useState<string[]>([]);
  const [selectedYColumn, setSelectedYColumn] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('linear');
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('regression');
  const [polynomialDegree, setPolynomialDegree] = useState(2);
  const [testSize, setTestSize] = useState(0.2);

  const { executePython, isInitialized } = usePythonExecution();

  // Get numeric columns for analysis
  const numericColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });

  const regressionMethods = [
    {
      id: 'linear',
      name: 'Linear Regression',
      description: 'Fits a linear relationship between variables'
    },
    {
      id: 'polynomial',
      name: 'Polynomial Regression',
      description: 'Fits a polynomial relationship of specified degree'
    },
    {
      id: 'multiple',
      name: 'Multiple Linear Regression',
      description: 'Fits linear relationship with multiple predictors'
    }
  ];

  useEffect(() => {
    if (numericColumns.length >= 2) {
      if (!selectedYColumn) {
        setSelectedYColumn(numericColumns[0]);
      }
      if (selectedXColumns.length === 0) {
        setSelectedXColumns([numericColumns[1]]);
      }
    }
  }, [numericColumns, selectedXColumns.length, selectedYColumn]);

  const performRegression = useCallback(async () => {
    if (!isInitialized || selectedXColumns.length === 0 || !selectedYColumn) return;

    setLoading(true);
    setError(null);

    try {
      let code = '';
      
      if (selectedMethod === 'linear' && selectedXColumns.length === 1) {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
X = df[${JSON.stringify(selectedXColumns)}].dropna()
y = df['${selectedYColumn}'].dropna()

# Align X and y
common_idx = X.index.intersection(y.index)
X = X.loc[common_idx]
y = y.loc[common_idx]

if len(X) < 10:
    raise ValueError("Not enough data points for regression")

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=${testSize}, random_state=42)

# Linear Regression
model = LinearRegression()
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)
predictions = model.predict(X).tolist()

# Calculate residuals
residuals = (y - predictions).tolist()

# Metrics
r_squared = r2_score(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mse)

# Adjusted R-squared
n = len(y_test)
p = len(selectedXColumns)
adjusted_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - p - 1)

# Equation
intercept = model.intercept_
coefficient = model.coef_[0]
equation = f"y = {coefficient:.4f} * {selectedXColumns[0]} + {intercept:.4f}"

result = {
    'method': 'Linear Regression',
    'equation': equation,
    'coefficients': {
        'intercept': float(intercept),
        'slope': float(coefficient)
    },
    'metrics': {
        'r_squared': float(r_squared),
        'adjusted_r_squared': float(adjusted_r_squared),
        'rmse': float(rmse),
        'mae': float(mae),
        'mse': float(mse)
    },
    'predictions': predictions,
    'residuals': residuals
}
result
        `;
      } else if (selectedMethod === 'polynomial' && selectedXColumns.length === 1) {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
X = df[${JSON.stringify(selectedXColumns)}].dropna()
y = df['${selectedYColumn}'].dropna()

# Align X and y
common_idx = X.index.intersection(y.index)
X = X.loc[common_idx]
y = y.loc[common_idx]

if len(X) < 10:
    raise ValueError("Not enough data points for regression")

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=${testSize}, random_state=42)

# Polynomial features
poly_features = PolynomialFeatures(degree=${polynomialDegree})
X_poly = poly_features.fit_transform(X)
X_train_poly = poly_features.transform(X_train)
X_test_poly = poly_features.transform(X_test)

# Polynomial Regression
model = LinearRegression()
model.fit(X_train_poly, y_train)

# Predictions
y_pred = model.predict(X_test_poly)
predictions = model.predict(X_poly).tolist()

# Calculate residuals
residuals = (y - predictions).tolist()

# Metrics
r_squared = r2_score(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mse)

# Adjusted R-squared
n = len(y_test)
p = poly_features.n_features_in_
adjusted_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - p - 1)

# Equation (simplified)
equation = f"y = polynomial function of degree {${polynomialDegree}}"

# Coefficients
coefficients = {}
feature_names = poly_features.get_feature_names_out()
for i, name in enumerate(feature_names):
    coefficients[name] = float(model.coef_[i])

result = {
    'method': 'Polynomial Regression',
    'equation': equation,
    'coefficients': coefficients,
    'metrics': {
        'r_squared': float(r_squared),
        'adjusted_r_squared': float(adjusted_r_squared),
        'rmse': float(rmse),
        'mae': float(mae),
        'mse': float(mse)
    },
    'predictions': predictions,
    'residuals': residuals
}
result
        `;
      } else if (selectedMethod === 'multiple') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
X = df[${JSON.stringify(selectedXColumns)}].dropna()
y = df['${selectedYColumn}'].dropna()

# Align X and y
common_idx = X.index.intersection(y.index)
X = X.loc[common_idx]
y = y.loc[common_idx]

if len(X) < 10:
    raise ValueError("Not enough data points for regression")

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=${testSize}, random_state=42)

# Multiple Linear Regression
model = LinearRegression()
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)
predictions = model.predict(X).tolist()

# Calculate residuals
residuals = (y - predictions).tolist()

# Metrics
r_squared = r2_score(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mse)

# Adjusted R-squared
n = len(y_test)
p = len(selectedXColumns)
adjusted_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - p - 1)

# Equation
intercept = model.intercept_
equation_parts = [f"{model.coef_[i]:.4f} * {selectedXColumns[i]}" for i in range(len(selectedXColumns))]
equation = f"y = {' + '.join(equation_parts)} + {intercept:.4f}"

# Coefficients
coefficients = {'intercept': float(intercept)}
for i, col in enumerate(selectedXColumns):
    coefficients[col] = float(model.coef_[i])

result = {
    'method': 'Multiple Linear Regression',
    'equation': equation,
    'coefficients': coefficients,
    'metrics': {
        'r_squared': float(r_squared),
        'adjusted_r_squared': float(adjusted_r_squared),
        'rmse': float(rmse),
        'mae': float(mae),
        'mse': float(mse)
    },
    'predictions': predictions,
    'residuals': residuals
}
result
        `;
      }

      const result = await executePython(code);
      
      if (result) {
        setRegressionResult(result as RegressionResult);
      } else {
        setError('Failed to perform regression analysis');
      }
    } catch (error) {
      setError('Error performing regression analysis');
      logger.error('Regression analysis error:', error);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, selectedXColumns, selectedYColumn, selectedMethod, testSize, polynomialDegree, data, executePython]);

  const renderScatterPlot = () => {
    if (!regressionResult || selectedXColumns.length !== 1) return null;

    // const xValues = data.map(row => row[selectedXColumns[0]]).filter(val => typeof val === 'number');
    // const yValues = data.map(row => row[selectedYColumn]).filter(val => typeof val === 'number');
    // const predictions = regressionResult.predictions;

    // Plot data and layout configuration for Plotly regression chart
    // const plotData = [
    //   {
    //     x: xValues,
    //     y: yValues,
    //     type: 'scatter',
    //     mode: 'markers',
    //     name: 'Actual Data',
    //     marker: { color: '#3b82f6', size: 6, opacity: 0.7 }
    //   },
    //   {
    //     x: xValues,
    //     y: predictions,
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Regression Line',
    //     line: { color: '#ef4444', width: 3 }
    //   }
    // ];

    // const layout = {
    //   title: `${selectedYColumn} vs ${selectedXColumns[0]}`,
    //   xaxis: { title: selectedXColumns[0] },
    //   yaxis: { title: selectedYColumn },
    //   margin: { l: 60, r: 50, t: 50, b: 60 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

    return (
      <div className="h-96 w-full" id="regression-scatter">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const renderResidualsPlot = () => {
    if (!regressionResult) return null;

    // const predictions = regressionResult.predictions;
    // const residuals = regressionResult.residuals;

    // Plot data and layout configuration for Plotly residuals chart
    // const plotData = [
    //   {
    //     x: predictions,
    //     y: residuals,
    //     type: 'scatter',
    //     mode: 'markers',
    //     name: 'Residuals',
    //     marker: { color: '#10b981', size: 6, opacity: 0.7 }
    //   },
    //   {
    //     x: predictions,
    //     y: new Array(predictions.length).fill(0),
    //     type: 'scatter',
    //     mode: 'lines',
    //     name: 'Zero Line',
    //     line: { color: '#ef4444', width: 2, dash: 'dash' }
    //   }
    // ];

    // const layout = {
    //   title: 'Residual Plot',
    //   xaxis: { title: 'Predicted Values' },
    //   yaxis: { title: 'Residuals' },
    //   margin: { l: 60, r: 50, t: 50, b: 60 },
    //   paper_bgcolor: 'rgba(0,0,0,0)',
    //   plot_bgcolor: 'rgba(0,0,0,0)',
    //   font: { color: 'hsl(var(--foreground))' }
    // };

    return (
      <div className="h-96 w-full" id="residuals-plot">
        {/* Plotly chart will be rendered here */}
      </div>
    );
  };

  const exportRegression = () => {
    if (!regressionResult) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      x_columns: selectedXColumns,
      y_column: selectedYColumn,
      method: regressionResult.method,
      result: regressionResult,
      parameters: {
        polynomial_degree: polynomialDegree,
        test_size: testSize
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regression-${selectedYColumn}-${Date.now()}.json`;
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
            <Target className="h-5 w-5" />
            Regression Analysis
          </CardTitle>
          <CardDescription>
            Analyze relationships and predict outcomes using regression models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Need at least 2 numeric columns for regression analysis.
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
              <Target className="h-5 w-5" />
              Regression Analysis
            </CardTitle>
            <CardDescription>
              Analyze relationships and predict outcomes using regression models
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportRegression} disabled={!regressionResult}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Variable Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Independent Variables (X)</label>
            <div className="flex flex-wrap gap-2">
              {numericColumns.filter(col => col !== selectedYColumn).map(col => (
                <Badge 
                  key={col}
                  variant={selectedXColumns.includes(col) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedXColumns.includes(col)) {
                      setSelectedXColumns(selectedXColumns.filter(c => c !== col));
                    } else {
                      if (selectedMethod === 'linear' || selectedMethod === 'polynomial') {
                        setSelectedXColumns([col]);
                      } else {
                        setSelectedXColumns([...selectedXColumns, col]);
                      }
                    }
                  }}
                >
                  {col}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Dependent Variable (Y)</label>
            <Select value={selectedYColumn} onValueChange={setSelectedYColumn}>
              <SelectTrigger>
                <SelectValue placeholder="Select Y variable" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Method Selection and Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Regression Method</label>
            <Select value={selectedMethod} onValueChange={(value) => {
              setSelectedMethod(value);
              if (value === 'linear' || value === 'polynomial') {
                setSelectedXColumns(selectedXColumns.slice(0, 1));
              }
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regressionMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedMethod === 'polynomial' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Polynomial Degree: {polynomialDegree}</label>
              <Input
                type="number"
                min="2"
                max="5"
                value={polynomialDegree}
                onChange={(e) => setPolynomialDegree(Number(e.target.value))}
                className="mt-2"
              />
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium mb-2 block">Test Size: {testSize}</label>
            <Input
              type="number"
              min="0.1"
              max="0.5"
              step="0.1"
              value={testSize}
              onChange={(e) => setTestSize(Number(e.target.value))}
              className="mt-2"
            />
          </div>
        </div>

        {/* Method Info */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4" />
            <span className="font-medium text-sm">
              {regressionMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {regressionMethods.find(m => m.id === selectedMethod)?.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            onClick={performRegression} 
            disabled={selectedXColumns.length === 0 || !selectedYColumn}
          >
            <Target className="h-4 w-4 mr-2" />
            Perform Regression
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
            <span className="text-sm text-muted-foreground">Performing regression analysis...</span>
          </div>
        )}

        {regressionResult && (
          <>
            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">R²</p>
                      <p className="text-2xl font-bold">
                        {regressionResult.metrics.r_squared.toFixed(3)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Adjusted R²</p>
                      <p className="text-2xl font-bold">
                        {regressionResult.metrics.adjusted_r_squared.toFixed(3)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">RMSE</p>
                      <p className="text-2xl font-bold">
                        {regressionResult.metrics.rmse.toFixed(3)}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">MAE</p>
                      <p className="text-2xl font-bold">
                        {regressionResult.metrics.mae.toFixed(3)}
                      </p>
                    </div>
                    <Calculator className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regression Equation */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Regression Equation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <code className="text-sm font-mono">{regressionResult.equation}</code>
                </div>
              </CardContent>
            </Card>

            {/* Visualization */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="regression">Regression Plot</TabsTrigger>
                <TabsTrigger value="residuals">Residuals</TabsTrigger>
              </TabsList>

              <TabsContent value="regression" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Regression Visualization</CardTitle>
                    <CardDescription>
                      {selectedYColumn} vs {selectedXColumns.join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderScatterPlot()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="residuals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Residual Analysis</CardTitle>
                    <CardDescription>
                      Check model assumptions and fit quality
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderResidualsPlot()}
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