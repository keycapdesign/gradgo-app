import { createServerFn } from '@tanstack/react-start';
import { SquareClient, SquareEnvironment } from 'square';
import { v4 as uuid } from 'uuid';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Initialize Square client
const getSquareClient = () => {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
  });
};

// Define types for the checkout function
interface PurchaseOption {
  digitalDownload: boolean;
  printCopy: boolean;
}

interface CheckoutImage {
  id: string;
  purchaseOptions: PurchaseOption;
}

interface CreateCheckoutLinkParams {
  contactId: number;
  images: CheckoutImage[];
  redirectUrl?: string;
}

// Server function to create a Square checkout link
export const createSquareCheckoutLink = createServerFn({ method: 'POST' })
  .validator((data: CreateCheckoutLinkParams) => ({
    contactId: data.contactId,
    images: data.images,
    redirectUrl: data.redirectUrl || 'https://gradgo.evess.co/students/gallery',
  }))
  .handler(async (ctx) => {
    const { contactId, images, redirectUrl } = ctx.data;
    const supabase = createServerClient();
    const squareClient = getSquareClient();
    const locationId = process.env.SQUARE_LOCATION_ID!;

    try {
      // Validate input
      if (!contactId || !images || !Array.isArray(images) || images.length === 0) {
        throw new Error('Missing or invalid required fields');
      }

      // Get contact information
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError || !contact) {
        throw new Error(`Error fetching contact: ${contactError?.message || 'Contact not found'}`);
      }

      // Separate images by purchase type
      const digitalIds = images
        .filter((img) => img.purchaseOptions.digitalDownload && !img.purchaseOptions.printCopy)
        .map((img) => img.id);

      const printIds = images
        .filter((img) => !img.purchaseOptions.digitalDownload && img.purchaseOptions.printCopy)
        .map((img) => img.id);

      const bundleIds = images
        .filter((img) => img.purchaseOptions.digitalDownload && img.purchaseOptions.printCopy)
        .map((img) => img.id);

      // Create line items for the checkout
      const lineItems: any[] = [];

      // Add digital downloads
      if (digitalIds.length > 0) {
        lineItems.push({
          name: 'Digital Photos',
          quantity: digitalIds.length.toString(),
          basePriceMoney: {
            amount: BigInt(2000), // £20.00 in pence
            currency: 'GBP',
          },
          metadata: {
            ids: JSON.stringify(digitalIds),
          },
        });
      }

      // Add prints
      if (printIds.length > 0) {
        lineItems.push({
          name: 'Prints',
          quantity: printIds.length.toString(),
          basePriceMoney: {
            amount: BigInt(2000), // £20.00 in pence
            currency: 'GBP',
          },
          metadata: {
            ids: JSON.stringify(printIds),
          },
        });
      }

      // Add bundles (digital + print)
      if (bundleIds.length > 0) {
        lineItems.push({
          name: 'Digital and Print Bundle',
          quantity: bundleIds.length.toString(),
          basePriceMoney: {
            amount: BigInt(3750), // £37.50 in pence (bundle discount)
            currency: 'GBP',
          },
          metadata: {
            ids: JSON.stringify(bundleIds),
          },
        });
      }

      // If no line items, throw an error
      if (lineItems.length === 0) {
        throw new Error('No purchase options selected');
      }

      // Create the payment link request
      const paymentLinkRequest = {
        idempotencyKey: uuid(),
        checkoutOptions: {
          allowTipping: false,
          redirectUrl: redirectUrl,
          merchantSupportEmail: 'support@evess.co',
          askForShippingAddress: false,
        },
        order: {
          locationId: locationId,
          lineItems: lineItems,
          metadata: {
            contact_id: contactId.toString(),
          },
        },
        prePopulatedData: {
          buyerEmail: contact.email || undefined,
          buyerPhoneNumber: contact.phone || undefined,
        },
      };

      // Create the payment link
      const response = await squareClient.checkout.paymentLinks.create(paymentLinkRequest);

      // Return the payment link
      return {
        checkoutUrl: response.paymentLink?.url,
        orderId: response.paymentLink?.orderId,
        expiresAt: response.paymentLink?.createdAt, // Use createdAt instead of expiresAt
      };
    } catch (error) {
      console.error('Error creating Square checkout link:', error);
      throw error;
    }
  });
