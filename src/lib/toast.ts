// Simple toast implementation that works with the new ToastProvider
export { useToast } from '@/components/ui/simple-toast'
import { logger } from '@/lib/logger';

// Re-export toast function for backward compatibility
export function toast(options: {
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}) {
  // This will be handled by the ToastProvider context
  // For now, we'll just log to console as a fallback
  logger.debug('Toast:', options)
}
