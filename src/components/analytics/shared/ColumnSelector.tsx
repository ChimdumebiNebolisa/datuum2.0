'use client';

import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ColumnSelectorProps {
  columns: string[];
  selectedColumns: string[];
  onSelectionChange: (columns: string[]) => void;
  multiSelect?: boolean;
  maxSelections?: number;
  className?: string;
  label?: string;
  description?: string;
}

/**
 * Reusable column selector component for analytics panels
 */
export function ColumnSelector({
  columns,
  selectedColumns,
  onSelectionChange,
  multiSelect = false,
  maxSelections = 5,
  className = '',
  label = 'Select Columns',
  description
}: ColumnSelectorProps) {
  const handleColumnToggle = (column: string) => {
    if (multiSelect) {
      if (selectedColumns.includes(column)) {
        onSelectionChange(selectedColumns.filter(col => col !== column));
      } else if (selectedColumns.length < maxSelections) {
        onSelectionChange([...selectedColumns, column]);
      }
    } else {
      onSelectionChange([column]);
    }
  };

  const handleSelectChange = (value: string) => {
    onSelectionChange([value]);
  };

  if (multiSelect) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div>
          <h4 className="font-medium">{label}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {columns.map(col => (
            <Badge 
              key={col}
              variant={selectedColumns.includes(col) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => handleColumnToggle(col)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleColumnToggle(col);
                }
              }}
              aria-label={`${selectedColumns.includes(col) ? 'Remove' : 'Add'} column ${col}`}
            >
              {col}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {multiSelect 
            ? `Click to select/deselect columns (${selectedColumns.length}/${maxSelections} selected)`
            : `Click to select columns`
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Select 
        value={selectedColumns[0] || ''} 
        onValueChange={handleSelectChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a column" />
        </SelectTrigger>
        <SelectContent>
          {columns.map(col => (
            <SelectItem key={col} value={col}>
              {col}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
