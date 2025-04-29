import { useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScheduleImport } from '@/components/schedule/schedule-import'
import { DateTimePicker } from '@/components/date-time-picker'

interface ScheduleItem {
  id: string
  title: string | null
  description: string | null
  timestamp: string | null
  event_id: number | null
}

interface ScheduleItemListProps {
  scheduleItems: ScheduleItem[]
  eventId: number
  onAddItem?: (item: Omit<ScheduleItem, 'id'>) => Promise<void>
  onEditItem?: (id: string, item: Partial<ScheduleItem>) => Promise<void>
  onDeleteItem?: (id: string) => Promise<void>
}

export function ScheduleItemList({
  scheduleItems,
  eventId,
  onAddItem,
  onEditItem,
  onDeleteItem
}: ScheduleItemListProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTimestamp, setEditTimestamp] = useState<Date | undefined>(undefined)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  // Handle adding a new schedule item
  const handleAddItem = async () => {
    if (onAddItem && naturalLanguageInput.trim()) {
      setIsProcessing(true)

      try {
        // Pass the natural language input to the parent component
        await onAddItem({
          title: naturalLanguageInput, // We'll use this temporarily until it's processed
          description: null,
          timestamp: null,
          event_id: eventId
        })

        // Reset form
        setNaturalLanguageInput('')
      } catch (error) {
        console.error('Error adding schedule item:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  // Handle editing a schedule item
  const handleEditItem = async () => {
    if (onEditItem && editingItem && editTitle.trim()) {
      setIsProcessing(true)

      try {
        // Pass all the edited fields to the parent component
        await onEditItem(editingItem.id, {
          title: editTitle,
          description: editDescription,
          timestamp: editTimestamp ? editTimestamp.toISOString() : null
        })

        // Reset form and close dialog
        setEditTitle('')
        setEditDescription('')
        setEditTimestamp(undefined)
        setEditingItem(null)
      } catch (error) {
        console.error('Error editing schedule item:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <div>
          <CardTitle>Schedule Items</CardTitle>
          <CardDescription>
            Manage schedule items for this event
          </CardDescription>
        </div>
        {/* Import schedule button */}
        <ScheduleImport
            eventId={eventId}
            onImportComplete={() => {
              // Notify the parent component to refresh the schedule items
              if (onAddItem) {
                // We're using onAddItem as a trigger to refresh data
                // The parent component should detect this special case and refresh all items
                onAddItem({
                  title: '__REFRESH_ITEMS__',
                  description: null,
                  timestamp: null,
                  event_id: eventId
                })
              }
            }}
          />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {/* Natural language input for schedule items */}
          <div className="flex w-full gap-2 justify-between items-end">
            <div className="flex-1">
              <Label htmlFor="naturalLanguageInput" className="ml-1">Schedule Item Description</Label>
              <Input
                id="naturalLanguageInput"
                className="mt-1"
                placeholder="e.g., Gown pickup at 10am on November 3rd"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddItem}
              disabled={isProcessing || !naturalLanguageInput.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Add Schedule Item'
              )}
            </Button>
          </div>
        </div>

        {/* List of schedule items */}
        <div className="border rounded-md divide-y">
          {scheduleItems.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No schedule items added yet.
            </div>
          ) : (
            scheduleItems.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.timestamp ? format(new Date(item.timestamp), 'PPP p') : 'No date'}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setEditingItem(item)
                        setEditTitle(item.title || '')
                        setEditDescription(item.description || '')
                        setEditTimestamp(item.timestamp ? new Date(item.timestamp) : undefined)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingItemId(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule Item</DialogTitle>
            <DialogDescription>
              Edit the schedule item details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title Input */}
            <div>
              <Label htmlFor="editTitle" className="ml-1">Title</Label>
              <Input
                id="editTitle"
                className="mt-1"
                placeholder="e.g., Gown Pickup"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            {/* Date Time Picker */}
            <div>
              <DateTimePicker
                value={editTimestamp}
                onChange={(date) => setEditTimestamp(date)}
                label="Date & Time"
                description="Select the date and time for this schedule item"
              />
            </div>

            {/* Description Input */}
            <div>
              <Label htmlFor="editDescription" className="ml-1">Description</Label>
              <Textarea
                id="editDescription"
                className="mt-1"
                placeholder="Enter a description for this schedule item"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleEditItem}
              disabled={isProcessing || !editTitle.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Update Schedule Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingItemId} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingItemId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deletingItemId && onDeleteItem) {
                  try {
                    await onDeleteItem(deletingItemId);
                    setDeletingItemId(null);
                  } catch (error) {
                    console.error('Error deleting item:', error);
                  }
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
