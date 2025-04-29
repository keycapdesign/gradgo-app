import { SquareClient, SquareEnvironment } from 'square'
import { createClient } from '@/utils/supabase/server'

// Define interfaces for type safety
interface TerminalCheckout {
  id: string
  reference_id: string
  status: string
  amount_money: {
    amount: number
    currency: string
  }
  device_id: string
  terminal_id: string
  note: string
}

interface TerminalEvent {
  data: {
    object: {
      checkout: TerminalCheckout
    }
  }
  type: string
  id: string
}

interface TerminalTransaction {
  contact_id: string
  image_ids: string[]
  status: string
  batch_id: string | null
}

interface LineItem {
  name: string
  metadata: {
    ids?: string
  }
  totalMoney: {
    amount: string
    currency: string
  }
}

interface Order {
  line_items: LineItem[]
  totalMoney: {
    currency: string
  }
  metadata?: {
    contact_id: string
  }
}

// Get environment variables
const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || ''
const NOTIFICATION_URL = process.env.SQUARE_WEBHOOK_URL || ''
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || ''

// Initialize Square client
const getSquareClient = () => {
  return new SquareClient({
    token: SQUARE_ACCESS_TOKEN,
    environment: SquareEnvironment.Production
  })
}

// Helper function to retrieve an order from Square
async function retrieveOrder(orderId: string) {
  try {
    const client = getSquareClient()
    const response = await client.orders.retrieveOrder(orderId)
    return response.order
  } catch (error) {
    console.error('Error retrieving order from Square:', error)
    throw error
  }
}

