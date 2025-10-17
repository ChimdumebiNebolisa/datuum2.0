'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Download,
  Trash2,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { useToast } from '@/lib/toast';

interface FileUploaderProps {
  onFileUpload: (file: File) => Promise<void>;
  onFileRemove?: (file: File) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

interface FilePreview {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  preview?: string;
}

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.includes('csv') || file.name.endsWith('.csv')) {
    return <FileText className="h-8 w-8 text-green-600" />;
  } else if (type.includes('json') || file.name.endsWith('.json')) {
    return <FileJson className="h-8 w-8 text-yellow-600" />;
  } else if (type.includes('spreadsheet') || type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    return <FileSpreadsheet className="h-8 w-8 text-blue-600" />;
  } else {
    return <FileText className="h-8 w-8 text-gray-600" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUploader({ 
  onFileUpload, 
  onFileRemove,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.csv', '.json', '.xlsx', '.xls'],
  className 
}: FileUploaderProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();
  const fileIdCounter = useRef(0);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMessage = errors.map((e: any) => e.message).join(', ');
        toast({
          title: "File rejected",
          description: `${file.name}: ${errorMessage}`,
          variant: "destructive"
        });
      });
    }

    // Handle accepted files
    const newFiles: FilePreview[] = acceptedFiles.map(file => ({
      file,
      id: `file-${fileIdCounter.current++}`,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Upload files
    newFiles.forEach(filePreview => {
      uploadFile(filePreview);
    });
  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const uploadFile = async (filePreview: FilePreview) => {
    setFiles(prev => prev.map(f => 
      f.id === filePreview.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));

    // Simulate progress
    const progressInterval = setInterval(() => {
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id 
          ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
          : f
      ));
    }, 200);

    try {
      await onFileUpload(filePreview.file);

      clearInterval(progressInterval);
      
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

      toast({
        title: "File uploaded successfully!",
        description: `${filePreview.file.name} has been processed`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    }
  };

  const removeFile = (fileId: string) => {
    const filePreview = files.find(f => f.id === fileId);
    if (filePreview) {
      onFileRemove?.(filePreview.file);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const retryUpload = (fileId: string) => {
    const filePreview = files.find(f => f.id === fileId);
    if (filePreview) {
      uploadFile(filePreview);
    }
  };

  const clearAllFiles = () => {
    files.forEach(filePreview => {
      onFileRemove?.(filePreview.file);
    });
    setFiles([]);
  };

  const getStatusIcon = (status: FilePreview['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: FilePreview['status']) => {
    switch (status) {
      case 'pending':
        return 'border-muted-foreground/25';
      case 'uploading':
        return 'border-primary/50 bg-primary/5';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Data Files
          </CardTitle>
          <CardDescription>
            Drag and drop files here, or click to select files
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isDragReject ? 'border-red-500 bg-red-50' : ''}
              hover:border-primary/50 hover:bg-primary/5
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-muted/50'}`}>
                <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-base md:text-lg font-medium">
                  {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {acceptedTypes.join(', ')} files up to {formatFileSize(maxSize)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum {maxFiles} files
                </p>
              </div>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-medium">Uploaded Files ({files.length})</h4>
                <Button variant="outline" size="sm" onClick={clearAllFiles} className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((filePreview) => (
                  <div
                    key={filePreview.id}
                    className={`flex items-center gap-4 p-3 border rounded-lg ${getStatusColor(filePreview.status)}`}
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(filePreview.file)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {filePreview.file.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(filePreview.file.size)}
                        </Badge>
                      </div>
                      
                      {filePreview.status === 'uploading' && (
                        <div className="space-y-1">
                          <Progress value={filePreview.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Uploading... {Math.round(filePreview.progress)}%
                          </p>
                        </div>
                      )}
                      
                      {filePreview.status === 'error' && filePreview.error && (
                        <p className="text-xs text-red-600">
                          {filePreview.error}
                        </p>
                      )}
                      
                      {filePreview.status === 'success' && (
                        <p className="text-xs text-green-600">
                          Upload completed successfully
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(filePreview.status)}
                      
                      {filePreview.status === 'error' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryUpload(filePreview.id)}
                          className="hidden sm:inline-flex"
                        >
                          Retry
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(filePreview.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Summary */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {files.filter(f => f.status === 'success').length}
                </div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">
                  {files.filter(f => f.status === 'uploading').length}
                </div>
                <div className="text-xs text-muted-foreground">Uploading</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-red-600">
                  {files.filter(f => f.status === 'error').length}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
