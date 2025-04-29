import { useState } from 'react'
import { Clock, CircleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PendingStatusBadgeProps {
  status: string
  pendingOperation?: {
    type: string
    description: string
    timestamp?: number
    id?: number
    error?: string
  } | null
  bookingId?: number
  error?: string | null
}

export function PendingStatusBadge({ status, pendingOperation, error }: PendingStatusBadgeProps) {
  // LOGGING: Show received error prop
  console.log('[OFFLINE_DEBUG] PendingStatusBadge error prop:', error);

  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  // Determine the badge variant based on status or error
  let variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'warning' | 'success' = 'outline'

if (status === 'collected') {
    variant = 'warning'
  } else if (status === 'late') {
    variant = 'destructive'
  } else if (status === 'returned') {
    variant = 'success'
  } else if (status === 'awaiting_pickup') {
    variant = 'secondary'
  }

  // If there's no pending operation and no error, just return a regular badge
  if (!pendingOperation && !error) {
    return (
      <Badge variant={variant}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    )
  }

  // For pending operations or errors, add a special style and tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${error ? 'inline-block p-1 border-1 border-dashed border-red-400 rounded-lg' : ''}`}>
            <Badge
              variant={variant}
              className={`border-dashed border-2 flex items-center gap-1`}
            >
              {error ? (
                <CircleAlert size={16} className="bg-red-400 text-white rounded-full top-0 left-0" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs">
            {error ? (
              <>
                <p className="font-semibold text-red-400">Sync Error</p>
                <p>{error}</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Pending Update</p>
                <p>{pendingOperation?.description}</p>
                {pendingOperation?.timestamp && (
                  <p className="text-muted-foreground mt-1">
                    Added {new Date(pendingOperation.timestamp).toLocaleTimeString()}
                  </p>
                )}
                <p className="text-muted-foreground mt-1">Will be applied when back online</p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}