import { Calendar, Clock, MapPin, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ContactBookingsProps {
  bookings: any[]
  isLoading: boolean
}

export function ContactBookings({ bookings, isLoading }: ContactBookingsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="overflow-hidden py-0">
                <CardHeader className="py-3 bg-muted/30">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="grid gap-4">
            {bookings.map((booking: any) => (
              <Card key={booking.id} className="overflow-hidden py-0">
                <CardHeader className="py-3 bg-muted/30">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                    <div>
                      <CardTitle className="text-base">{booking.event?.name || 'Unknown Event'}</CardTitle>
                      {booking.order_number && (
                        <div className="flex items-center gap-1 mt-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Order: {booking.order_number}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {booking.order_type && (
                        <Badge variant="outline">{booking.order_type}</Badge>
                      )}
                      {booking.award && (
                        <Badge variant="secondary">{booking.award}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Created {format(new Date(booking.created_at), 'PPP')}
                        </span>
                      </div>
                      {booking.check_in_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Check-in: {format(new Date(booking.check_in_time), 'PPP p')}
                          </span>
                        </div>
                      )}
                      {booking.check_out_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Check-out: {format(new Date(booking.check_out_time), 'PPP p')}
                          </span>
                        </div>
                      )}
                    </div>
                    {booking.gown && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Gown: {booking.gown.name || `#${booking.gown.id}`}
                          </span>
                        </div>
                        {booking.gown.location && (
                          <div className="flex items-center gap-2 ml-6">
                            <span className="text-sm text-muted-foreground">
                              Location: {booking.gown.location}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No bookings found for this contact.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
