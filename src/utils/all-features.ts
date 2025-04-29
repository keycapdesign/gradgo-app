import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Server function to fetch all features
export const fetchAllFeatures = createServerFn({ method: 'GET' })
  .validator((data: { sortBy?: string; sortDirection?: 'asc' | 'desc'; search?: string }) => ({
    sortBy: data.sortBy || 'created_at',
    sortDirection: data.sortDirection || 'desc',
    search: data.search || '',
  }))
  .handler(async (ctx) => {
    const { sortBy, sortDirection, search } = ctx.data;
    console.log('Fetching all features with params:', { sortBy, sortDirection, search });
    const supabase = createServerClient();

    // Build the base query
    let query = supabase.from('features').select('*');

    // Add search if provided
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Get all features with sorting
    const { data: features, error } = await query.order(sortBy, {
      ascending: sortDirection === 'asc',
    });

    if (error) {
      console.error(`Error fetching all features: ${error.message}`);
      throw new Error(`Error fetching all features: ${error.message}`);
    }

    return features || [];
  });

// Server function to fetch a single feature by ID
export const fetchFeatureById = createServerFn({ method: 'GET' })
  .validator((data: { featureId: string }) => ({
    featureId: data.featureId,
  }))
  .handler(async (ctx) => {
    const { featureId } = ctx.data;
    console.log(`Fetching feature with ID: ${featureId}`);
    const supabase = createServerClient();

    // Get feature by ID
    const { data: feature, error } = await supabase
      .from('features')
      .select('*')
      .eq('id', featureId)
      .single();

    if (error) {
      console.error(`Error fetching feature: ${error.message}`);
      throw new Error(`Error fetching feature: ${error.message}`);
    }

    return feature;
  });

// Server function to update a feature
export const updateFeature = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      featureId: string;
      title?: string | null;
      subtitle?: string | null;
      link?: string | null;
      background_path?: string | null;
      color?: string | null;
      is_default?: boolean;
      photo_events_only?: boolean;
    }) => ({
      featureId: data.featureId,
      title: data.title,
      subtitle: data.subtitle,
      link: data.link,
      background_path: data.background_path,
      color: data.color,
      is_default: data.is_default,
      photo_events_only: data.photo_events_only,
    })
  )
  .handler(async (ctx) => {
    const {
      featureId,
      title,
      subtitle,
      link,
      background_path,
      color,
      is_default,
      photo_events_only,
    } = ctx.data;

    console.log(`Updating feature with ID: ${featureId}`);
    const supabase = createServerClient();

    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (link !== undefined) updateData.link = link;
    if (background_path !== undefined) updateData.background_path = background_path;
    if (color !== undefined) updateData.color = color;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (photo_events_only !== undefined) updateData.photo_events_only = photo_events_only;

    // Update feature
    const { data: updatedFeature, error } = await supabase
      .from('features')
      .update(updateData)
      .eq('id', featureId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating feature: ${error.message}`);
      throw new Error(`Error updating feature: ${error.message}`);
    }

    return updatedFeature;
  });

// Query options for all features
export const allFeaturesQueryOptions = (
  sortBy: string = 'created_at',
  sortDirection: 'asc' | 'desc' = 'desc',
  search: string = ''
) =>
  queryOptions({
    queryKey: ['features', 'all', { sortBy, sortDirection, search }],
    queryFn: () =>
      fetchAllFeatures({
        data: { sortBy, sortDirection, search },
      }),
  });

// Query options for feature detail
export const featureDetailQueryOptions = (featureId: string) =>
  queryOptions({
    queryKey: ['features', 'detail', featureId],
    queryFn: () =>
      fetchFeatureById({
        data: { featureId },
      }),
  });

// Server function to create a feature with default values
export const createFeature = createServerFn({ method: 'POST' }).handler(async () => {
  console.log('Creating new feature with default values');
  const supabase = createServerClient();

  // Create feature with default values
  const { data: newFeature, error } = await supabase
    .from('features')
    .insert({
      title: 'New Feature',
      is_default: false,
      photo_events_only: false,
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating feature: ${error.message}`);
    throw new Error(`Error creating feature: ${error.message}`);
  }

  return newFeature;
});

// Server function to delete a feature
export const deleteFeature = createServerFn({ method: 'POST' })
  .validator((data: { featureId: string }) => ({
    featureId: data.featureId,
  }))
  .handler(async (ctx) => {
    const { featureId } = ctx.data;
    console.log(`Deleting feature with ID: ${featureId}`);
    const supabase = createServerClient();

    // First, delete any event associations
    const { error: eventFeatureError } = await supabase
      .from('event_features')
      .delete()
      .eq('feature_id', featureId);

    if (eventFeatureError) {
      console.error(`Error deleting event associations: ${eventFeatureError.message}`);
      throw new Error(`Error deleting event associations: ${eventFeatureError.message}`);
    }

    // Then delete the feature
    const { error } = await supabase.from('features').delete().eq('id', featureId);

    if (error) {
      console.error(`Error deleting feature: ${error.message}`);
      throw new Error(`Error deleting feature: ${error.message}`);
    }

    return { success: true, featureId };
  });

// Server function to duplicate a feature
export const duplicateFeature = createServerFn({ method: 'POST' })
  .validator((data: { featureId: string }) => ({
    featureId: data.featureId,
  }))
  .handler(async (ctx) => {
    const { featureId } = ctx.data;
    console.log(`Duplicating feature with ID: ${featureId}`);
    const supabase = createServerClient();

    // Get the feature to duplicate
    const { data: feature, error: fetchError } = await supabase
      .from('features')
      .select('*')
      .eq('id', featureId)
      .single();

    if (fetchError) {
      console.error(`Error fetching feature to duplicate: ${fetchError.message}`);
      throw new Error(`Error fetching feature to duplicate: ${fetchError.message}`);
    }

    if (!feature) {
      throw new Error('Feature not found');
    }

    // Create a new feature with the same properties
    const { data: newFeature, error: insertError } = await supabase
      .from('features')
      .insert({
        title: `${feature.title} (Copy)`,
        subtitle: feature.subtitle,
        link: feature.link,
        background_path: feature.background_path,
        color: feature.color,
        is_default: false, // Always set to false for duplicates
        photo_events_only: feature.photo_events_only,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating duplicate feature: ${insertError.message}`);
      throw new Error(`Error creating duplicate feature: ${insertError.message}`);
    }

    return newFeature;
  });
