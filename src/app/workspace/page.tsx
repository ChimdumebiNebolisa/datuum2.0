'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, BarChart3, Settings, Download, Save, FolderOpen, Sparkles, Calculator, TrendingUp, AlertTriangle, Layers, Calendar, Target } from 'lucide-react';
import { usePythonExecution } from '@/lib/pyodide-bridge';
import { useToast } from '@/lib/toast';
import { DataRow, DataInfo, ChartRecommendation, ChartConfig } from '@/types/analytics';
import { logger } from '@/lib/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { FileUploader } from '@/components/FileUploader';
import { MobileNav } from '@/components/MobileNav';
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

const TimeSeriesPanel = dynamic(() => import('@/components/analytics/TimeSeriesPanel').then(mod => ({ default: mod.TimeSeriesPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading time series...</div>
});

const RegressionPanel = dynamic(() => import('@/components/analytics/RegressionPanel').then(mod => ({ default: mod.RegressionPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading regression...</div>
});

const ClusteringPanel = dynamic(() => import('@/components/analytics/ClusteringPanel').then(mod => ({ default: mod.ClusteringPanel })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading clustering...</div>
});

/**
 * Main workspace page component for Datuum 2.0
 * 
 * This component provides the main interface for data analysis, including:
 * - File upload functionality
 * - Data preview and editing
 * - Analytics panels (statistics, clustering, correlation, etc.)
 * - Chart visualization and recommendations
 * 
 * @returns JSX element containing the complete workspace interface
 */
export default function WorkspacePage() {
  const [isPythonReady, setIsPythonReady] = useState(false);
  const [currentData, setCurrentData] = useState<DataRow[]>([]);
  const [dataInfo, setDataInfo] = useState<DataInfo | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedChart, setSelectedChart] = useState<string>('bar');
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [chartRecommendations, setChartRecommendations] = useState<ChartRecommendation[]>([]);
  
  const { executePython, isInitialized } = usePythonExecution();
  const { toast } = useToast();

  useEffect(() => {
    if (isInitialized) {
      setIsPythonReady(true);
    }
  }, [isInitialized]);

  const handleFileUpload = async (file: File) => {
    
    try {
      toast({
        title: "Uploading file...",
        description: `Processing ${file.name}`,
      });

      const text = await file.text();
      
      let data;
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Parse CSV using papaparse
        const Papa = (await import('papaparse')).default;
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transform: (value: string) => {
            // Try to parse as number
            if (value && !isNaN(Number(value))) {
              return Number(value);
            }
            return value;
          }
        });
        
        if (result.errors.length > 0) {
          logger.warn('CSV parsing warnings', result.errors);
        }
        
        data = result.data;
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
      
      toast({
        title: "File uploaded successfully!",
        description: `${data.length} rows loaded from ${file.name}`,
      });
      
      setActiveTab('data');
    } catch (error) {
      logger.error('File upload error:', error as Error, 'file upload');
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
      });
    }
  };

  const FileUploadSection = useMemo(() => (
    <div className="space-y-6">
      <FileUploader
        onFileUpload={handleFileUpload}
        maxFiles={3}
        maxSize={10 * 1024 * 1024} // 10MB
        acceptedTypes={['.csv', '.json', '.xlsx', '.xls']}
      />

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
                  aria-label="Load sample sales data with monthly sales and profit information"
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
                  fileName: 'Sample Sales Data',
                  fileSize: 0
                });
                setActiveTab('data');
                toast({
                  title: "Sample data loaded!",
                  description: "Sales data with 6 rows loaded successfully",
                });
              }}
            >
              <div className="font-medium">Sales Data</div>
              <div className="text-sm text-muted-foreground">Monthly sales and profit</div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              aria-label="Load sample customer data with demographics and spending information"
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
                  fileName: 'Sample Customer Data',
                  fileSize: 0
                });
                setActiveTab('data');
                toast({
                  title: "Sample data loaded!",
                  description: "Customer data with 6 rows loaded successfully",
                });
              }}
            >
              <div className="font-medium">Customer Data</div>
              <div className="text-sm text-muted-foreground">Customer demographics and spending</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ), [handleFileUpload]);

  const DataPreview = useMemo(() => (
    <div className="space-y-6">
      {currentData.length > 0 ? (
        <>
          {/* Enhanced Data Table with editing capabilities */}
          <DataTable
            data={currentData}
            columns={dataInfo?.columns || []}
            onDataChange={(newData) => {
              setCurrentData(newData);
              setDataInfo((prev: any) => ({
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
              setDataInfo((prev: any) => ({
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
              setDataInfo((prev: any) => ({
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
  ), [currentData, dataInfo]);

  const handleChartSelect = useCallback((chartType: string, config: ChartConfig) => {
    setSelectedChart(chartType);
    setChartConfig(config);
  }, []);

  const getChartRecommendations = useCallback(async () => {
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
      logger.error('Chart recommendations error:', error as Error, 'chart recommendations');
    }
  }, [isInitialized, currentData, executePython]);

  useEffect(() => {
    if (currentData.length > 0) {
      getChartRecommendations();
    }
  }, [currentData, isInitialized, getChartRecommendations]);

  const AnalyticsPanel = useMemo(() => (
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
            config={chartConfig || undefined}
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

          {/* Clustering Analysis */}
          <ClusteringPanel
            data={currentData}
            dataColumns={dataInfo?.columns || []}
          />

          {/* Time Series Analysis */}
          <TimeSeriesPanel
            data={currentData}
            dataColumns={dataInfo?.columns || []}
          />

          {/* Regression Analysis */}
          <RegressionPanel
            data={currentData}
            dataColumns={dataInfo?.columns || []}
          />
        </>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
          <CardDescription>
            All analytics features are now available above
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Basic Statistics</span>
                </div>
                <div className="text-sm text-muted-foreground">Mean, median, std dev</div>
                <Badge variant="default" className="text-xs mt-1">Available</Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Correlation Analysis</span>
                </div>
                <div className="text-sm text-muted-foreground">Find relationships</div>
                <Badge variant="default" className="text-xs mt-1">Available</Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Outlier Detection</span>
                </div>
                <div className="text-sm text-muted-foreground">Identify anomalies</div>
                <Badge variant="default" className="text-xs mt-1">Available</Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Clustering</span>
                </div>
                <div className="text-sm text-muted-foreground">Group similar data</div>
                <Badge variant="default" className="text-xs mt-1">Available</Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Time Series</span>
                </div>
                <div className="text-sm text-muted-foreground">Trend analysis</div>
                <Badge variant="default" className="text-xs mt-1">Available</Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Regression</span>
                </div>
                <div className="text-sm text-muted-foreground">Predict relationships</div>
                <Badge variant="default" className="text-xs mt-1">Available</Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Upload data to see analytics options
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ), [currentData, dataInfo, chartRecommendations, selectedChart, chartConfig, handleChartSelect]);

  if (!isPythonReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Initializing Datuum 2.0</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div>
                <h3 className="text-lg font-medium">Loading Python Engine</h3>
                <p className="text-sm text-muted-foreground">
                  Initializing Pyodide and data science libraries...
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <span className="text-sm">Loading NumPy</span>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <span className="text-sm">Loading Pandas</span>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <span className="text-sm">Loading Scikit-learn</span>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <span className="text-sm">Loading Plotly</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                This may take a moment on first load
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center">
                <Link className="flex items-center space-x-2" href="/">
                  <span className="font-bold text-lg">Datuum 2.0</span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" aria-label="Open saved project">
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
                
                <Button variant="outline" size="sm" aria-label="Save current project">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                
                <Button variant="outline" size="sm" aria-label="Export data and charts">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                
                <Button variant="outline" size="sm" aria-label="Open settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </nav>

              {/* Mobile Navigation */}
              <div className="md:hidden">
                <MobileNav />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto min-h-[44px]" role="tablist" aria-label="Workspace navigation">
              <TabsTrigger value="upload" className="text-xs md:text-sm py-2 px-3" role="tab" aria-selected={activeTab === 'upload'}>
                Upload
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs md:text-sm py-2 px-3" role="tab" aria-selected={activeTab === 'data'}>
                Data
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm py-2 px-3" role="tab" aria-selected={activeTab === 'analytics'}>
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <ErrorBoundary>
                {FileUploadSection}
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="data">
              <ErrorBoundary>
                {DataPreview}
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="analytics">
              <ErrorBoundary>
                {AnalyticsPanel}
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}