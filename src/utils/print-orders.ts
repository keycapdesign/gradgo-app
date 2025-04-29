import { createServerFn } from '@tanstack/react-start'
import { v4 as uuidv4 } from 'uuid'
import { useMutation } from '@tanstack/react-query'
import { createClient as createServerClient } from '@/utils/supabase/server'

/**
 * Create print orders
 */
export const createPrintOrders = createServerFn({ method: 'POST' })
  .validator((data: {
    contactId: number,
    imageIds: string[],
    transactionId?: string
  }) => ({
    contactId: data.contactId,
    imageIds: data.imageIds,
    transactionId: data.transactionId
  }))
  .handler(async (ctx) => {
    const { contactId, imageIds, transactionId } = ctx.data
    console.log(`Creating print orders for contact ${contactId}, ${imageIds.length} images`)

    if (!imageIds.length || !contactId) {
      throw new Error('Missing required fields for print orders')
    }

    const supabase = createServerClient()

    try {
      // Generate a batch ID for this group of print orders
      const batchId = uuidv4()

      // Fetch image details to get the original_image_path
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('id, original_image_path')
        .in('id', imageIds)

      if (imagesError) {
        console.error('Error fetching images:', imagesError)
        throw new Error(`Failed to fetch image details: ${imagesError.message}`)
      }

      // Create print order records
      const printOrders = images.map(image => ({
        contact_id: contactId,
        image_id: image.id,
        image_filename: image.original_image_path,
        status: 'queued',
        batch_id: batchId
      }))

      const { data: orders, error: ordersError } = await supabase
        .from('print_orders')
        .insert(printOrders)
        .select()

      if (ordersError) {
        console.error('Error creating print orders:', ordersError)
        throw new Error(`Failed to create print orders: ${ordersError.message}`)
      }

      // If we have a transaction ID, update it with the batch_id
      if (transactionId) {
        const { error: updateError } = await supabase
          .from('terminal_transactions')
          .update({ batch_id: batchId })
          .eq('id', transactionId)

        if (updateError) {
          console.error('Error updating transaction with batch ID:', updateError)
          // Don't throw here, as the print orders were already created
        }
      }

      return {
        success: true,
        batchId,
        orders: orders.length,
        message: "Print orders created successfully"
      }
    } catch (error: any) {
      console.error('Error creating print orders:', error)
      throw new Error(`Failed to create print orders: ${error.message}`)
    }
  })

/**
 * Hook for creating print orders
 */
export function useCreatePrintOrders() {
  return useMutation({
    mutationFn: async (data: {
      contactId: number,
      imageIds: string[],
      transactionId?: string
    }) => {
      return createPrintOrders({ data })
    }
  })
}
