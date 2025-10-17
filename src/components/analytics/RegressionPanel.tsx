'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  Download, 
  Calculator,
  BarChart3,
  Info,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import { useToast } from '@/lib/toast';
import Plotly from 'plotly.js-dist-min';

interface RegressionPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface RegressionResult {
  model_type: string;
  r_squared: number;
  adjusted_r_squared: number;
  mse: number;
  rmse: number;
  coefficients: { [key: string]: number };
  intercept: number;
  feature_importance: { [key: string]: number };
  residuals_stats: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  sample_size: number;
  predictions: number[];
  residuals: number[];
}

export function RegressionPanel({ data, dataColumns, className }: RegressionPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('model');
  const [modelType, setModelType] = useState<'linear' | 'polynomial'>('linear');
  const [polynomialDegree, setPolynomialDegree] = useState(2);
  const [newPrediction, setNewPrediction] = useState<{ [key: string]: number }>({});

  const { executePython, isInitialized } = usePythonExecution();
  const { toast } = useToast();

  // Get numeric columns for analysis
  const numericColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedTarget) {
      setSelectedTarget(numericColumns[0]);
      setSelectedFeatures(numericColumns.slice(1, Math.min(4, numericColumns.length)));
    }
  }, [numericColumns]);

  useEffect(() => {
    if (selectedTarget && selectedFeatures.length > 0 && isInitialized) {
      performRegression();
    }
  }, [selectedTarget, selectedFeatures, modelType, polynomialDegree, isInitialized]);

  const performRegression = async () => {
    if (!isInitialized || !selectedTarget || selectedFeatures.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.pipeline import Pipeline

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})

# Check if columns exist
missing_cols = [col for col in selected_features + [selected_target] if col not in df.columns]
if missing_cols:
    result = {'success': False, 'error': f'Columns not found: {missing_cols}'}
else:
    # Prepare features and target
    X = df[selected_features].select_dtypes(include=[np.number]).dropna()
    y = df[selected_target].dropna()
    
    # Align data
    common_index = X.index.intersection(y.index)
    X = X.loc[common_index]
    y = y.loc[common_index]
    
    if len(X) == 0 or len(y) == 0:
        result = {'success': False, 'error': 'No valid data points for regression'}
    else:
        # Create model pipeline
        if model_type == 'linear':
            model = Pipeline([
                ('scaler', StandardScaler()),
                ('regressor', LinearRegression())
            ])
        else:  # polynomial
            model = Pipeline([
                ('scaler', StandardScaler()),
                ('poly', PolynomialFeatures(degree=${polynomialDegree}, include_bias=False)),
                ('regressor', LinearRegression())
            ])
        
        # Fit model
        model.fit(X, y)
        
        # Make predictions
        y_pred = model.predict(X)
        
        # Calculate metrics
        r2 = r2_score(y, y_pred)
        mse = mean_squared_error(y, y_pred)
        rmse = np.sqrt(mse)
        
        # Get coefficients
        if model_type == 'linear':
            coefficients = dict(zip(selected_features, model.named_steps['regressor'].coef_))
            intercept = model.named_steps['regressor'].intercept_
        else:
            # For polynomial, get feature names
            poly_features = model.named_steps['poly'].get_feature_names_out(selected_features)
            coefficients = dict(zip(poly_features, model.named_steps['regressor'].coef_))
            intercept = model.named_steps['regressor'].intercept_
        
        # Feature importance (absolute coefficients)
        feature_importance = {k: abs(v) for k, v in coefficients.items()}
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
        
        # Residuals analysis
        residuals = y - y_pred
        
        # Calculate adjusted R-squared
        n = len(y)
        p = len(selected_features) if model_type == 'linear' else len(poly_features)
        adjusted_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
        
        result = {
            'success': True,
            'model_type': model_type,
            'r_squared': float(r2),
            'adjusted_r_squared': float(adjusted_r2),
            'mse': float(mse),
            'rmse': float(rmse),
            'coefficients': {k: float(v) for k, v in coefficients.items()},
            'intercept': float(intercept),
            'feature_importance': {k: float(v) for k, v in feature_importance.items()},
            'residuals_stats': {
                'mean': float(residuals.mean()),
                'std': float(residuals.std()),
                'min': float(residuals.min()),
                'max': float(residuals.max())
            },
            'sample_size': len(X),
            'predictions': y_pred.tolist(),
            'residuals': residuals.tolist()
        }

