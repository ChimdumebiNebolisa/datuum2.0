'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Info } from 'lucide-react';

export interface BaseAnalyticsPanelProps {
  title: string;
  description: string;
  icon: ReactNode;
  data: any[];
  dataColumns: string[];
  className?: string;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  hasValidData: boolean;
  noDataMessage: string;
  onExport?: () => void;
  canExport?: boolean;
  children: ReactNode;
}

/**
 * Base analytics panel component that provides common structure and functionality
 * for all analytics panels, reducing code duplication.
 */
export function BaseAnalyticsPanel({
  title,
  description,
  icon,
  data,
  dataColumns,
  className,
  isInitialized,
  loading,
  error,
  hasValidData,
  noDataMessage,
  onExport,
  canExport = false,
  children
}: BaseAnalyticsPanelProps) {
  // Loading state
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

  // No valid data state
  if (!hasValidData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {noDataMessage}
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
              {icon}
              {title}
            </CardTitle>
            <CardDescription>
              {description}
            </CardDescription>
          </div>
          {onExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport} 
              disabled={!canExport}
              aria-label={`Export ${title.toLowerCase()} data`}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-destructive font-medium">{error}</span>
                {error.includes('Python engine not available') && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>This usually happens when:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>The Python engine is still loading (try refreshing the page)</li>
                      <li>Your browser doesn't support Web Workers</li>
                      <li>There's a network connectivity issue</li>
                    </ul>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Refresh page to retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="mb-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        )}

        {/* Panel content */}
        {children}
      </CardContent>
    </Card>
  );
}
