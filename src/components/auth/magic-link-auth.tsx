import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { checkEmailExists } from '@/utils/auth'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Form schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormValues = z.infer<typeof formSchema>

interface MagicLinkAuthProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  redirectUrl?: string
  contactId?: string
}

export function MagicLinkAuth({
  isOpen,
  onOpenChange,
  onSuccess,
  redirectUrl = window.location.href,
  contactId
}: MagicLinkAuthProps) {
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      // Check if the email exists using the server function
      try {
        const { exists } = await checkEmailExists({
          data: { email: values.email.toLowerCase() }
        })

        // If the email doesn't exist, show an error
        if (!exists) {
          setError('This email is not associated with a student account. Only students can purchase photos.')
          setIsSubmitting(false)
          return
        }
      } catch (checkError: any) {
        throw new Error('Error checking email: ' + checkError.message)
      }

      const supabase = createClient()

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        throw new Error('Error sending magic link: ' + error.message)
      }

      // Show success message
      setStep('sent')

    } catch (err: any) {
      console.error('Magic link error:', err)
      setError(err.message || 'Failed to send login link')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Sign in to complete your purchase</DialogTitle>
              <DialogDescription>
                Enter your email to receive a secure login link.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="py-4 space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          {...field}
                          disabled={isSubmitting}
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Login Link'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Check your email</DialogTitle>
              <DialogDescription>
                We've sent a login link to your email address. Click the link to sign in and complete your purchase.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                The link will expire in 24 hours. If you don't see the email, check your spam folder.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
