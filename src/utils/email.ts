/**
 * Email utility functions for the application
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string | Uint8Array; contentType?: string }>;
}

/**
 * Sends an email using Mailgun API
 * @param options Email options including recipient, subject, and content
 * @returns Promise with success status and optional ID or error message
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const mailgunApiKey = process.env.VITE_MAILGUN_API_KEY!;
    const mailgunDomain = process.env.VITE_MAILGUN_DOMAIN!;
    const defaultFrom = `GradGo <noreply@${mailgunDomain}>`;

    const formData = new FormData();
    formData.append('from', options.from || defaultFrom);
    formData.append('to', options.to);
    formData.append('subject', options.subject);
    formData.append('text', options.text);
    formData.append('html', options.html);

    if (options.replyTo) {
      formData.append('h:Reply-To', options.replyTo);
    }

    // Add attachments if any
    if (options.attachments) {
      for (const attachment of options.attachments) {
        formData.append(
          'attachment',
          new Blob([attachment.content], {
            type: attachment.contentType || 'application/octet-stream',
          }),
          attachment.filename
        );
      }
    }

    // Send the email via Mailgun
    const response = await fetch(`https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email. Status: ${response.status}, Response: ${errorText}`);
    }

    const responseData = await response.json();

    return {
      success: true,
      id: responseData.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Logs an email event to the database
 * @param contactId The contact ID associated with the email
 * @param emailType The type of email sent
 * @param recipientEmail The recipient's email address
 * @param status The status of the email (sent, failed, etc.)
 * @param metadata Optional metadata about the email
 */
export async function logEmailSent(
  supabase: any,
  contactId: string | number | null | undefined,
  emailType: string,
  recipientEmail: string,
  status: 'sent' | 'failed' | 'pending' = 'sent',
  metadata: Record<string, any> = {}
) {
  try {
    const { error } = await supabase.from('email_logs').insert({
      contact_id: contactId,
      email_type: emailType,
      recipient_email: recipientEmail,
      status: status,
      metadata: metadata,
    });

    if (error) {
      console.error(`Error logging email: ${error.message}`);
    }
  } catch (error) {
    console.error('Error logging email:', error);
  }
}
