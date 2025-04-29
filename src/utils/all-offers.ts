import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Server function to fetch all offers
export const fetchAllOffers = createServerFn({ method: 'GET' })
  .validator((data: { sortBy?: string; sortDirection?: 'asc' | 'desc'; search?: string }) => ({
    sortBy: data.sortBy || 'created_at',
    sortDirection: data.sortDirection || 'desc',
    search: data.search || '',
  }))
  .handler(async (ctx) => {
    const { sortBy, sortDirection, search } = ctx.data;
    console.log('Fetching all offers with params:', { sortBy, sortDirection, search });
    const supabase = createServerClient();

    // Build the base query
    let query = supabase.from('offers').select('*');

    // Add search if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%`);
    }

    // Get all offers with sorting
    const { data: offers, error } = await query.order(sortBy, {
      ascending: sortDirection === 'asc',
    });

    if (error) {
      console.error(`Error fetching all offers: ${error.message}`);
      throw new Error(`Error fetching all offers: ${error.message}`);
    }

    return offers || [];
  });

// Server function to fetch a single offer by ID
export const fetchOfferById = createServerFn({ method: 'GET' })
  .validator((data: { offerId: string }) => ({
    offerId: data.offerId,
  }))
  .handler(async (ctx) => {
    const { offerId } = ctx.data;
    console.log(`Fetching offer with ID: ${offerId}`);
    const supabase = createServerClient();

    // Get offer by ID
    const { data: offer, error } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (error) {
      console.error(`Error fetching offer: ${error.message}`);
      throw new Error(`Error fetching offer: ${error.message}`);
    }

    return offer;
  });

// Server function to update an offer
export const updateOffer = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      offerId: string;
      title?: string | null;
      discount_value?: number | null;
      offer_type?: 'percentage_off' | 'amount_off' | null;
      background_path?: string | null;
      logo_path?: string | null;
      color?: string | null;
      link?: string | null;
      expires_at?: string | null;
    }) => ({
      offerId: data.offerId,
      title: data.title,
      discount_value: data.discount_value,
      offer_type: data.offer_type,
      background_path: data.background_path,
      logo_path: data.logo_path,
      color: data.color,
      link: data.link,
      expires_at: data.expires_at,
    })
  )
  .handler(async (ctx) => {
    const {
      offerId,
      title,
      discount_value,
      offer_type,
      background_path,
      logo_path,
      color,
      link,
      expires_at,
    } = ctx.data;

    console.log(`Updating offer with ID: ${offerId}`);
    const supabase = createServerClient();

    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (discount_value !== undefined) updateData.discount_value = discount_value;
    if (offer_type !== undefined) updateData.offer_type = offer_type;
    if (background_path !== undefined) updateData.background_path = background_path;
    if (logo_path !== undefined) updateData.logo_path = logo_path;
    if (color !== undefined) updateData.color = color;
    if (link !== undefined) updateData.link = link;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    // Update offer
    const { data: updatedOffer, error } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', offerId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating offer: ${error.message}`);
      throw new Error(`Error updating offer: ${error.message}`);
    }

    return updatedOffer;
  });

// Query options for all offers
export const allOffersQueryOptions = (
  sortBy: string = 'created_at',
  sortDirection: 'asc' | 'desc' = 'desc',
  search: string = ''
) =>
  queryOptions({
    queryKey: ['offers', 'all', { sortBy, sortDirection, search }],
    queryFn: () =>
      fetchAllOffers({
        data: { sortBy, sortDirection, search },
      }),
  });

// Query options for offer detail
export const offerDetailQueryOptions = (offerId: string) =>
  queryOptions({
    queryKey: ['offers', 'detail', offerId],
    queryFn: () =>
      fetchOfferById({
        data: { offerId },
      }),
  });

// Server function to create an offer with default values
export const createOffer = createServerFn({ method: 'POST' }).handler(async () => {
  console.log('Creating new offer with default values');
  const supabase = createServerClient();

  // Create offer with default values
  const { data: newOffer, error } = await supabase
    .from('offers')
    .insert({
      title: 'New Offer',
      offer_type: 'percentage_off',
      discount_value: 10,
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating offer: ${error.message}`);
    throw new Error(`Error creating offer: ${error.message}`);
  }

  return newOffer;
});

// Server function to delete an offer
export const deleteOffer = createServerFn({ method: 'POST' })
  .validator((data: { offerId: string }) => ({
    offerId: data.offerId,
  }))
  .handler(async (ctx) => {
    const { offerId } = ctx.data;
    console.log(`Deleting offer with ID: ${offerId}`);
    const supabase = createServerClient();

    // First, delete any event associations
    const { error: eventOfferError } = await supabase
      .from('event_offers')
      .delete()
      .eq('offer_id', offerId);

    if (eventOfferError) {
      console.error(`Error deleting event associations: ${eventOfferError.message}`);
      throw new Error(`Error deleting event associations: ${eventOfferError.message}`);
    }

    // Then delete the offer
    const { error } = await supabase.from('offers').delete().eq('id', offerId);

    if (error) {
      console.error(`Error deleting offer: ${error.message}`);
      throw new Error(`Error deleting offer: ${error.message}`);
    }

    return { success: true, offerId };
  });

// Server function to duplicate an offer
export const duplicateOffer = createServerFn({ method: 'POST' })
  .validator((data: { offerId: string }) => ({
    offerId: data.offerId,
  }))
  .handler(async (ctx) => {
    const { offerId } = ctx.data;
    console.log(`Duplicating offer with ID: ${offerId}`);
    const supabase = createServerClient();

    // Get the offer to duplicate
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (fetchError) {
      console.error(`Error fetching offer to duplicate: ${fetchError.message}`);
      throw new Error(`Error fetching offer to duplicate: ${fetchError.message}`);
    }

    if (!offer) {
      throw new Error('Offer not found');
    }

    // Create a new offer with the same properties
    const { data: newOffer, error: insertError } = await supabase
      .from('offers')
      .insert({
        title: `${offer.title} (Copy)`,
        discount_value: offer.discount_value,
        offer_type: offer.offer_type,
        background_path: offer.background_path,
        logo_path: offer.logo_path,
        color: offer.color,
        link: offer.link,
        expires_at: offer.expires_at,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating duplicate offer: ${insertError.message}`);
      throw new Error(`Error creating duplicate offer: ${insertError.message}`);
    }

    return newOffer;
  });
