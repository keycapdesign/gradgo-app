import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Define types for gown compositions
export interface GownComposition {
  id: number;
  composition_set_id: number;
  parent_ean: string;
  gown: string | null;
  hood: string | null;
  cap: string | null;
  bonnet: string | null;
  created_at: string;
}

export interface GownCompositionSet {
  id: number;
  name: string;
  description: string | null;
  event_id: number;
  is_active: boolean;
  created_at: string;
  schema_type: 'csv_upload' | 'manual_definition' | 'pattern_definition';
  metadata?: any;
}

// Server function to fetch gown composition sets for an event
export const fetchGownCompositionSets = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching gown composition sets for event: ${eventId}`);
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('gown_composition_sets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching gown composition sets: ${error.message}`);
      throw new Error(`Error fetching gown composition sets: ${error.message}`);
    }

    return data || [];
  });

// Query options for gown composition sets
export const gownCompositionSetsQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ['event', eventId, 'gownCompositionSets'],
    queryFn: () => fetchGownCompositionSets({ data: { eventId } }),
    enabled: !!eventId,
  });

// Server function to set a composition set as active
export const setActiveGownCompositionSet = createServerFn({ method: 'POST' })
  .validator((data: { compositionSetId: number }) => ({
    compositionSetId: data.compositionSetId,
  }))
  .handler(async (ctx) => {
    const { compositionSetId } = ctx.data;
    console.log(`Setting gown composition set ${compositionSetId} as active`);
    const supabase = createServerClient();

    const { data, error } = await supabase.rpc('set_active_gown_composition_set', {
      p_composition_set_id: compositionSetId,
    });

    if (error) {
      console.error(`Error setting active gown composition set: ${error.message}`);
      throw new Error(`Error setting active gown composition set: ${error.message}`);
    }

    return data;
  });

// Server function to fetch compositions for a specific set
export const fetchGownCompositions = createServerFn({ method: 'GET' })
  .validator((data: { compositionSetId: number }) => ({
    compositionSetId: data.compositionSetId,
  }))
  .handler(async (ctx) => {
    const { compositionSetId } = ctx.data;
    console.log(`Fetching gown compositions for set: ${compositionSetId}`);
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('gown_compositions')
      .select('*')
      .eq('composition_set_id', compositionSetId)
      .order('parent_ean', { ascending: true });

    if (error) {
      console.error(`Error fetching gown compositions: ${error.message}`);
      throw new Error(`Error fetching gown compositions: ${error.message}`);
    }

    return data || [];
  });

// Query options for gown compositions
export const gownCompositionsQueryOptions = (compositionSetId: number) =>
  queryOptions({
    queryKey: ['gownCompositionSet', compositionSetId, 'compositions'],
    queryFn: () => fetchGownCompositions({ data: { compositionSetId } }),
    enabled: !!compositionSetId,
  });

// Server function to delete a composition set
export const deleteGownCompositionSet = createServerFn({ method: 'POST' })
  .validator((data: { compositionSetId: number }) => ({
    compositionSetId: data.compositionSetId,
  }))
  .handler(async (ctx) => {
    const { compositionSetId } = ctx.data;
    console.log(`Deleting gown composition set: ${compositionSetId}`);
    const supabase = createServerClient();

    // The cascade delete constraint will handle deleting related compositions
    const { error } = await supabase
      .from('gown_composition_sets')
      .delete()
      .eq('id', compositionSetId);

    if (error) {
      console.error(`Error deleting gown composition set: ${error.message}`);
      throw new Error(`Error deleting gown composition set: ${error.message}`);
    }

    return true;
  });
