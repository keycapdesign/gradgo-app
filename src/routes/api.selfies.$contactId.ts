import { createAdminClient } from '@/utils/supabase/admin';

export async function loader({ params }: { params: { contactId: string } }) {
  const contactId = parseInt(params.contactId);
  
  if (isNaN(contactId)) {
    return new Response('Invalid contact ID', { status: 400 });
  }
  
  console.log('API: Fetching selfie for contact:', contactId);
  
  try {
    const supabase = createAdminClient();
    
    // Fetch the selfie record using the admin client to bypass RLS
    const { data: selfie, error } = await supabase
      .from('selfies')
      .select('*')
      .eq('contact_id', contactId)
      .maybeSingle();
      
    if (error) {
      console.error('API: Error fetching selfie:', error);
      return new Response('Error fetching selfie', { status: 500 });
    }
    
    console.log('API: Selfie record fetched:', selfie);
    
    if (selfie) {
      return Response.json(selfie);
    }
    
    return new Response('Selfie not found', { status: 404 });
  } catch (err) {
    console.error('API: Error in selfie API route:', err);
    return new Response('Server error', { status: 500 });
  }
}