// Helper function to validate the Square signature
async function isFromSquare(signature: string | null, body: string): Promise<boolean> {
  if (!signature) {
    console.log("No signature provided")
    return false
  }

  try {
    const client = getSquareClient()
    const isValid = await client.webhooks.validateWebhookSignature({
      body,
      signatureHeader: signature,
      signatureKey: SIGNATURE_KEY,
      url: NOTIFICATION_URL
    })
    return isValid.isValid || false
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-square-hmacsha256-signature')

  try {
    if (await isFromSquare(signature, body)) {
      console.log('Valid signature. Processing webhook...')

      // Parse the body to an event object
      const event = JSON.parse(body)

      // Process the event
      await processEvent(event)

      // Return a response to acknowledge receipt of the event
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      console.error('Invalid signature. Rejecting webhook...')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (err: any) {
    console.error('Error processing webhook:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function processEvent(event: any) {
  // Log event type and ID for debugging
  console.log(`Processing event type: ${event.type}, ID: ${event.id || event.event_id}`)
  const supabase = createClient()

  try {
    // Process based on event type
    switch (event.type) {
      case 'terminal.checkout.updated':
        await processTerminalCheckoutUpdated(event, supabase)
        break
      case 'payment.updated':
        await processPaymentUpdatedEvent(event)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error: any) {
    console.error(`Error processing event type: ${event.type}, ID: ${event.id || event.event_id}`, error)
  }
}

async function processTerminalCheckoutUpdated(event: TerminalEvent, supabase: any) {
  const { data } = event
  const { reference_id, status, amount_money, device_id } = data.object.checkout

  // First update the terminal_transactions table
  const { data: updateResult, error: updateError } = await supabase
    .from('terminal_transactions')
    .update({
      status,
    })
    .eq('id', reference_id)
    .select('*')
    .single()

  if (updateError) {
    throw updateError
  }

  const transaction = updateResult as TerminalTransaction

  // If the status is COMPLETED, create a sales record and update contact_images
  if (status === 'COMPLETED') {
    // Create sales record
    const { error: saleError } = await supabase
      .from('sales')
      .insert({
        square_checkout_id: data.object.checkout.id,
        transaction_source: 'terminal',
        status: 'completed',
        amount_cents: amount_money.amount,
        currency: amount_money.currency,
        device_id: device_id,
        terminal_id: data.object.checkout.terminal_id,
        contact_id: transaction.contact_id,
        image_ids: transaction.image_ids,
        has_print_products: true,
        print_image_ids: transaction.image_ids,
        metadata: {
          checkout_details: data.object.checkout
        },
        note: data.object.checkout.note
      })

    if (saleError) {
      console.error('Error creating sale record:', saleError)
      throw saleError
    }

    // Update the contact_images table to mark prints as purchased
    const { error: printError } = await supabase
      .from('contact_images')
      .update({ purchased_print: true, print_credits: 1 })
      .in('image_id', transaction.image_ids)
      .eq('contact_id', transaction.contact_id)

    if (printError) {
      console.error('Error updating contact_images for print purchases:', printError)
      throw printError
    }

    console.log('Successfully processed completed checkout')
  }

  console.log('Updated transaction data:', updateResult)
}

// Process payment.updated event
async function processPaymentUpdatedEvent(event: any) {
  try {
    const supabase = createClient()
    const paymentId = event.data.id
    const orderId = event.data.object.payment.order_id
    console.log('Processing payment:', paymentId, 'for order:', orderId)

    // Retrieve the order from Square
    const order = await retrieveOrder(orderId) as Order

    // Extract the digital, print, and bundle IDs from the line items' metadata
    const digitalIds = order.line_items
      .find(item => item.name === 'Digital Photos')
      ?.metadata.ids
    const printIds = order.line_items
      .find(item => item.name === 'Prints')
      ?.metadata.ids
    const bundleIds = order.line_items
      .find(item => item.name === 'Digital and Print Bundle')
      ?.metadata.ids

    // Parse all IDs
    const parsedDigitalIds = digitalIds ? JSON.parse(digitalIds) : []
    const parsedPrintIds = printIds ? JSON.parse(printIds) : []
    const parsedBundleIds = bundleIds ? JSON.parse(bundleIds) : []

    // Calculate total amount in cents
    const totalAmountCents = order.line_items.reduce((sum: number, item: LineItem) => {
      return sum + (parseInt(item.totalMoney.amount) || 0)
    }, 0)

    // Create a new sale record
    const { error: saleError } = await supabase
      .from('sales')
      .insert({
        square_payment_id: paymentId,
        square_order_id: orderId,
        transaction_source: 'online',
        status: 'completed',
        amount_cents: totalAmountCents,
        currency: order.totalMoney.currency,
        contact_id: order.metadata?.contact_id ? parseInt(order.metadata.contact_id) : null,
        image_ids: [...parsedDigitalIds, ...parsedPrintIds, ...parsedBundleIds],
        has_digital_products: parsedDigitalIds.length > 0 || parsedBundleIds.length > 0,
        has_print_products: parsedPrintIds.length > 0 || parsedBundleIds.length > 0,
        digital_image_ids: [...parsedDigitalIds, ...parsedBundleIds],
        print_image_ids: [...parsedPrintIds, ...parsedBundleIds],
        metadata: {
          order_details: order,
          payment_details: event.data.object.payment
        }
      })

    if (saleError) {
      console.error('Error creating sale record:', saleError)
    }

    // Update the 'contact_images' table for digital purchases
    if (parsedDigitalIds.length > 0) {
      const { error: digitalError } = await supabase
        .from('contact_images')
        .update({ digital_download: true })
        .in('image_id', parsedDigitalIds)

      if (digitalError) {
        console.error('Error updating contact_images for digital purchases:', digitalError)
      }
    }

    // Update the 'contact_images' table for print purchases
    if (parsedPrintIds.length > 0) {
      const { error: printError } = await supabase
        .from('contact_images')
        .update({ purchased_print: true, print_credits: 1 })
        .in('image_id', parsedPrintIds)

      if (printError) {
        console.error('Error updating contact_images for print purchases:', printError)
      }
    }

    // Update the 'contact_images' table for bundle purchases
    if (parsedBundleIds.length > 0) {
      const { error: bundleError } = await supabase
        .from('contact_images')
        .update({ digital_download: true, purchased_print: true, print_credits: 1 })
        .in('image_id', parsedBundleIds)

      if (bundleError) {
        console.error('Error updating contact_images for bundle purchases:', bundleError)
      }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error processing payment.updated event:`, error)
    throw error
  }
}
