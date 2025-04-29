import { Plus, Upload, Search, Unlink } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimePicker } from '@/components/time-picker'
import { DatePicker } from '@/components/date-picker'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'

interface ContactImagesProps {
  images: any[]
  isImagesLoading: boolean
  unassociatedImages: {
    images: any[]
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  }
  isUnassociatedImagesLoading: boolean
  uploadProps: any
  bookings: any[]
  onSearchImages: (dateRange?: [Date | undefined, Date | undefined], page?: number) => void
  onRelateImage: (imageId: string) => void
  onUnrelateImage?: (imageId: string) => void
}

export function ContactImages({
  images,
  isImagesLoading,
  unassociatedImages,
  isUnassociatedImagesLoading,
  uploadProps,
  bookings,
  onSearchImages,
  onRelateImage,
  onUnrelateImage
}: ContactImagesProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(0)

  // Find the most recent booking with an event date when component mounts
  useEffect(() => {
    // Find the most recent booking with an event that has a date
    const bookingWithEventDate = bookings
      .filter(booking => booking.event?.date)
      .sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime())[0]

    // Create date objects for today
    const today = new Date()

    // Set default start time (9:00 AM)
    const defaultStartDate = new Date(today)
    defaultStartDate.setHours(9, 0, 0, 0)
    setStartDate(defaultStartDate)

    // Set default end time (6:00 PM)
    const defaultEndDate = new Date(today)
    defaultEndDate.setHours(18, 0, 0, 0)
    setEndDate(defaultEndDate)

    if (bookingWithEventDate && bookingWithEventDate.event?.date) {
      // Use the event date
      const eventDate = new Date(bookingWithEventDate.event.date)
      console.log(`Using event date: ${eventDate.toISOString()}`)
      setSelectedDate(eventDate)
    } else {
      // Fallback to today if no event date is found
      console.log('No event date found, using today')
      setSelectedDate(today)
    }
  }, [bookings])

  // Function to convert date and time inputs to a date range
  const getDateTimeRange = (): [Date | undefined, Date | undefined] => {
    console.log('Current date/time values:', {
      selectedDate: selectedDate ? selectedDate.toISOString() : 'undefined',
      startDate: startDate ? startDate.toISOString() : 'undefined',
      endDate: endDate ? endDate.toISOString() : 'undefined',
      selectedDateValid: selectedDate ? !isNaN(selectedDate.getTime()) : false,
      startDateValid: startDate ? !isNaN(startDate.getTime()) : false,
      endDateValid: endDate ? !isNaN(endDate.getTime()) : false
    })

    if (!selectedDate || !startDate || !endDate) {
      console.log('Missing date or time values for search')
      return [undefined, undefined]
    }

    // Validate all date objects
    if (isNaN(selectedDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date objects detected')
      return [undefined, undefined]
    }

    // Create start datetime by combining selectedDate with startDate's time
    const startDateTime = new Date(selectedDate)
    startDateTime.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)

    // Create end datetime by combining selectedDate with endDate's time
    const endDateTime = new Date(selectedDate)
    endDateTime.setHours(endDate.getHours(), endDate.getMinutes(), 59, 999) // Set to end of the minute

    console.log('Date range for search:', {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      selectedDate: selectedDate.toISOString(),
      startTime: `${startDate.getHours()}:${startDate.getMinutes()}`,
      endTime: `${endDate.getHours()}:${endDate.getMinutes()}`
    })

    // Make sure the date range is valid
    if (startDateTime > endDateTime) {
      console.error('Invalid date range: start time is after end time')
      toast.error('Start time must be before end time')
      return [undefined, undefined]
    }

    return [startDateTime, endDateTime]
  }

  // Handle dialog open state change
  const handleDialogOpenChange = (open: boolean) => {
    setIsUploadDialogOpen(open)

    // Reset current page when dialog is opened
    if (open) {
      setCurrentPage(0)
    }
  }

  // Handle search button click
  const handleSearchImages = (page: number = 0) => {
    setCurrentPage(page)
    const dateTimeRange = getDateTimeRange()

    console.log(`Searching images for page ${page} with date range:`, {
      dateTimeRange,
      start: dateTimeRange[0] ? dateTimeRange[0].toISOString() : 'undefined',
      end: dateTimeRange[1] ? dateTimeRange[1].toISOString() : 'undefined'
    })

    // Only search if we have valid date range values
    if (dateTimeRange[0] && dateTimeRange[1]) {
      console.log('Valid date range found, calling onSearchImages')
      onSearchImages(dateTimeRange, page)
    } else {
      console.error('Invalid or missing date range, search aborted')
      toast.error('Please select a valid date and time range')
    }
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Images</CardTitle>
        <Dialog open={isUploadDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Images
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Images to Contact</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload New Images
                </TabsTrigger>
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Find Existing Images
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <div className="grid gap-4">
                  <Dropzone {...uploadProps}>
                    <DropzoneContent />
                    <DropzoneEmptyState />
                  </Dropzone>
                </div>
              </TabsContent>

              <TabsContent value="search" className="mt-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <DatePicker
                        label="Date"
                        value={selectedDate}
                        onChange={(newDate) => {
                          console.log('Date changed:', newDate ? newDate.toISOString() : 'undefined')
                          if (newDate) {
                            // Update the selected date
                            setSelectedDate(newDate)

                            // Always update both start and end times with the new date
                            // but preserve their time components
                            if (startDate) {
                              const newStartDate = new Date(newDate)
                              newStartDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)
                              setStartDate(newStartDate)
                              console.log('Updated start date:', newStartDate.toISOString())
                            } else {
                              // Default to 9:00 AM if no start time is set
                              const newStartDate = new Date(newDate)
                              newStartDate.setHours(9, 0, 0, 0)
                              setStartDate(newStartDate)
                              console.log('Set default start date:', newStartDate.toISOString())
                            }

                            if (endDate) {
                              const newEndDate = new Date(newDate)
                              newEndDate.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0)
                              setEndDate(newEndDate)
                              console.log('Updated end date:', newEndDate.toISOString())
                            } else {
                              // Default to 6:00 PM if no end time is set
                              const newEndDate = new Date(newDate)
                              newEndDate.setHours(18, 0, 0, 0)
                              setEndDate(newEndDate)
                              console.log('Set default end date:', newEndDate.toISOString())
                            }
                          }
                        }}
                      />
                    </div>
                    <div>
                      <TimePicker
                        label="Start Time"
                        value={startDate}
                        onChange={(newTime) => {
                          console.log('Start time changed:', newTime ? newTime.toISOString() : 'undefined')
                          if (newTime) {
                            // If we have a selected date, use it as the base for the time
                            if (selectedDate) {
                              const newStartDate = new Date(selectedDate)
                              newStartDate.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0)
                              setStartDate(newStartDate)
                            } else {
                              // Otherwise, just use the time as is
                              setStartDate(newTime)
                            }
                          }
                        }}
                      />
                    </div>
                    <div>
                      <TimePicker
                        label="End Time"
                        value={endDate}
                        onChange={(newTime) => {
                          console.log('End time changed:', newTime ? newTime.toISOString() : 'undefined')
                          if (newTime) {
                            // If we have a selected date, use it as the base for the time
                            if (selectedDate) {
                              const newEndDate = new Date(selectedDate)
                              newEndDate.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0)
                              setEndDate(newEndDate)
                            } else {
                              // Otherwise, just use the time as is
                              setEndDate(newTime)
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <Button onClick={() => handleSearchImages(0)} disabled={isUnassociatedImagesLoading}>
                    {isUnassociatedImagesLoading ? 'Searching...' : 'Search Images'}
                  </Button>

                  {/* Search results */}
                  {unassociatedImages.images && unassociatedImages.images.length > 0 ? (

                    <div className="mt-4">
                      <ScrollArea className="w-full h-60 md:h-90">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {unassociatedImages.images.map((image: any) => (
                            <div key={image.id} className={`relative group ${image.isAssociated ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>

                              <div className="overflow-hidden rounded-md">
                                {image.signedUrl ? (
                                  <img
                                    src={image.signedUrl}
                                    alt=""
                                    className="w-full h-60 object-cover"
                                    onLoad={() => console.log(`Image ${image.id} loaded successfully`)}
                                    onError={(e) => console.error(`Error loading image ${image.id}:`, e)}
                                  />
                                ) : (
                                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">Image not available</span>
                                  </div>
                                )}
                              </div>
                              {!image.isAssociated && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onRelateImage(image.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add to Contact
                                  </Button>
                                </div>
                              )}
                              {image.isAssociated && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                  Associated
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>


                      {/* Pagination controls */}
                      {unassociatedImages.pagination && unassociatedImages.pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearchImages(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0 || isUnassociatedImagesLoading}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {currentPage + 1} of {unassociatedImages.pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearchImages(Math.min(unassociatedImages.pagination.totalPages - 1, currentPage + 1))}
                            disabled={currentPage >= unassociatedImages.pagination.totalPages - 1 || isUnassociatedImagesLoading}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>

                  ) : isUnassociatedImagesLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="w-full h-40 rounded-md" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {activeTab === 'search' ? 'Click "Search Images" to find images' : 'No images found matching your search criteria.'}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="relative w-full overflow-hidden">
        {isImagesLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-54 w-48 rounded-md flex-none" />
            ))}
          </div>
        ) : images.length > 0 ? (
          <ScrollArea className="w-full">
            <div className="flex w-max gap-4 pb-2 pt-1">
              {images.map((imageData: any) => (
                <figure key={imageData.id} className="flex-none w-48 relative group">
                  <div className="overflow-hidden rounded-md">
                    {imageData.signedUrl ? (
                      <div className="relative">
                        <img
                          src={imageData.signedUrl}
                          alt="Contact image"
                          className="w-full object-cover"
                          onLoad={() => console.log(`Image ${imageData.id} loaded successfully`)}
                          onError={(e) => console.error(`Error loading image ${imageData.id}:`, e)}
                        />
                        {onUnrelateImage && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onUnrelateImage(imageData.image_id)}
                            >
                              <Unlink className="h-4 w-4 mr-1" /> Unlink
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Image not available</span>
                      </div>
                    )}
                    
                  </div>
                  <figcaption className="mt-2 text-xs text-muted-foreground">
                    {imageData.image?.timestamp ? format(new Date(imageData.image.timestamp), 'PPP p') : 'No timestamp'}
                  </figcaption>
                </figure>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No images found for this contact.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Images
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
