import { OperationType } from '@/utils/offline/queue'

export interface EnhancedOperation {
  id?: number
  type: OperationType
  data: any
  timestamp: number
  processed: boolean
  error?: string
  retryCount: number
  status: 'pending' | 'failed' | 'completed'
  description: string
} 