'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { logger } from '@/lib/logger';

interface FileUploaderProps {
  onFileUpload: (_file: File) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface UploadError {
  message: string;
  type: 'file-size' | 'file-type' | 'file-count' | 'parse-error' | 'network-error' | 'unknown';
  details?: string;
}

export function FileUploader({ 
  onFileUpload, 
  maxFiles = 1, 
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.csv', '.json', '.xlsx', '.xls'],
  className 
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Clear any previous errors
    setUploadError(null);

    // Handle rejected files first
    if (rejectedFiles.length > 0) {
      const rejectedFile = rejectedFiles[0];
      const errors = rejectedFile.errors;
      
      if (errors.some((e: any) => e.code === 'file-too-large')) {
        setUploadError({
          message: `File "${rejectedFile.file.name}" is too large`,
          type: 'file-size',
          details: `Maximum size allowed is ${formatFileSize(maxSize)}. Your file is ${formatFileSize(rejectedFile.file.size)}.`
        });
        return;
      }
      
      if (errors.some((e: any) => e.code === 'file-invalid-type')) {
        setUploadError({
          message: `File type not supported: "${rejectedFile.file.name}"`,
          type: 'file-type',
          details: `Supported formats are: ${acceptedTypes.join(', ')}.`
        });
        return;
      }
      
      if (errors.some((e: any) => e.code === 'too-many-files')) {
        setUploadError({
          message: `Too many files selected`,
          type: 'file-count',
          details: `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed.`
        });
        return;
      }
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      await onFileUpload(file);
      setUploadedFiles([file]);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      logger.error('Upload error:', error);
      
      let errorMessage = 'An unexpected error occurred while processing the file.';
      let errorType: UploadError['type'] = 'unknown';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('JSON')) {
          errorType = 'parse-error';
          errorDetails = 'The file may be corrupted or not in valid JSON format.';
        } else if (error.message.includes('CSV')) {
          errorType = 'parse-error';
          errorDetails = 'The CSV file may be corrupted or have formatting issues.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = 'network-error';
          errorDetails = 'Please check your internet connection and try again.';
        }
      }

      setUploadError({
        message: errorMessage,
        type: errorType,
        details: errorDetails
      });
      
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onFileUpload, maxFiles, maxSize, acceptedTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    disabled: uploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearError = () => {
    setUploadError(null);
  };

  const getErrorIcon = (type: UploadError['type']) => {
    switch (type) {
      case 'file-size':
      case 'file-type':
      case 'file-count':
        return <AlertTriangle className="h-4 w-4" />;
      case 'parse-error':
        return <Info className="h-4 w-4" />;
      case 'network-error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorColor = (type: UploadError['type']) => {
    switch (type) {
      case 'file-size':
      case 'file-type':
      case 'file-count':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'parse-error':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'network-error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Data
        </CardTitle>
        <CardDescription>
          Upload CSV, JSON, or Excel files to start analyzing your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          `}
          aria-label="File upload area"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              open();
            }
          }}
        >
          <input {...getInputProps()} />
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive 
                ? 'Drop your file here' 
                : uploading 
                  ? 'Uploading...' 
                  : 'Click to upload or drag and drop'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {acceptedTypes.join(', ')} files up to {formatFileSize(maxSize)}
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing file... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className={`p-4 rounded-lg border ${getErrorColor(uploadError.type)}`}>
            <div className="flex items-start gap-3">
              {getErrorIcon(uploadError.type)}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{uploadError.message}</h4>
                {uploadError.details && (
                  <p className="text-sm mt-1 opacity-90">{uploadError.details}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                aria-label="Dismiss error message"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                  aria-label={`Remove file ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* File Type Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Supported Formats</h4>
          <div className="flex flex-wrap gap-2">
            {acceptedTypes.map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}