import { ExternalLink } from 'lucide-react';
import { Offer } from './types';
import { trackOfferClickEvent } from '@/utils/event-tracking';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface OfferCardProps {
  offer: Offer | null;
  eventId?: number;
  contactId?: number;
}

export function OfferCard({ offer, eventId, contactId }: OfferCardProps) {
  // If offer is null, return nothing
  if (!offer) return null;

  // Format the expiration date if it exists
  const expirationDate = offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : null;

  // Handle the redeem button click
  const handleRedeemClick = () => {
    if (offer.link) {
      // Track offer click before opening the link
      if (eventId) {
        trackOfferClickEvent(offer.id, offer.title || 'Unnamed Offer', eventId, contactId).catch(
          (error) => {
            console.error('Error tracking offer click:', error);
          }
        );
      }

      window.open(offer.link, '_blank');
    }
  };

  return (
    <Card
      className="relative overflow-hidden"
      style={offer.color ? { borderColor: offer.color } : undefined}
    >
      {offer.background_path && (
        <div className="absolute inset-0">
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/offers_images/${offer.background_path}`}
            alt={offer.title || 'Offer Background'}
            className="h-full w-full object-cover"
          />
          {/* Semi-transparent color overlay */}
          <div
            className="absolute inset-0 opacity-70"
            style={{ backgroundColor: offer.color || 'rgba(0, 0, 0, 0.3)' }}
          ></div>
        </div>
      )}
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-white font-bold text-xl`}>
            {offer.title || 'Special Offer'}
          </CardTitle>
          {offer.discount_value && offer.offer_type && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-white border border-white font-bold text-lg"
            >
              {offer.offer_type === 'percentage_off'
                ? `${offer.discount_value}% off`
                : `£${offer.discount_value} off`}
            </Badge>
          )}
        </div>
      </CardHeader>
      {expirationDate && (
        <CardContent className="pb-2 relative z-10">
          <p
            className={`text-xs ${offer.background_path ? 'text-white/80' : 'text-muted-foreground'}`}
          >
            Valid until {expirationDate}
          </p>
        </CardContent>
      )}
      {offer.link && (
        <CardFooter className="pt-0 relative z-10">
          <Button
            variant={offer.background_path ? 'secondary' : 'default'}
            size="sm"
            className="w-full"
            onClick={handleRedeemClick}
          >
            <span>Redeem Offer</span>
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
