import { useState, useEffect } from 'react'
import { Plus, Check, ChevronsUpDown } from 'lucide-react'
import { DropResult } from '@hello-pangea/dnd'
import { DraggableItemList, DraggableItem } from './draggable-item-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

interface Feature {
  feature_id: string
  event_id: number
  index: number | null
  feature: {
    id: string
    title: string | null
    subtitle: string | null
    link: string | null
  } | null
}

interface FeatureListProps {
  features: Feature[]
  eventId: number
  onDragEnd: (result: DropResult) => void
  onAddFeature?: (feature: Partial<Feature['feature']>) => void
  onEditFeature?: (id: string, feature: Partial<Feature['feature']>) => void
  onDeleteFeature?: (id: string) => void
}

export function FeatureList({
  features,
  eventId,
  onDragEnd,
  onAddFeature,
  onEditFeature,
  onDeleteFeature
}: FeatureListProps) {
  const [newFeature, setNewFeature] = useState<{
    title: string
    subtitle: string
    link: string
  }>({
    title: '',
    subtitle: '',
    link: ''
  })

  // State for editing features
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [editLink, setEditLink] = useState('')

  // No longer need delete confirmation state

  // State for unlinked features
  const [unlinkedFeatures, setUnlinkedFeatures] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)

  const handleAddFeature = () => {
    if (onAddFeature && newFeature.title) {
      onAddFeature({
        title: newFeature.title,
        subtitle: newFeature.subtitle,
        link: newFeature.link
      })

      // Reset form
      setNewFeature({
        title: '',
        subtitle: '',
        link: ''
      })
    }
  }

  // Fetch unlinked features
  const fetchUnlinkedFeatures = async (search: string = '') => {
    try {
      setIsSearching(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .rpc('get_unlinked_features', {
          _event_id: eventId,
          search_term: search || null
        })

      if (error) throw error
      setUnlinkedFeatures(data || [])
    } catch (error) {
      console.error('Error fetching unlinked features:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle linking an existing feature to the event
  const handleLinkFeature = async (featureId: string) => {
    try {
      const supabase = createClient()

      // Find the feature in unlinked features
      const featureToLink = unlinkedFeatures.find(f => f.id === featureId)
      if (!featureToLink) throw new Error('Feature not found')

      // Create the relationship between the event and the feature
      const { error: relationshipError } = await supabase
        .from('event_features')
        .insert({
          event_id: eventId,
          feature_id: featureId,
          index: features.length // Add to the end of the list
        })

      if (relationshipError) throw relationshipError

      // Update the UI
      if (onAddFeature) {
        onAddFeature({
          id: featureId,
          title: featureToLink.title,
          subtitle: featureToLink.subtitle,
          link: featureToLink.link
        })
      }

      // Close the popover and refresh unlinked features
      setOpen(false)
      fetchUnlinkedFeatures(searchTerm)
    } catch (error) {
      console.error('Error linking feature:', error)
    }
  }

  // Effect to fetch unlinked features when the component mounts or search term changes
  useEffect(() => {
    if (open) {
      fetchUnlinkedFeatures(searchTerm)
    }
  }, [open, searchTerm, eventId])

  // Handle editing a feature
  const handleEditFeature = () => {
    if (onEditFeature && editingFeature && editTitle) {
      onEditFeature(editingFeature.feature_id, {
        ...editingFeature.feature,
        title: editTitle,
        subtitle: editSubtitle,
        link: editLink
      })

      // Reset form and close dialog
      setEditTitle('')
      setEditSubtitle('')
      setEditLink('')
      setEditingFeature(null)
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
          <DialogTitle>Add Feature</DialogTitle>
          <DialogDescription>
            Create a new feature for this event.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="newFeatureTitle">Title</Label>
            <Input
              id="newFeatureTitle"
              className="mt-1"
              value={newFeature.title}
              onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="newFeatureSubtitle">Subtitle</Label>
            <Input
              id="newFeatureSubtitle"
              className="mt-1"
              value={newFeature.subtitle}
              onChange={(e) => setNewFeature(prev => ({ ...prev, subtitle: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="newFeatureLink">Link</Label>
            <Input
              id="newFeatureLink"
              className="mt-1"
              value={newFeature.link}
              onChange={(e) => setNewFeature(prev => ({ ...prev, link: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddFeature}>
            Save Feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render combobox for searching and adding existing features
  const renderCombobox = () => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {"Link existing feature..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search features..."
            value={searchTerm}
            onValueChange={(value) => {
              setSearchTerm(value)
              fetchUnlinkedFeatures(value)
            }}
          />
          <CommandList>
            <CommandEmpty>{isSearching ? "Searching..." : "No features found."}</CommandEmpty>
            <CommandGroup>
              {unlinkedFeatures.map((feature) => (
                <CommandItem
                  key={feature.id}
                  value={feature.id}
                  onSelect={() => handleLinkFeature(feature.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{feature.title || 'Unnamed Feature'}</span>
                    <span className="text-xs text-muted-foreground">
                      {feature.subtitle || 'No subtitle'}
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
        title="Features"
        description="Manage features for this event"
        items={features}
        droppableId="features"
        onDragEnd={onDragEnd}
        renderAddDialog={renderAddDialog}
        renderCombobox={renderCombobox}
        renderItem={(featureItem, index) => (
          <DraggableItem
            key={featureItem.feature_id}
            id={featureItem.feature_id}
            index={index}
            title={featureItem.feature?.title || 'Unnamed Feature'}
            subtitle={featureItem.feature?.subtitle || 'No subtitle'}
            onEdit={() => {
              const feature = featureItem;
              setEditingFeature(feature);
              setEditTitle(feature.feature?.title || '');
              setEditSubtitle(feature.feature?.subtitle || '');
              setEditLink(feature.feature?.link || '');
            }}
            onDelete={() => onDeleteFeature && onDeleteFeature(featureItem.feature_id)}
          />
        )}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingFeature} onOpenChange={(open) => !open && setEditingFeature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Edit the feature details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title Input */}
            <div>
              <Label htmlFor="editFeatureTitle">Title</Label>
              <Input
                id="editFeatureTitle"
                className="mt-1"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editFeatureSubtitle">Subtitle</Label>
              <Input
                id="editFeatureSubtitle"
                className="mt-1"
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editFeatureLink">Link</Label>
              <Input
                id="editFeatureLink"
                className="mt-1"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditFeature}>
              Update Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
