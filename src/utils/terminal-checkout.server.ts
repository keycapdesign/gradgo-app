import { createServerFn } from '@tanstack/react-start'
import { SquareClient, SquareEnvironment } from 'square'
import { createClient as createServerClient } from '@/utils/supabase/server'

interface SquareTerminalCheckoutParams {
  imageIds: string[]
  deviceId: string
  contactId: number
  quantity: number
}

/**
 * Create a Square Terminal checkout (server-only)
 */
export const createTerminalCheckout = createServerFn({ method: 'POST' })
  .validator((data: SquareTerminalCheckoutParams) => ({
    imageIds: data.imageIds,
    deviceId: data.deviceId,
    contactId: data.contactId,
    quantity: data.quantity
  }))
  .handler(async (ctx) => {
    const { imageIds, deviceId, contactId, quantity } = ctx.data
    console.log(`Creating Square Terminal checkout for ${quantity} items`)

    if (!imageIds.length || !deviceId || !contactId) {
      throw new Error('Missing required fields for checkout')
    }

    const supabase = createServerClient()

    // Initialize Square client
    const client = new SquareClient({
      environment: SquareEnvironment.Sandbox,
      token: process.env.SQUARE_SANDBOX_TOKEN,
    })

    try {
      // Insert a new transaction into the database
      const { data: transaction, error: insertError } = await supabase
        .from("terminal_transactions")
        .insert({
          image_ids: imageIds,
          device_id: deviceId,
          status: "pending",
          contact_id: contactId
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Error inserting transaction:", insertError)
        throw new Error("Failed to create transaction record")
      }

      const transactionId = transaction.id.toString()

      // Create checkout request body
      const checkoutBody = {
        idempotencyKey: transactionId,
        checkout: {
          amountMoney: {
            amount: BigInt(10 * quantity), // £0.10 per print in pence
            currency: "GBP" as any,
          },
          referenceId: transactionId,
          deviceOptions: {
            deviceId: deviceId,
            skipReceiptScreen: false,
            collectSignature: false,
          },
          note: `Customer ID: ${contactId}`
        },
      }

      // Create the terminal checkout
      const response = await client.terminal.checkouts.create(checkoutBody)
      console.log('Terminal checkout created:', response)

      return {
        success: true,
        transactionId: transaction.id,
        checkoutId: response.checkout?.id,
        message: "Checkout created successfully"
      }
    } catch (error: any) {
      console.error('Error creating terminal checkout:', error)
      throw new Error(error.message || 'Failed to create terminal checkout')
    }
  })
