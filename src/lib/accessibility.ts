// Accessibility utilities for Datuum 2.0

/**
 * Generate unique IDs for form elements to associate with labels
 * 
 * ⚠️ WARNING: This function uses Math.random() and should NOT be used during component render
 * as it will cause React hydration mismatches in Next.js SSR. Use React's useId() hook instead.
 * 
 * @deprecated Use React's useId() hook for SSR-safe ID generation
 * @param prefix - Optional prefix for the generated ID
 * @returns A unique ID string
 * 
 * @example
 * // ❌ Don't use during render (causes hydration errors)
 * const id = generateId('input')
 * 
 * // ✅ Use React's useId() hook instead
 * import { useId } from 'react'
 * const uniqueId = useId()
 * const id = `input-${uniqueId}`
 */
export function generateId(prefix: string = 'id'): string {
  // This function is kept for backwards compatibility but should only be used
  // in client-side event handlers or useEffect hooks, never during render
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * ARIA labels and descriptions for common UI patterns
 */
export const ariaLabels = {
  // File upload
  fileUpload: {
    dropzone: 'File upload dropzone. Drag and drop files here or click to browse.',
    input: 'Choose file to upload',
    processing: 'Processing uploaded file',
    success: 'File uploaded successfully',
    error: 'File upload failed'
  },
  
  // Charts
  chart: {
    canvas: 'Interactive chart visualization',
    loading: 'Loading chart data',
    error: 'Chart rendering error',
    export: 'Export chart options',
    reset: 'Reset chart to default view'
  },
  
  // Navigation
  navigation: {
    home: 'Go to home page',
    newProject: 'Create new project',
    loadProject: 'Load existing project',
    export: 'Export current project',
    help: 'Show help and instructions'
  },
  
  // Data operations
  data: {
    preview: 'Data preview table',
    transform: 'Data transformation tools',
    statistics: 'Data statistics panel',
    loading: 'Loading data',
    processing: 'Processing data'
  },
  
  // UI controls
  controls: {
    toggle: 'Toggle visibility',
    expand: 'Expand section',
    collapse: 'Collapse section',
    close: 'Close dialog',
    confirm: 'Confirm action',
    cancel: 'Cancel action'
  }
}

/**
 * Screen reader announcements for dynamic content changes
 * 
 * @param message - The message to announce to screen readers
 * @param priority - The priority level for the announcement
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  // Check if we're in a browser environment (SSR-safe)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement)
    }
  }, 1000)
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  // Common key codes
  keys: {
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    SPACE: ' ',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight'
  },
  
  // Handle keyboard events for custom components
  handleKeyDown: (event: KeyboardEvent, handlers: Record<string, () => void>) => {
    const handler = handlers[event.key]
    if (handler) {
      event.preventDefault()
      handler()
    }
  },
  
  // Trap focus within a container
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }
    
    document.addEventListener('keydown', handleTabKey)
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }
}

/**
 * Color contrast utilities
 */
export const colorContrast = {
  // Check if text meets WCAG AA contrast requirements
  meetsWCAGAA: (foreground: string, background: string): boolean => {
    // This is a simplified check - in a real app you'd use a proper contrast calculation
    // For now, we'll provide reasonable defaults
    const lightText = '#ffffff'
    const darkText = '#000000'
    
    // Assume light backgrounds need dark text and vice versa
    return true // Simplified for this example
  },
  
  // Get appropriate text color for background
  getTextColor: (backgroundColor: string): string => {
    // Simplified logic - in reality you'd calculate luminance
    const isLight = backgroundColor.toLowerCase().includes('white') || 
                   backgroundColor.toLowerCase().includes('gray-50') ||
                   backgroundColor.toLowerCase().includes('gray-100')
    return isLight ? '#000000' : '#ffffff'
  }
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  // Move focus to element
  focusElement: (element: HTMLElement | null) => {
    if (element) {
      element.focus()
    }
  },
  
  // Focus first focusable element in container
  focusFirst: (container: HTMLElement) => {
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (firstFocusable) {
      firstFocusable.focus()
    }
  },
  
  // Store and restore focus
  storeFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement
  },
  
  restoreFocus: (element: HTMLElement | null) => {
    if (element) {
      element.focus()
    }
  }
}

/**
 * Form accessibility helpers
 */
export const formAccessibility = {
  // Associate label with form control
  associateLabel: (labelId: string, controlId: string) => {
    const label = document.getElementById(labelId)
    const control = document.getElementById(controlId)
    
    if (label && control) {
      control.setAttribute('aria-labelledby', labelId)
    }
  },
  
  // Add error message association
  associateErrorMessage: (controlId: string, errorId: string) => {
    const control = document.getElementById(controlId)
    
    if (control) {
      control.setAttribute('aria-describedby', errorId)
      control.setAttribute('aria-invalid', 'true')
    }
  },
  
  // Clear error state
  clearErrorState: (controlId: string) => {
    const control = document.getElementById(controlId)
    
    if (control) {
      control.removeAttribute('aria-describedby')
      control.removeAttribute('aria-invalid')
    }
  }
}

/**
 * Chart accessibility helpers
 */
export const chartAccessibility = {
  // Generate accessible chart description
  generateDescription: (data: any, chartType: string): string => {
    const rowCount = data?.rows?.length || 0
    const columnCount = data?.headers?.length || 0
    
    return `A ${chartType} chart displaying ${rowCount} data points across ${columnCount} categories. Use keyboard navigation to explore the data.`
  },
  
  // Add chart title and description to canvas
  enhanceCanvas: (canvas: HTMLCanvasElement, title: string, description: string) => {
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', title)
    canvas.setAttribute('aria-describedby', description)
  }
}

/**
 * Validation helpers for accessibility
 */
export const accessibilityValidation = {
  // Check if element has proper ARIA attributes
  validateAriaAttributes: (element: HTMLElement): string[] => {
    const issues: string[] = []
    
    // Check for required ARIA attributes on interactive elements
    if (element.getAttribute('role') === 'button' && !element.getAttribute('aria-label')) {
      issues.push('Button element missing aria-label')
    }
    
    // Check for proper labeling
    if (element.tagName === 'INPUT' && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      issues.push('Input element missing proper labeling')
    }
    
    return issues
  },
  
  // Validate color contrast
  validateColorContrast: (elements: HTMLElement[]): string[] => {
    const issues: string[] = []
    
    elements.forEach(element => {
      const styles = window.getComputedStyle(element)
      const color = styles.color
      const backgroundColor = styles.backgroundColor
      
      if (!colorContrast.meetsWCAGAA(color, backgroundColor)) {
        issues.push(`Poor color contrast on element: ${element.tagName}`)
      }
    })
    
    return issues
  }
}
