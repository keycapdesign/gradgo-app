import { Calendar, Clock, Mail, Phone, User } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ContactInfoProps {
  contact: any
  isLoading: boolean
}

export function ContactInfo({ contact, isLoading }: ContactInfoProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-grow space-y-4 w-full">
              <Skeleton className="h-8 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Selfie Image */}
            <div className="flex-shrink-0">
              {contact?.selfieSignedUrl ? (
                <div className="h-32 w-32 rounded-full overflow-hidden border">
                  {console.log(`Rendering selfie with URL: ${contact.selfieSignedUrl.substring(0, 50)}...`)}
                  <img
                    src={contact.selfieSignedUrl}
                    alt={contact.full_name || 'Contact'}
                    className="h-full w-full object-cover"
                    onLoad={() => console.log('Selfie image loaded successfully')}
                    onError={(e) => console.error('Error loading selfie image:', e)}
                  />
                </div>
              ) : (
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border">
                  {console.log(`No selfie URL available for contact:`, contact?.selfie_path)}
                  <span className="text-2xl font-bold text-muted-foreground">
                    {contact?.first_name?.[0] || ''}{contact?.surname?.[0] || ''}
                  </span>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="flex-grow space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{contact?.full_name || 'No Name'}</h3>
                <div className="flex flex-col space-y-2 mt-2">
                  {contact?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{contact.email}</span>
                    </div>
                  )}
                  {contact?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{contact.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Created {contact?.created_at ? format(new Date(contact.created_at), 'PPP') : 'Unknown'}
                    </span>
                  </div>
                  {contact?.photo_start_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Photo Session: {format(new Date(contact.photo_start_time), 'PPP p')}
                      </span>
                    </div>
                  )}
                  {contact?.user_id && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        User ID: {contact.user_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
