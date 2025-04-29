import { useState, useEffect } from 'react'
import { Plus, Check, ChevronsUpDown } from 'lucide-react'
import { DropResult } from '@hello-pangea/dnd'
import { DraggableItemList, DraggableItem } from './draggable-item-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

interface Offer {
  offer_id: string
  event_id: number
  index: number | null
  offer: {
    id: string
    title: string | null
    discount_value: number | null
    offer_type: 'percentage_off' | 'amount_off' | null
  } | null
}

interface OfferListProps {
  offers: Offer[]
  eventId: number
  onDragEnd: (result: DropResult) => void
  onAddOffer?: (offer: Partial<Offer['offer']>) => void
  onEditOffer?: (id: string, offer: Partial<Offer['offer']>) => void
  onDeleteOffer?: (id: string) => void
}

export function OfferList({
  offers,
  eventId,
  onDragEnd,
  onAddOffer,
  onEditOffer,
  onDeleteOffer
}: OfferListProps) {
  const [newOffer, setNewOffer] = useState<{
    title: string
    discount_value: string
    offer_type: 'percentage_off' | 'amount_off'
  }>({
    title: '',
    discount_value: '',
    offer_type: 'percentage_off'
  })

  // State for editing offers
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDiscountValue, setEditDiscountValue] = useState('')
  const [editOfferType, setEditOfferType] = useState<'percentage_off' | 'amount_off'>('percentage_off')

  // No longer need delete confirmation state

  // State for unlinked offers
  const [unlinkedOffers, setUnlinkedOffers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)

  const handleAddOffer = () => {
    if (onAddOffer && newOffer.title && newOffer.discount_value) {
      onAddOffer({
        title: newOffer.title,
        discount_value: parseFloat(newOffer.discount_value),
        offer_type: newOffer.offer_type
      })

      // Reset form
      setNewOffer({
        title: '',
        discount_value: '',
        offer_type: 'percentage_off'
      })
    }
  }

  // Fetch unlinked offers
  const fetchUnlinkedOffers = async (search: string = '') => {
    try {
      setIsSearching(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .rpc('get_unlinked_offers', {
          _event_id: eventId,
          search_term: search || null
        })

      if (error) throw error
      setUnlinkedOffers(data || [])
    } catch (error) {
      console.error('Error fetching unlinked offers:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle linking an existing offer to the event
  const handleLinkOffer = async (offerId: string) => {
    try {
      const supabase = createClient()

      // Find the offer in unlinked offers
      const offerToLink = unlinkedOffers.find(o => o.id === offerId)
      if (!offerToLink) throw new Error('Offer not found')

      // Create the relationship between the event and the offer
      const { error: relationshipError } = await supabase
        .from('event_offers')
        .insert({
          event_id: eventId,
          offer_id: offerId,
          index: offers.length // Add to the end of the list
        })
        .select()
        .single()

      if (relationshipError) throw relationshipError

      // Update the UI
      if (onAddOffer) {
        onAddOffer({
          id: offerId,
          title: offerToLink.title,
          discount_value: offerToLink.discount_value,
          offer_type: offerToLink.offer_type
        })
      }

      // Close the popover and refresh unlinked offers
      setOpen(false)
      fetchUnlinkedOffers(searchTerm)
    } catch (error) {
      console.error('Error linking offer:', error)
    }
  }

  // Effect to fetch unlinked offers when the component mounts or search term changes
  useEffect(() => {
    if (open) {
      fetchUnlinkedOffers(searchTerm)
    }
  }, [open, searchTerm, eventId])

  // Handle editing an offer
  const handleEditOffer = () => {
    if (onEditOffer && editingOffer && editTitle) {
      onEditOffer(editingOffer.offer_id, {
        ...editingOffer.offer,
        title: editTitle,
        discount_value: parseFloat(editDiscountValue),
        offer_type: editOfferType
      })

      // Reset form and close dialog
      setEditTitle('')
      setEditDiscountValue('')
      setEditOfferType('percentage_off')
      setEditingOffer(null)
    }
  }

  const renderAddDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Offer</DialogTitle>
          <DialogDescription>
            Create a new offer for this event.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="newOfferTitle">Title</Label>
            <Input
              id="newOfferTitle"
              className="mt-1"
              value={newOffer.title}
              onChange={(e) => setNewOffer(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="newOfferType">Offer Type</Label>
            <Select
              value={newOffer.offer_type}
              onValueChange={(value) => setNewOffer(prev => ({
                ...prev,
                offer_type: value as 'percentage_off' | 'amount_off'
              }))}
            >
              <SelectTrigger id="newOfferType" className="mt-1">
                <SelectValue placeholder="Select offer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage_off">Percentage Off</SelectItem>
                <SelectItem value="amount_off">Amount Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="newOfferValue">Value</Label>
            <Input
              id="newOfferValue"
              type="number"
              className="mt-1"
              value={newOffer.discount_value}
              onChange={(e) => setNewOffer(prev => ({ ...prev, discount_value: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddOffer}>
            Save Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render combobox for searching and adding existing offers
  const renderCombobox = () => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {"Link existing offer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search offers..."
            value={searchTerm}
            onValueChange={(value) => {
              setSearchTerm(value)
              fetchUnlinkedOffers(value)
            }}
          />
          <CommandList>
            <CommandEmpty>{isSearching ? "Searching..." : "No offers found."}</CommandEmpty>
            <CommandGroup>
              {unlinkedOffers.map((offer) => (
                <CommandItem
                  key={offer.id}
                  value={offer.id}
                  onSelect={() => handleLinkOffer(offer.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{offer.title || 'Unnamed Offer'}</span>
                    <span className="text-xs text-muted-foreground">
                      {offer.offer_type === 'percentage_off'
                        ? `${offer.discount_value}% off`
                        : offer.offer_type === 'amount_off'
                          ? `$${offer.discount_value} off`
                          : 'Unknown offer type'}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  return (
    <>
      <DraggableItemList
        title="Offers"
        description="Manage offers for this event"
        items={offers}
        droppableId="offers"
        onDragEnd={onDragEnd}
        renderAddDialog={renderAddDialog}
        renderCombobox={renderCombobox}
        renderItem={(offerItem, index) => (
          <DraggableItem
            key={offerItem.offer_id}
            id={offerItem.offer_id}
            index={index}
            title={offerItem.offer?.title || 'Unnamed Offer'}
            subtitle={
              offerItem.offer?.offer_type === 'percentage_off'
                ? `${offerItem.offer?.discount_value}% off`
                : offerItem.offer?.offer_type === 'amount_off'
                  ? `$${offerItem.offer?.discount_value} off`
                  : 'Unknown offer type'
            }
            onEdit={() => {
              const offer = offerItem;
              setEditingOffer(offer);
              setEditTitle(offer.offer?.title || '');
              setEditDiscountValue(offer.offer?.discount_value?.toString() || '');
              setEditOfferType(offer.offer?.offer_type || 'percentage_off');
            }}
            onDelete={() => onDeleteOffer && onDeleteOffer(offerItem.offer_id)}
          />
        )}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingOffer} onOpenChange={(open) => !open && setEditingOffer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>
              Edit the offer details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title Input */}
            <div>
              <Label htmlFor="editOfferTitle">Title</Label>
              <Input
                id="editOfferTitle"
                className="mt-1"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editOfferType">Offer Type</Label>
              <Select
                value={editOfferType}
                onValueChange={(value) => setEditOfferType(value as 'percentage_off' | 'amount_off')}
              >
                <SelectTrigger id="editOfferType" className="mt-1 w-full">
                  <SelectValue placeholder="Select offer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage_off">Percentage Off</SelectItem>
                  <SelectItem value="amount_off">Amount Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editOfferValue">Value</Label>
              <Input
                id="editOfferValue"
                type="number"
                className="mt-1"
                value={editDiscountValue}
                onChange={(e) => setEditDiscountValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditOffer}>
              Update Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No longer need delete confirmation dialog */}
    </>
  )
}
