'use client';

import { Info } from 'lucide-react';

export interface MethodInfoProps {
  methodName: string;
  description: string;
  additionalInfo?: string;
  className?: string;
}

/**
 * Reusable method information component for analytics panels
 */
export function MethodInfo({
  methodName,
  description,
  additionalInfo,
  className = ''
}: MethodInfoProps) {
  return (
    <div className={`p-3 bg-muted/50 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Info className="h-4 w-4" />
        <span className="font-medium text-sm">{methodName}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {additionalInfo && (
        <p className="text-xs text-muted-foreground mt-1">{additionalInfo}</p>
      )}
    </div>
  );
}
