import { useState } from 'react'
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface GownCount {
  gown_id: number
  ean: string
  count: number
}

interface DetailedStatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  className?: string
  iconClassName?: string
  detailsData?: GownCount[]
  renderDetails?: (data: GownCount[]) => React.ReactNode
}

export function DetailedStatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  iconClassName,
  detailsData,
  renderDetails,
}: DetailedStatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const hasDetails = detailsData && detailsData.length > 0 && renderDetails

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {hasDetails && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={toggleExpanded}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isExpanded ? "Hide details" : "Show details"}
              </span>
            </Button>
          )}
          {Icon && (
            <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        
        {hasDetails && isExpanded && (
          <div className="mt-4 border-t pt-4">
            <ScrollArea className="h-[200px] pr-4">
              {renderDetails(detailsData)}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
