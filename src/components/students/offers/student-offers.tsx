import { useSuspenseQuery } from '@tanstack/react-query';

import { EmptyOffers } from './empty-offers';
import { OfferCard } from './offer-card';
import { EventOffer } from './types';
import { studentContactQueryOptions } from '@/utils/student-contact';
import { eventOffersQueryOptions } from '@/utils/events';

export function StudentOffers() {
  // Fetch contact data to get the event_id
  const { data: contactData } = useSuspenseQuery(studentContactQueryOptions());
  const eventId = contactData?.event_id;

  // Fetch offers for the event if we have an event_id
  const { data: eventOffers = [] } = eventId
    ? useSuspenseQuery(eventOffersQueryOptions(eventId.toString()))
    : { data: [] };

  // Filter out expired offers
  const validOffers = eventOffers.filter((eventOffer: EventOffer) => {
    const offer = eventOffer.offer;
    if (!offer) return false;

    // Check if the offer has expired
    const isExpired = offer.expires_at ? new Date(offer.expires_at) < new Date() : false;

    return !isExpired;
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Special Offers</h2>
        <p className="text-sm text-muted-foreground mb-4">Exclusive deals for your graduation</p>

        {validOffers.length > 0 ? (
          <div className="space-y-4">
            {validOffers.map((eventOffer: EventOffer) => (
              <OfferCard
                key={eventOffer.offer_id}
                offer={eventOffer.offer}
                eventId={eventId || undefined}
                contactId={contactData?.contact_id || undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyOffers />
        )}
      </div>
    </div>
  );
}
