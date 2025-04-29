/**
 * Support-related server functions
 */
import { createServerFn } from '@tanstack/react-start';

import { logEmailSent, sendEmail } from './email';
import { createClient as createServerClient } from '@/utils/supabase/server';

interface SupportEmailParams {
  message: string;
  subject?: string;
  contactId?: number | null;
}

/**
 * Server function to send a support email
 */
export const sendSupportEmail = createServerFn({ method: 'POST' })
  .validator((data: { message: string; subject?: string; contactId?: number | null }) => ({
    message: data.message,
    subject: data.subject || 'Support Request',
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { message, subject, contactId } = ctx.data;
    console.log(`Sending support email for contact: ${contactId}`);

    const supabase = createServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user email
    let userEmail = user.email;

    // If contactId is provided, get the contact's email
    if (contactId) {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('email, first_name')
        .eq('id', contactId)
        .single();

      if (contactError) {
        console.warn(`Could not fetch contact data: ${contactError.message}`);
        // Continue with user email if contact fetch fails
      } else if (contactData) {
        // Use contact email if available
        userEmail = contactData.email;
      }
    }

    if (!userEmail) {
      throw new Error('Could not determine user email');
    }

    // Create the email content
    const text = `User Email: ${userEmail}\n\nMessage:\n${message}`;
    const html = `
      <h3>Support Request from ${userEmail}</h3>
      <p><strong>User Email:</strong> ${userEmail}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    // Send the email
    const emailResult = await sendEmail({
      to: 'info@evess.co',
      subject: `Support Request: ${subject}`,
      text: text,
      html: html,
      from: `Support Request <${userEmail}>`,
      replyTo: userEmail,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send support email');
    }

    // Log the email in the database
    await logEmailSent(supabase, contactId || user.id, 'support_request', userEmail, 'sent', {
      subject,
    });

    // Store the support message in the database if needed
    // Uncomment when the support_messages table is created
    /*
    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      contact_id: contactId,
      message,
      subject
    })

    if (error) throw error
    */

    return { success: true, id: emailResult.id };
  });
