'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, BarChart3, Settings, Download, Save, FolderOpen, Sparkles, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import dynamic from 'next/dynamic';

const ChartRenderer = dynamic(() => import('@/components/ChartRenderer').then(mod => ({ default: mod.ChartRenderer })), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading chart...</div>
});

const ChartSelector = dynamic(() => import('@/components/ChartSelector').then(mod => ({ default: mod.ChartSelector })), {
  ssr: false,
  loading: () => <div className="h-32 flex items-center justify-center">Loading chart selector...</div>
});

const StatisticsPanel = dynamic(() => import('@/components/analytics/StatisticsPanel').then(mod => ({ default: mod.StatisticsPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading statistics...</div>
});

const CorrelationPanel = dynamic(() => import('@/components/analytics/CorrelationPanel').then(mod => ({ default: mod.CorrelationPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading correlations...</div>
});

const OutlierPanel = dynamic(() => import('@/components/analytics/OutlierPanel').then(mod => ({ default: mod.OutlierPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading outlier detection...</div>
});

const DataTable = dynamic(() => import('@/components/DataTable').then(mod => ({ default: mod.DataTable })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading data table...</div>
});

const DataTransformPanel = dynamic(() => import('@/components/data/DataTransformPanel').then(mod => ({ default: mod.DataTransformPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading data transform...</div>
});

const DataCleaningPanel = dynamic(() => import('@/components/data/DataCleaningPanel').then(mod => ({ default: mod.DataCleaningPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading data cleaning...</div>
});

export default function WorkspacePage() {
  const [isPythonReady, setIsPythonReady] = useState(false);
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedChart, setSelectedChart] = useState<string>('bar');
  const [chartConfig, setChartConfig] = useState<any>({});
  const [chartRecommendations, setChartRecommendations] = useState<any[]>([]);
  
  const { executePython, isInitialized, loading } = usePythonExecution();

  useEffect(() => {
    if (isInitialized) {
      setIsPythonReady(true);
    }
  }, [isInitialized]);

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      let data;
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            let value: any = values[index] || '';
            if (value && !isNaN(Number(value))) {
              value = Number(value);
            }
            row[header] = value;
          });
          data.push(row);
        }
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        throw new Error('Unsupported file type');
      }
      
      setCurrentData(data);
      setDataInfo({
        rows: data.length,
        columns: Object.keys(data[0] || {}),
        fileSize: file.size,
        fileName: file.name
      });
      setActiveTab('data');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const FileUploader = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Data
          </CardTitle>
          <CardDescription>
            Upload CSV, JSON, or Excel files to start analyzing your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">
                  CSV, JSON, Excel files up to 10MB
                </p>
              </div>
              <Button variant="outline">Choose File</Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Sample Data
          </CardTitle>
          <CardDescription>
            Try Datuum with some sample datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => {
                // Load sample sales data
                const sampleData = [
                  { month: 'Jan', sales: 1200, profit: 200 },
                  { month: 'Feb', sales: 1500, profit: 300 },
                  { month: 'Mar', sales: 1800, profit: 400 },
                  { month: 'Apr', sales: 1600, profit: 350 },
                  { month: 'May', sales: 2000, profit: 500 },
                  { month: 'Jun', sales: 2200, profit: 600 }
                ];
                setCurrentData(sampleData);
                setDataInfo({
                  rows: sampleData.length,
                  columns: Object.keys(sampleData[0]),
                  fileName: 'Sample Sales Data'
                });
                setActiveTab('data');
              }}
            >
              <div className="font-medium">Sales Data</div>
              <div className="text-sm text-muted-foreground">Monthly sales and profit</div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => {
                // Load sample customer data
                const sampleData = [
                  { age: 25, income: 50000, spending: 1200, category: 'Premium' },
                  { age: 30, income: 60000, spending: 1500, category: 'Premium' },
                  { age: 35, income: 45000, spending: 800, category: 'Standard' },
                  { age: 28, income: 55000, spending: 1100, category: 'Premium' },
                  { age: 40, income: 70000, spending: 1800, category: 'Premium' },
                  { age: 22, income: 30000, spending: 600, category: 'Basic' }
                ];
                setCurrentData(sampleData);
                setDataInfo({
                  rows: sampleData.length,
                  columns: Object.keys(sampleData[0]),
                  fileName: 'Sample Customer Data'
                });
                setActiveTab('data');
              }}
            >
              <div className="font-medium">Customer Data</div>
              <div className="text-sm text-muted-foreground">Customer demographics and spending</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DataPreview = () => (
    <div className="space-y-6">
      {currentData.length > 0 ? (
        <>
          {/* Enhanced Data Table with editing capabilities */}
          <DataTable
            data={currentData}
            columns={dataInfo?.columns || []}
            onDataChange={(newData) => {
              setCurrentData(newData);
              setDataInfo(prev => ({
                ...prev,
                rows: newData.length,
                columns: Object.keys(newData[0] || {})
              }));
            }}
          />

          {/* Data Transform Panel */}
          <DataTransformPanel
            data={currentData}
            columns={dataInfo?.columns || []}
            onDataChange={(newData) => {
              setCurrentData(newData);
              setDataInfo(prev => ({
                ...prev,
                rows: newData.length,
                columns: Object.keys(newData[0] || {})
              }));
            }}
          />

          {/* Data Cleaning Panel */}
          <DataCleaningPanel
            data={currentData}
            columns={dataInfo?.columns || []}
            onDataChange={(newData) => {
              setCurrentData(newData);
              setDataInfo(prev => ({
                ...prev,
                rows: newData.length,
                columns: Object.keys(newData[0] || {})
              }));
            }}
          />

          {/* Data Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Information
              </CardTitle>
              <CardDescription>
                {dataInfo && `${dataInfo.rows} rows × ${dataInfo.columns.length} columns`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>File: {dataInfo?.fileName}</span>
                {dataInfo?.fileSize && (
                  <span>• Size: {(dataInfo.fileSize / 1024).toFixed(1)} KB</span>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">{dataInfo?.rows || 0}</div>
                  <div className="text-xs text-muted-foreground">Rows</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">{dataInfo?.columns?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Columns</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">
                    {dataInfo?.columns?.filter((col: string) => 
                      currentData.slice(0, 10).some(row => 
                        typeof row[col] === 'number' && !isNaN(row[col])
                      )
                    ).length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Numeric</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">
                    {dataInfo?.columns?.filter((col: string) => 
                      currentData.slice(0, 10).some(row => 
                        typeof row[col] === 'string'
                      )
                    ).length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Text</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Data Loaded</h3>
              <p className="text-muted-foreground">
                Upload a file or use sample data to get started with data editing and analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const handleChartSelect = (chartType: string, config: any) => {
    setSelectedChart(chartType);
    setChartConfig(config);
  };

  const getChartRecommendations = async () => {
    if (!isInitialized || !currentData.length) return;
    
    try {
      const code = `
import sys
sys.path.append('/python')
import pandas as pd
from chart_recommender import chart_recommender

# Set data and get recommendations
df = pd.DataFrame(${JSON.stringify(currentData)})
chart_recommender.set_data(df)
result = chart_recommender.recommend_charts()
result
      `;

      const result = await executePython(code);
      if ((result as any).success) {
        setChartRecommendations((result as any).recommendations || []);
      }
    } catch (error) {
      console.error('Error getting chart recommendations:', error);
    }
  };

  useEffect(() => {
    if (currentData.length > 0) {
      getChartRecommendations();
    }
  }, [currentData, isInitialized]);

  const AnalyticsPanel = () => (
    <div className="space-y-6">
      {currentData.length > 0 && (
        <>
          <ChartSelector
            onSelectChart={handleChartSelect}
            recommendations={chartRecommendations}
            dataColumns={dataInfo?.columns || []}
          />
          
          <ChartRenderer
            data={currentData}
            chartType={selectedChart}
            config={chartConfig}
          />

          {/* Statistics Analysis */}
          <StatisticsPanel
            data={currentData}
            dataColumns={dataInfo?.columns || []}
          />

          {/* Correlation Analysis */}
          <CorrelationPanel
            data={currentData}
            dataColumns={dataInfo?.columns || []}
          />

          {/* Outlier Detection */}
          <OutlierPanel
            data={currentData}
            dataColumns={dataInfo?.columns || []}
          />
        </>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
          </CardTitle>
          <CardDescription>
            Get deeper insights from your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" disabled>
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-medium">Basic Statistics</span>
                </div>
                <div className="text-sm text-muted-foreground">Mean, median, std dev</div>
                <Badge variant="secondary" className="text-xs mt-1">Available Above</Badge>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" disabled>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Correlation Analysis</span>
                </div>
                <div className="text-sm text-muted-foreground">Find relationships</div>
                <Badge variant="secondary" className="text-xs mt-1">Available Above</Badge>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" disabled>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Outlier Detection</span>
                </div>
                <div className="text-sm text-muted-foreground">Identify anomalies</div>
                <Badge variant="secondary" className="text-xs mt-1">Available Above</Badge>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="font-medium">Clustering</div>
                <div className="text-sm text-muted-foreground">Group similar data</div>
                <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="font-medium">Time Series</div>
                <div className="text-sm text-muted-foreground">Trend analysis</div>
                <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="font-medium">Regression</div>
                <div className="text-sm text-muted-foreground">Predict relationships</div>
                <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Upload data to see analytics options
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (!isPythonReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div>
                <h3 className="text-lg font-medium">Initializing Python Engine</h3>
                <p className="text-sm text-muted-foreground">
                  Loading Pyodide and required packages...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold">Datuum 2.0</span>
            </a>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Search or other header content */}
            </div>
            
            <nav className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Open Project</DialogTitle>
                    <DialogDescription>
                      Load a saved project from your local storage.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="text-center py-4 text-muted-foreground">
                    Project management coming soon...
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <FileUploader />
          </TabsContent>
          
          <TabsContent value="data">
            <DataPreview />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}