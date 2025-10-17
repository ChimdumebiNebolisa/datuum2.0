'use client'

import React from 'react'
import { Loader2, FileText, BarChart3, Database, Upload, Sparkles } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 
      className={`animate-spin text-primary-600 ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    />
  )
}

interface LoadingOverlayProps {
  message?: string
  isVisible: boolean
  className?: string
}

export function LoadingOverlay({ 
  message = 'Loading...', 
  isVisible, 
  className = '' 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        aria-hidden="true"
      />
    )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          } ${className}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  icon?: React.ReactNode
  message?: string
  progress?: number
}

export function LoadingCard({ 
  title = 'Processing', 
  icon,
  message = 'Please wait while we process your request...',
  progress 
}: LoadingCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center">
        {icon && (
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>

        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="md" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Processing...
          </span>
        </div>

        {progress !== undefined && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Specific loading components for different parts of the app
export function FileUploadLoading({ fileName }: { fileName?: string }) {
  return (
    <LoadingCard
      title="Uploading File"
      icon={<Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
      message={fileName ? `Processing ${fileName}...` : 'Processing your file...'}
    />
  )
}

export function ChartRenderingLoading({ chartType }: { chartType?: string }) {
  return (
    <LoadingCard
      title="Rendering Chart"
      icon={<BarChart3 className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
      message={`Creating your ${chartType || 'chart'} visualization...`}
    />
  )
}

export function DataProcessingLoading({ operation }: { operation?: string }) {
  return (
    <LoadingCard
      title="Processing Data"
      icon={<Database className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
      message={operation ? `${operation} your data...` : 'Processing your data...'}
    />
  )
}


// Inline loading states for buttons and small components
interface InlineLoadingProps {
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
  disabled?: boolean
  className?: string
}

export function InlineLoading({ 
  children, 
  isLoading, 
  loadingText = 'Loading...',
  disabled = false,
  className = ''
}: InlineLoadingProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isLoading && <LoadingSpinner size="sm" />}
      <span className={isLoading ? 'opacity-75' : ''}>
        {isLoading ? loadingText : children}
      </span>
    </div>
  )
}

// Button loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText = 'Loading...',
  children, 
  disabled,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`relative ${className}`}
    >
      <InlineLoading
        isLoading={isLoading}
        loadingText={loadingText}
        disabled={disabled || isLoading}
      >
        {children}
      </InlineLoading>
    </button>
  )
}
