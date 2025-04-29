import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useReturnsMode } from '@/hooks/use-returns-mode'
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
  const [isVerifying, setIsVerifying] = useState(false)

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
      setIsVerifying(true)
      console.log('[ExitDialog] Verifying password...')
      const result = await verifyUserPassword({ data: { password: values.password } })
      console.log('[ExitDialog] Password verification result:', result)

      if (result.success) {
        console.log('[ExitDialog] Password verified successfully, exiting kiosk mode')

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
    } catch (error) {
      console.error('[ExitDialog] Error verifying password:', error)
      form.setError('password', { message: 'Error verifying password' })
      return false
    } finally {
      setIsVerifying(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    await handleExitVerification(values)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6" />
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
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-12 text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isVerifying}
                className="h-12 px-6 text-lg"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVerifying}
                className="h-12 px-6 text-lg"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Exit Kiosk Mode'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
