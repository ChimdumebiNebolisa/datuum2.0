'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Layers, 
  Download, 
  Eye,
  BarChart3,
  Info,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Settings
} from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import Plotly from 'plotly.js-dist-min';

interface ClusteringPanelProps {
  data: any[];
  dataColumns: string[];
  className?: string;
}

interface ClusteringMethod {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface ClusteringResult {
  method: string;
  n_clusters: number;
  labels: number[];
  centers?: number[][];
  silhouette_score?: number;
  inertia?: number;
  parameters: Record<string, any>;
}

export function ClusteringPanel({ data, dataColumns, className }: ClusteringPanelProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('kmeans');
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('clustering');
  const [nClusters, setNClusters] = useState(3);
  const [eps, setEps] = useState(0.5);
  const [minSamples, setMinSamples] = useState(5);
  const [showElbow, setShowElbow] = useState(false);
  const [elbowData, setElbowData] = useState<any>(null);

  const { executePython, isInitialized } = usePythonExecution();

  // Get numeric columns for analysis
  const numericColumns = dataColumns.filter(col => {
    if (!data.length) return false;
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    return sampleValues.every(val => typeof val === 'number' && !isNaN(val));
  });

  const clusteringMethods: ClusteringMethod[] = [
    {
      id: 'kmeans',
      name: 'K-Means',
      description: 'Partitions data into k clusters by minimizing within-cluster variance',
      parameters: { n_clusters: nClusters }
    },
    {
      id: 'dbscan',
      name: 'DBSCAN',
      description: 'Density-based clustering that finds clusters of varying shapes',
      parameters: { eps: eps, min_samples: minSamples }
    },
    {
      id: 'hierarchical',
      name: 'Hierarchical',
      description: 'Builds a hierarchy of clusters using bottom-up approach',
      parameters: { n_clusters: nClusters }
    }
  ];

  useEffect(() => {
    if (numericColumns.length >= 2 && selectedColumns.length === 0) {
      setSelectedColumns(numericColumns.slice(0, Math.min(3, numericColumns.length)));
    }
  }, [numericColumns]);

  useEffect(() => {
    if (selectedColumns.length >= 2 && isInitialized && showElbow) {
      calculateElbow();
    }
  }, [selectedColumns, isInitialized, showElbow]);

  const calculateElbow = async () => {
    if (!isInitialized || selectedColumns.length < 2) return;

    setLoading(true);
    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
X = df[${JSON.stringify(selectedColumns)}].dropna()
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Calculate elbow curve
inertias = []
k_range = range(1, min(11, len(X) // 2))
for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X_scaled)
    inertias.append(kmeans.inertia_)

result = {
    'k_values': list(k_range),
    'inertias': inertias
}
result
      `;

      const result = await executePython(code);
      if (result) {
        setElbowData(result);
      }
    } catch (error) {
      console.error('Elbow calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const performClustering = async () => {
    if (!isInitialized || selectedColumns.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      let code = '';
      
      if (selectedMethod === 'kmeans') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
X = df[${JSON.stringify(selectedColumns)}].dropna()
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# K-Means clustering
kmeans = KMeans(n_clusters=${nClusters}, random_state=42, n_init=10)
labels = kmeans.fit_predict(X_scaled)

# Calculate metrics
silhouette_avg = silhouette_score(X_scaled, labels)
inertia = kmeans.inertia_

result = {
    'method': 'K-Means',
    'n_clusters': ${nClusters},
    'labels': labels.tolist(),
    'centers': kmeans.cluster_centers_.tolist(),
    'silhouette_score': float(silhouette_avg),
    'inertia': float(inertia),
    'parameters': {'n_clusters': ${nClusters}}
}
result
        `;
      } else if (selectedMethod === 'dbscan') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
X = df[${JSON.stringify(selectedColumns)}].dropna()
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# DBSCAN clustering
dbscan = DBSCAN(eps=${eps}, min_samples=${minSamples})
labels = dbscan.fit_predict(X_scaled)

# Calculate metrics
n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
if n_clusters > 1:
    silhouette_avg = silhouette_score(X_scaled, labels)
else:
    silhouette_avg = -1

result = {
    'method': 'DBSCAN',
    'n_clusters': n_clusters,
    'labels': labels.tolist(),
    'silhouette_score': float(silhouette_avg),
    'parameters': {'eps': ${eps}, 'min_samples': ${minSamples}}
}
result
        `;
      } else if (selectedMethod === 'hierarchical') {
        code = `
import sys
sys.path.append('/python')
import pandas as pd
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# Prepare data
df = pd.DataFrame(${JSON.stringify(data)})
X = df[${JSON.stringify(selectedColumns)}].dropna()
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Hierarchical clustering
hierarchical = AgglomerativeClustering(n_clusters=${nClusters})
labels = hierarchical.fit_predict(X_scaled)

# Calculate metrics
silhouette_avg = silhouette_score(X_scaled, labels)

result = {
    'method': 'Hierarchical',
    'n_clusters': ${nClusters},
    'labels': labels.tolist(),
    'silhouette_score': float(silhouette_avg),
    'parameters': {'n_clusters': ${nClusters}}
}
result
        `;
      }

      const result = await executePython(code);
      
      if (result) {
        setClusteringResult(result as ClusteringResult);
      } else {
        setError('Failed to perform clustering');
      }
    } catch (error) {
      setError('Error performing clustering');
      console.error('Clustering error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderScatterPlot = () => {
    if (!clusteringResult || selectedColumns.length < 2) return null;

    const plotData = [];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    
    for (let i = 0; i < clusteringResult.n_clusters; i++) {
      const clusterData = data.filter((_, idx) => clusteringResult.labels[idx] === i);
      
      plotData.push({
        x: clusterData.map(row => row[selectedColumns[0]]),
        y: clusterData.map(row => row[selectedColumns[1]]),
        type: 'scatter',
        mode: 'markers',
        name: `Cluster ${i}`,
        marker: {
          color: colors[i % colors.length],
          size: 8,
          opacity: 0.7
        },
        hovertemplate: `<b>Cluster ${i}</b><br>${selectedColumns[0]}: %{x}<br>${selectedColumns[1]}: %{y}<extra></extra>`
      });
    }

    const layout = {
      title: `${clusteringResult.method} Clustering Results`,
      xaxis: { title: selectedColumns[0] },
      yaxis: { title: selectedColumns[1] },
      margin: { l: 60, r: 50, t: 50, b: 60 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-96 w-full" id="clustering-scatter">
        {/* Plotly scatter plot will be rendered here */}
      </div>
    );
  };

  const renderElbowPlot = () => {
    if (!elbowData) return null;

    const plotData = [{
      x: elbowData.k_values,
      y: elbowData.inertias,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Elbow Curve',
      line: { color: '#3b82f6', width: 2 },
      marker: { size: 8 }
    }];

    const layout = {
      title: 'Elbow Method for Optimal K',
      xaxis: { title: 'Number of Clusters (k)' },
      yaxis: { title: 'Inertia' },
      margin: { l: 60, r: 50, t: 50, b: 60 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'hsl(var(--foreground))' }
    };

    return (
      <div className="h-64 w-full" id="elbow-plot">
        {/* Plotly elbow plot will be rendered here */}
      </div>
    );
  };

  const exportClusters = () => {
    if (!clusteringResult) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      method: clusteringResult.method,
      parameters: clusteringResult.parameters,
      n_clusters: clusteringResult.n_clusters,
      silhouette_score: clusteringResult.silhouette_score,
      inertia: clusteringResult.inertia,
      labels: clusteringResult.labels,
      data_with_clusters: data.map((row, idx) => ({
        ...row,
        cluster: clusteringResult.labels[idx]
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clustering-${clusteringResult.method.toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    if (score >= 0.3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.7) return 'Excellent';
    if (score >= 0.5) return 'Good';
    if (score >= 0.3) return 'Fair';
    return 'Poor';
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
            <Layers className="h-5 w-5" />
            Clustering Analysis
          </CardTitle>
          <CardDescription>
            Group similar data points using machine learning algorithms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Need at least 2 numeric columns for clustering analysis.
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
              <Layers className="h-5 w-5" />
              Clustering Analysis
            </CardTitle>
            <CardDescription>
              Group similar data points using machine learning algorithms
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportClusters} disabled={!clusteringResult}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Column Selection */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Select Features</h4>
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
            Select 2-4 numeric columns for clustering (minimum 2 required)
          </p>
        </div>

        {/* Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Clustering Method</label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clusteringMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedMethod === 'kmeans' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Number of Clusters: {nClusters}</label>
              <Slider
                value={[nClusters]}
                onValueChange={(value) => setNClusters(value[0])}
                min={2}
                max={Math.min(10, Math.floor(data.length / 2))}
                step={1}
                className="mt-2"
              />
            </div>
          )}
          
          {selectedMethod === 'dbscan' && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Epsilon: {eps}</label>
                <Slider
                  value={[eps]}
                  onValueChange={(value) => setEps(value[0])}
                  min={0.1}
                  max={2}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Min Samples: {minSamples}</label>
                <Slider
                  value={[minSamples]}
                  onValueChange={(value) => setMinSamples(value[0])}
                  min={2}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>
            </>
          )}
          
          {selectedMethod === 'hierarchical' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Number of Clusters: {nClusters}</label>
              <Slider
                value={[nClusters]}
                onValueChange={(value) => setNClusters(value[0])}
                min={2}
                max={Math.min(10, Math.floor(data.length / 2))}
                step={1}
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
              {clusteringMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {clusteringMethods.find(m => m.id === selectedMethod)?.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-6">
          <Button onClick={performClustering} disabled={selectedColumns.length < 2}>
            <Target className="h-4 w-4 mr-2" />
            Perform Clustering
          </Button>
          
          {selectedMethod === 'kmeans' && (
            <Button 
              variant="outline" 
              onClick={() => setShowElbow(!showElbow)}
              disabled={selectedColumns.length < 2}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showElbow ? 'Hide' : 'Show'} Elbow Curve
            </Button>
          )}
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
            <span className="text-sm text-muted-foreground">Performing clustering...</span>
          </div>
        )}

        {showElbow && selectedMethod === 'kmeans' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Elbow Method</CardTitle>
              <CardDescription>
                Find the optimal number of clusters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderElbowPlot()}
            </CardContent>
          </Card>
        )}

        {clusteringResult && (
          <>
            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Clusters</p>
                      <p className="text-2xl font-bold">{clusteringResult.n_clusters}</p>
                    </div>
                    <Layers className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Silhouette Score</p>
                      <p className={`text-2xl font-bold ${getQualityColor(clusteringResult.silhouette_score || 0)}`}>
                        {(clusteringResult.silhouette_score || 0).toFixed(3)}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quality</p>
                      <p className={`text-2xl font-bold ${getQualityColor(clusteringResult.silhouette_score || 0)}`}>
                        {getQualityLabel(clusteringResult.silhouette_score || 0)}
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visualization */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clustering">Clustering Results</TabsTrigger>
                <TabsTrigger value="analysis">Cluster Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="clustering" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cluster Visualization</CardTitle>
                    <CardDescription>
                      {selectedColumns[0]} vs {selectedColumns[1]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderScatterPlot()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cluster Characteristics</CardTitle>
                    <CardDescription>
                      Statistical analysis of each cluster
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: clusteringResult.n_clusters }, (_, i) => {
                        const clusterData = data.filter((_, idx) => clusteringResult.labels[idx] === i);
                        return (
                          <div key={i} className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-3">Cluster {i} ({clusterData.length} points)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {selectedColumns.map(col => {
                                const values = clusterData.map(row => row[col]).filter(v => typeof v === 'number');
                                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                                const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
                                
                                return (
                                  <div key={col}>
                                    <div className="font-medium">{col}</div>
                                    <div>Mean: {mean.toFixed(2)}</div>
                                    <div>Std: {std.toFixed(2)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
