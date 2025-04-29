import { queryOptions } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

// Define query options for event features
export const eventFeaturesQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ['event-features', eventId],
    queryFn: async () => {
      const supabase = createClient();

      // Fetch all features for the event, expanding feature details
      const { data: eventFeatures, error } = await supabase
        .from('event_features')
        .select('index, feature_id(*)')
        .eq('event_id', eventId)
        .order('index');

      if (error) throw new Error(error.message);
      if (!eventFeatures) return [];

      // Map to just the expanded feature data, preserving order, and flatten in case of array
      return eventFeatures
        .map((ef) => ef.feature_id)
        .filter(Boolean)
        .flat();
    },
  });
