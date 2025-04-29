import { queryOptions } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

// Query options for feature associations
export const featureAssociationsQueryOptions = (featureId: string) =>
  queryOptions({
    queryKey: ['feature', featureId, 'associations'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_features')
        .select('event_id')
        .eq('feature_id', featureId);

      if (error) throw error;

      return data.map((item) => item.event_id);
    },
  });

// Query options for offer associations
export const offerAssociationsQueryOptions = (offerId: string) =>
  queryOptions({
    queryKey: ['offer', offerId, 'associations'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_offers')
        .select('event_id')
        .eq('offer_id', offerId);

      if (error) throw error;

      return data.map((item) => item.event_id);
    },
  });

// Mutation function for toggling feature association
export const toggleFeatureAssociation = async ({
  featureId,
  eventId,
  isAssociated,
}: {
  featureId: string;
  eventId: number;
  isAssociated: boolean;
}) => {
  const supabase = createClient();

  if (isAssociated) {
    // Associate feature with event
    const { error } = await supabase.from('event_features').insert({
      event_id: eventId,
      feature_id: featureId,
      // Add to the end of the list
      index: 999,
    });

    if (error) throw error;
  } else {
    // Disassociate feature from event
    const { error } = await supabase
      .from('event_features')
      .delete()
      .eq('event_id', eventId)
      .eq('feature_id', featureId);

    if (error) throw error;
  }

  return { featureId, eventId, isAssociated };
};

// Mutation function for toggling offer association
export const toggleOfferAssociation = async ({
  offerId,
  eventId,
  isAssociated,
}: {
  offerId: string;
  eventId: number;
  isAssociated: boolean;
}) => {
  const supabase = createClient();

  if (isAssociated) {
    // Associate offer with event
    const { error } = await supabase.from('event_offers').insert({
      event_id: eventId,
      offer_id: offerId,
      // Add to the end of the list
      index: 999,
    });

    if (error) throw error;
  } else {
    // Disassociate offer from event
    const { error } = await supabase
      .from('event_offers')
      .delete()
      .eq('event_id', eventId)
      .eq('offer_id', offerId);

    if (error) throw error;
  }

  return { offerId, eventId, isAssociated };
};
