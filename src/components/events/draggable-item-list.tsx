import { Pencil, Plus, GripVertical, Unlink } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DraggableItemProps<T> {
  title: string
  description: string
  items: T[]
  droppableId: string
  renderItem: (item: T, index: number, provided: any) => React.ReactNode
  onDragEnd: (result: DropResult) => void
  onAddItem?: () => void
  renderAddDialog?: () => React.ReactNode
  renderCombobox?: () => React.ReactNode
}

export function DraggableItemList<T>({
  title,
  description,
  items,
  droppableId,
  renderItem,
  onDragEnd,
  onAddItem,
  renderAddDialog,
  renderCombobox
}: DraggableItemProps<T>) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {/* Combobox for searching items */}
          {renderCombobox && (
            <div className="flex-1">
              {renderCombobox()}
            </div>
          )}

          {/* Button to create new item */}
          {renderAddDialog ? (
            renderAddDialog()
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => onAddItem && onAddItem()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add {title}</DialogTitle>
                  <DialogDescription>
                    Create a new {title.toLowerCase()} item.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Form fields would go here */}
                </div>
                <DialogFooter>
                  <Button>
                    Save {title}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* List of items with drag and drop */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={droppableId}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="border rounded-md"
              >
                {items.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No {title.toLowerCase()} added yet.
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map((item, index) => renderItem(item, index, provided))}
                    {provided.placeholder}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}

// Helper component for draggable items
export function DraggableItem({
  id,
  index,
  title,
  subtitle,
  onEdit,
  onDelete,
  renderActions
}: {
  id: string
  index: number
  title: string
  subtitle?: string
  onEdit?: () => void
  onDelete?: () => void
  renderActions?: () => React.ReactNode
}) {
  return (
    <Draggable key={id} draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="p-4 flex items-center"
        >
          <div
            className="flex-none mr-2 cursor-move"
            {...provided.dragHandleProps}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{title || 'Unnamed Item'}</div>
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          </div>
          {renderActions ? (
            renderActions()
          ) : (
            <TooltipProvider>
              <div className="flex gap-2">
                {onEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={onEdit}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit item</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={onDelete}
                      >
                        <Unlink className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove from event</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>
      )}
    </Draggable>
  )
}
