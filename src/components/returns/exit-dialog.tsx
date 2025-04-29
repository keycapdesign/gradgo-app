import { useMutation } from '@tanstack/react-query'

import { Lock, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useReturnsMode } from '@/hooks/use-returns-mode'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { verifyUserPassword } from '@/utils/auth-verification'

interface ExitDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// Define the form schema with Zod
const formSchema = z.object({
  password: z.string().min(1, { message: 'Password is required' })
})

type FormValues = z.infer<typeof formSchema>

export function ExitDialog({ isOpen, onOpenChange, onSuccess }: ExitDialogProps) {
  const { exitReturnsMode } = useReturnsMode()

  // Initialize react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: ''
    }
  })

  // Handle exit verification
  const handleExitVerification = async (values: FormValues) => {
    try {
      console.log('[ExitDialog] Verifying password...')
      const result = await verifyUserPassword({ data: { password: values.password } })
      console.log('[ExitDialog] Password verification result:', result)

      if (result.success) {
        console.log('[ExitDialog] Password verified successfully, exiting returns mode')

        // Close the dialog first
        onOpenChange(false)

        try {
          // Exit returns mode by removing the limited role
          console.log('[ExitDialog] Calling exitReturnsMode')
          const success = await exitReturnsMode()
          console.log('[ExitDialog] Exit returns mode result:', success)
        } catch (error) {
          console.error('[ExitDialog] Failed to exit returns mode:', error)
          // Continue even if role removal fails
        }

        // Call the success callback
        console.log('[ExitDialog] Calling onSuccess callback')
        onSuccess()

        return true
      } else {
        console.error('[ExitDialog] Password verification failed')
        form.setError('password', { message: 'Incorrect password' })
        return false
      }
    } catch (error: any) {
      console.error('[ExitDialog] Error during exit verification:', error)
      form.setError('password', { message: error.message || 'Incorrect password' })
      return false
    }
  }

  // Password verification mutation
  const verifyPasswordMutation = useMutation({
    mutationFn: handleExitVerification
  })

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    console.log('[ExitDialog] Form submitted, attempting to verify password')
    verifyPasswordMutation.mutate(values)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Exit Kiosk Mode
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifyPasswordMutation.isPending}
              >
                {verifyPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Exit Kiosk Mode'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