result
      `.replace('selected_features', JSON.stringify(selectedFeatures))
        .replace('selected_target', `'${selectedTarget}'`)
        .replace('model_type', `'${modelType}'`);

      const result = await executePython(code);
      
      if ((result as any).success) {
        setRegressionResult(result as any);
      } else {
        setError((result as any).error || 'Failed to perform regression');
      }
    } catch (error) {
      setError('Error performing regression');
      console.error('Regression error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderScatterPlot = () => {
    if (!regressionResult || !selectedTarget) return null;

    const actualValues = data.map(row => row[selectedTarget]).filter(val => typeof val === 'number' && !isNaN(val));
    const predictions = regressionResult.predictions;

    const plotData = [
      {
        x: actualValues,
        y: predictions,
        type: 'scatter',
        mode: 'markers',
        name: 'Actual vs Predicted',
        marker: { color: '#3b82f6', size: 6, opacity: 0.7 }
      },
      {
        x: [Math.min(...actualValues), Math.max(...actualValues)],
        y: [Math.min(...actualValues), Math.max(...actualValues)],
        type: 'scatter',
        mode: 'lines',
        name: 'Perfect Fit',
        line: { color: '#ef4444', dash: 'dash' }
      }
    ];

    const layout = {
      title: `Actual vs Predicted - ${selectedTarget}`,
      xaxis: { title: 'Actual Values' },
      yaxis: { title: 'Predicted Values' },
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

  const renderResidualsPlot = () => {
    if (!regressionResult) return null;

    const residuals = regressionResult.residuals;
    const predictions = regressionResult.predictions;

    const plotData = [
      {
        x: predictions,
        y: residuals,
        type: 'scatter',
        mode: 'markers',
        name: 'Residuals',
        marker: { color: '#3b82f6', size: 6, opacity: 0.7 }
      },
      {
        x: [Math.min(...predictions), Math.max(...predictions)],
        y: [0, 0],
        type: 'scatter',
        mode: 'lines',
        name: 'Zero Line',
        line: { color: '#ef4444', dash: 'dash' }
      }
    ];

    const layout = {
      title: 'Residuals Plot',
      xaxis: { title: 'Predicted Values' },
      yaxis: { title: 'Residuals' },
      margin: { l: 60, r: 50, t: 50, b: 60 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-96 w-full" id="residuals-plot">
        {/* Plotly residuals plot will be rendered here */}
      </div>
    );
  };

  const renderCoefficients = () => {
    if (!regressionResult) return null;

    const { coefficients, intercept } = regressionResult;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium mb-2">Intercept</div>
          <div className="text-2xl font-bold">{intercept.toFixed(4)}</div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Coefficients</h4>
          {Object.entries(coefficients).map(([feature, coef]) => (
            <div key={feature} className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm font-mono">{feature}</span>
              <Badge variant={coef >= 0 ? 'default' : 'destructive'}>
                {coef >= 0 ? '+' : ''}{coef.toFixed(4)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFeatureImportance = () => {
    if (!regressionResult) return null;

    const { feature_importance } = regressionResult;
    const maxImportance = Math.max(...Object.values(feature_importance));

    return (
      <div className="space-y-2">
        {Object.entries(feature_importance).map(([feature, importance]) => (
          <div key={feature}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{feature}</span>
              <span className="text-sm text-muted-foreground">{importance.toFixed(4)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${(importance / maxImportance) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMetrics = () => {
    if (!regressionResult) return null;

    const { r_squared, adjusted_r_squared, mse, rmse, sample_size } = regressionResult;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">R²</p>
                <p className="text-2xl font-bold">{r_squared.toFixed(4)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adj. R²</p>
                <p className="text-2xl font-bold">{adjusted_r_squared.toFixed(4)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">RMSE</p>
                <p className="text-2xl font-bold">{rmse.toFixed(4)}</p>
              </div>
              <Target className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sample Size</p>
                <p className="text-2xl font-bold">{sample_size}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const makePrediction = () => {
    if (!regressionResult || selectedFeatures.length === 0) return;

    // This would need to be implemented with the actual model
    // For now, we'll show a placeholder
    toast({
      title: "Prediction",
      description: "Prediction feature coming soon!",
    });
  };

  const exportRegression = () => {
    if (!regressionResult) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      target: selectedTarget,
      features: selectedFeatures,
      modelType: modelType,
      polynomialDegree: polynomialDegree,
      results: regressionResult
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regression-${selectedTarget}-${Date.now()}.json`;
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
            Regression Analysis
          </CardTitle>
          <CardDescription>
            Build predictive models and analyze relationships
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
              <TrendingUp className="h-5 w-5" />
              Regression Analysis
            </CardTitle>
            <CardDescription>
              Build predictive models and analyze relationships
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Target Variable</label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Model Type</label>
            <Select value={modelType} onValueChange={(value: any) => setModelType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear Regression</SelectItem>
                <SelectItem value="polynomial">Polynomial Regression</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {modelType === 'polynomial' && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Polynomial Degree: {polynomialDegree}</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="2"
                max="5"
                value={polynomialDegree}
                onChange={(e) => setPolynomialDegree(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8">{polynomialDegree}</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Feature Variables</label>
          <div className="flex flex-wrap gap-2">
            {numericColumns.filter(col => col !== selectedTarget).map(col => (
              <Badge 
                key={col}
                variant={selectedFeatures.includes(col) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  if (selectedFeatures.includes(col)) {
                    setSelectedFeatures(selectedFeatures.filter(f => f !== col));
                  } else {
                    setSelectedFeatures([...selectedFeatures, col]);
                  }
                }}
              >
                {col}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click to select/deselect features (minimum 1 required)
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
            <span className="text-sm text-muted-foreground">Building regression model...</span>
          </div>
        )}

        {regressionResult && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="coefficients">Coefficients</TabsTrigger>
              <TabsTrigger value="prediction">Prediction</TabsTrigger>
            </TabsList>

            <TabsContent value="model" className="space-y-4">
              {renderMetrics()}
            </TabsContent>

            <TabsContent value="visualization" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actual vs Predicted</CardTitle>
                    <CardDescription>
                      How well the model fits the data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderScatterPlot()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Residuals Plot</CardTitle>
                    <CardDescription>
                      Check for patterns in prediction errors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderResidualsPlot()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="coefficients" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Model Coefficients</CardTitle>
                    <CardDescription>
                      Linear equation parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderCoefficients()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Feature Importance</CardTitle>
                    <CardDescription>
                      Relative importance of each feature
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderFeatureImportance()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="prediction" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Make Prediction</CardTitle>
                  <CardDescription>
                    Predict the target value for new data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedFeatures.map(feature => (
                        <div key={feature}>
                          <label className="text-sm font-medium mb-2 block">{feature}</label>
                          <Input
                            type="number"
                            placeholder={`Enter ${feature}`}
                            value={newPrediction[feature] || ''}
                            onChange={(e) => setNewPrediction({
                              ...newPrediction,
                              [feature]: Number(e.target.value)
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={makePrediction} className="w-full">
                      <Zap className="h-4 w-4 mr-2" />
                      Make Prediction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
