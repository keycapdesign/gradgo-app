import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useDebounce } from '@/hooks/use-debounce'

// Define the zod schema for RFID validation
const rfidSchema = z.object({
  rfid: z.string()
    .min(8, { message: 'RFID must be at least 8 characters' })
    .max(8, { message: 'RFID must be at most 8 characters' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'RFID must contain only letters and numbers' })
})

export type RfidFormValues = z.infer<typeof rfidSchema>

interface RfidFormProps {
  onSubmit: (values: RfidFormValues) => void
  onScanHelpClick: () => void
  isProcessing: boolean
  disabled?: boolean
  label?: string
  placeholder?: string
}

export function RfidForm({
  onSubmit,
  onScanHelpClick,
  isProcessing,
  disabled = false,
  label = 'Scan or enter gown RFID',
  placeholder = 'Scan RFID...'
}: RfidFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isManualInput, setIsManualInput] = useState(false)

  // Initialize react-hook-form
  const form = useForm<RfidFormValues>({
    resolver: zodResolver(rfidSchema),
    defaultValues: {
      rfid: ''
    }
  })

  // Get the current RFID value from the form
  const rfid = form.watch('rfid')
  const debouncedRfid = useDebounce(rfid, 300) // 300ms debounce time for responsiveness

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle input changes to detect if it's a scan or manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Detect if this is likely a scan or manual input
    if (newValue.length > 0 && rfid.length === 0) {
      // First character - start tracking if this might be a scan
      setIsManualInput(false)
    } else if (newValue.length > rfid.length + 1) {
      // Multiple characters added at once - likely a scan
      setIsManualInput(false)
    } else if (newValue.length === rfid.length + 1) {
      // Single character added - likely manual typing
      setIsManualInput(true)
    }
  }

  // Handle input keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed, submit the form
    if (e.key === 'Enter') {
      if (isProcessing || disabled) {
        console.log('Already processing or disabled, ignoring Enter key press')
        e.preventDefault()
        return
      }
      console.log('Manual submit via Enter key')
      form.handleSubmit(onSubmit)(e)
    }
  }

  // Auto-submit when RFID is scanned (not manually typed)
  useEffect(() => {
    if (
      debouncedRfid &&
      debouncedRfid.length === 8 &&
      !isManualInput &&
      !isProcessing &&
      !disabled
    ) {
      console.log('Auto-submitting scanned RFID')
      form.handleSubmit(onSubmit)()
    }
  }, [debouncedRfid, isManualInput, isProcessing, onSubmit, form, disabled])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rfid"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>{label}</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    onChange={(e) => {
                      field.onChange(e)
                      handleInputChange(e)
                    }}
                    onKeyDown={handleKeyDown}
                    className="text-xl pr-10 h-12 rounded-lg"
                    autoComplete="off"
                    disabled={isProcessing || disabled}
                  />
                </FormControl>
                {isProcessing ? (
                  <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : field.value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-0"
                    onClick={() => {
                      form.setValue('rfid', '')
                      form.clearErrors()
                      inputRef.current?.focus()
                    }}
                    disabled={isProcessing || disabled}
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-12 text-lg"
          size="lg"
          disabled={!rfid.trim() || isProcessing || disabled}
        >
          {isProcessing ? 'Processing...' : 'Submit'}
        </Button>

        <div className="mt-2 text-center">
          <Button
            variant="link"
            onClick={onScanHelpClick}
            className="text-muted-foreground text-lg py-3"
            disabled={isProcessing || disabled}
          >
            Where do I scan?
          </Button>
        </div>
      </form>
    </Form>
  )
}
