import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { verifyUserPassword } from '@/utils/auth-verification'

interface LateReturnScreenProps {
  booking: any
  onCancel: () => void
  onAdminApprove: () => void
}

export function LateReturnScreen({ booking, onCancel, onAdminApprove }: LateReturnScreenProps) {
  const [adminApprovalMode, setAdminApprovalMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')

  // Password verification mutation
  const verifyPasswordMutation = useMutation({
    mutationFn: (password: string) => {
      return verifyUserPassword({ data: { password } })
    },
    onSuccess: () => {
      onAdminApprove()
      setAdminApprovalMode(false)
      setAdminPassword('')
      setAdminError('')
    },
    onError: (error: Error) => {
      setAdminError(error.message || 'Incorrect password')
    }
  })

  // Handle admin approval for late returns
  const handleAdminApproval = () => {
    if (!adminPassword.trim()) {
      setAdminError('Please enter your password')
      return
    }

    verifyPasswordMutation.mutate(adminPassword)
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Late Return
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-md text-center">
            <p className="font-medium">This gown is being returned late.</p>
            <p>Please contact a staff member for assistance.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-muted-foreground">Student</Label>
              <div className="font-medium">{booking?.full_name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Event</Label>
              <div className="font-medium">{booking?.event?.name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Gown RFID</Label>
              <div className="font-medium">{booking?.gown?.rfid}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Checked Out</Label>
              <div className="font-medium">
                {booking?.check_out_time ? format(new Date(booking.check_out_time), 'PPP p') : 'Unknown'}
              </div>
            </div>
            {booking?.due_date && (
              <div>
                <Label className="text-muted-foreground">Due Date</Label>
                <div className="font-medium">
                  {format(new Date(booking.due_date), 'PPP p')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => setAdminApprovalMode(true)}
          >
            Admin Override
          </Button>
        </CardFooter>
      </Card>

      {/* Admin Approval Dialog */}
      <Dialog open={adminApprovalMode} onOpenChange={setAdminApprovalMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Approval Required</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value)
                  setAdminError('')
                }}
                placeholder="Enter admin password"
              />
              {adminError && (
                <p className="text-destructive text-sm">{adminError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminApprovalMode(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdminApproval}
              disabled={verifyPasswordMutation.isPending}
            >
              {verifyPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Approve Late Return'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
