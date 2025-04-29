import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Check, ExternalLink, Image as ImageIcon, Pencil, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ImagePicker } from '@/components/admin/image-picker';
import { InlineDatePicker } from '@/components/admin/offers/inline-date-picker';
import { Offer } from '@/components/students/offers/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Schema for validation
const offerSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  discount_value: z.coerce.number().optional().nullable(),
  offer_type: z.enum(['percentage_off', 'amount_off']).optional().nullable(),
  background_path: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  link: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  expires_at: z.string().optional().nullable(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface EditableOfferCardProps {
  offer: Offer;
  onUpdate: (updatedOffer: Partial<Offer>) => void;
}

export function EditableOfferCard({ offer, onUpdate }: EditableOfferCardProps) {
  // State for tracking which field is being edited
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Initialize form with offer data
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: offer.title || '',
      discount_value: offer.discount_value || null,
      offer_type: offer.offer_type || null,
      background_path: offer.background_path || '',
      color: offer.color || '',
      link: offer.link || '',
      expires_at: offer.expires_at || '',
    },
    mode: 'onChange',
  });

  // Get form values
  const { watch, setValue, trigger, formState } = form;
  const title = watch('title');
  const discountValue = watch('discount_value');
  const offerType = watch('offer_type');
  const backgroundPath = watch('background_path');
  const color = watch('color');
  const expiresAt = watch('expires_at');

  // No need to track form changes separately, we can use formState.isDirty directly

  // Handle saving changes for a field
  const handleSave = async (field: keyof OfferFormValues) => {
    try {
      // Validate the field
      const isValid = await trigger(field);

      if (isValid) {
        // Just close the editing field, don't update immediately
        setEditingField(null);
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    }
  };

  // Handle canceling edits
  const handleCancel = (field: keyof OfferFormValues) => {
    setValue(field, offer[field] || '');
    setEditingField(null);
  };

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent, field: keyof OfferFormValues) => {
    if (e.key === 'Enter') {
      handleSave(field);
    } else if (e.key === 'Escape') {
      handleCancel(field);
    }
  };

  // Handle image selection
  const handleImageSelect = (path: string) => {
    setValue('background_path', path);
    // Don't save immediately, let the user save with the Save Changes button
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setValue('color', color);
    // Don't save immediately, let the user save with the Save Changes button
  };

  // Format the expiration date for display
  const formattedExpirationDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;

  // Construct the image URL for preview
  const imageUrl = backgroundPath
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/offers_images/${backgroundPath}`
    : 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?q=80&w=1000&auto=format&fit=crop';

  return (
    <Form {...form}>
      <div className="space-y-2">
        {/* Edit Buttons - Moved outside the card */}
        <div className="flex justify-end gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={() => setShowImagePicker(true)}>
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            {backgroundPath ? 'Change Background' : 'Add Background'}
          </Button>

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ColorPicker
                    value={field.value || '#000000'}
                    onChange={(value) => {
                      field.onChange(value);
                      handleColorSelect(value);
                    }}
                  >
                    {field.value ? 'Change Color' : 'Add Color'}
                  </ColorPicker>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Card
          className="relative overflow-hidden group"
          style={color ? { borderColor: color } : undefined}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src={imageUrl}
              alt={title || 'Offer Background'}
              className="h-full w-full object-cover"
            />
            {/* Semi-transparent color overlay */}
            <div
              className="absolute inset-0 opacity-70"
              style={{ backgroundColor: color || 'rgba(0, 0, 0, 0.3)' }}
            ></div>
          </div>

          {/* Card Header */}
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    {editingField === 'title' ? (
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            autoFocus
                            onKeyDown={(e) => handleKeyDown(e, 'title')}
                            className={`${backgroundPath ? 'bg-black/50 text-white border-white/30 focus-visible:ring-white/30' : ''}`}
                          />
                        </FormControl>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave('title')}
                          className={backgroundPath ? 'text-white' : ''}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <FormMessage />
                      </div>
                    ) : (
                      <CardTitle
                        className={`text-white font-bold text-xl cursor-pointer flex items-center group/title`}
                        onClick={() => setEditingField('title')}
                      >
                        {field.value || 'Special Offer'}
                        <Pencil className="h-3 w-3 ml-2 opacity-0 group-hover/title:opacity-100" />
                      </CardTitle>
                    )}
                  </FormItem>
                )}
              />

              {/* Discount Badge */}
              <div className="flex items-center gap-2">
                {editingField === 'discountValue' ? (
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="discount_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value === null ? '' : field.value}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === 'Enter' &&
                                  field.value &&
                                  form.getValues('offer_type')
                                ) {
                                  setEditingField(null);
                                } else if (e.key === 'Escape') {
                                  handleCancel('discount_value');
                                  handleCancel('offer_type');
                                  setEditingField(null);
                                }
                              }}
                              className="w-20 bg-background/80"
                              autoFocus
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offer_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value || undefined}
                              onValueChange={(value: 'percentage_off' | 'amount_off') => {
                                field.onChange(value);
                              }}
                            >
                              <SelectTrigger className="w-32 bg-background/80">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage_off">Percentage Off</SelectItem>
                                <SelectItem value="amount_off">Amount Off</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (form.getValues('discount_value') && form.getValues('offer_type')) {
                          setEditingField(null);
                        } else {
                          toast.error('Please enter both discount value and type');
                        }
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : discountValue && offerType ? (
                  <div className="relative group/discount">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer text-white border border-white font-bold text-lg z-10"
                      onClick={() => setEditingField('discountValue')}
                    >
                      {offerType === 'percentage_off'
                        ? `${discountValue}% off`
                        : `£${discountValue} off`}
                    </Badge>
                    <Pencil className="absolute -top-2 -right-2 h-4 w-4 ml-1 opacity-0 group-hover/discount:opacity-100" />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditingField('discountValue')}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Add Discount
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Expiration Date */}
          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem>
                <CardContent className="pb-2 relative z-10">
                  {editingField === 'expiresAt' ? (
                    <div className="flex items-center gap-2 w-full">
                      <FormControl className="flex-1">
                        <InlineDatePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date: Date) => {
                            field.onChange(date.toISOString());
                          }}
                          className={`${backgroundPath ? 'text-white' : ''}`}
                          autoOpen={true}
                        />
                      </FormControl>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave('expires_at')}
                        className={backgroundPath ? 'text-white' : ''}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p
                      className={`text-xs cursor-pointer flex items-center group/expires ${backgroundPath ? 'text-white/80' : 'text-muted-foreground'}`}
                      onClick={() => setEditingField('expiresAt')}
                    >
                      {formattedExpirationDate ? (
                        <>
                          <Calendar className="h-3 w-3 mr-1" />
                          Valid until {formattedExpirationDate}
                        </>
                      ) : (
                        <>
                          <Calendar className="h-3 w-3 mr-1" />
                          Add expiration date
                        </>
                      )}
                      <Pencil className="h-3 w-3 ml-1 opacity-0 group-hover/expires:opacity-100" />
                    </p>
                  )}
                </CardContent>
              </FormItem>
            )}
          />

          {/* Link Button */}
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <CardFooter className="pt-0 relative z-10">
                  {editingField === 'link' ? (
                    <div className="flex items-center gap-2 w-full">
                      <FormControl className="flex-1">
                        <Input
                          {...field}
                          value={field.value || ''}
                          onKeyDown={(e) => handleKeyDown(e, 'link')}
                          placeholder="https://example.com"
                          className={`${backgroundPath ? 'bg-black/50 text-white border-white/30 focus-visible:ring-white/30' : ''}`}
                          autoFocus
                        />
                      </FormControl>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave('link')}
                        className={backgroundPath ? 'text-white' : ''}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant={backgroundPath ? 'secondary' : 'default'}
                      size="sm"
                      className="w-full cursor-pointer group/link"
                      onClick={() => setEditingField('link')}
                    >
                      <span>{field.value ? 'Redeem Offer' : 'Add Redeem Link'}</span>
                      {field.value ? (
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      ) : (
                        <Pencil className="ml-2 h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </CardFooter>
              </FormItem>
            )}
          />

          {/* Image Picker Dialog */}
          <ImagePicker
            open={showImagePicker}
            onClose={() => setShowImagePicker(false)}
            onSelect={handleImageSelect}
            bucketName="offers_images"
            currentPath={backgroundPath || undefined}
          />

          {/* Image Picker Dialog Only - Color picker is now in a Popover */}
        </Card>

        {/* Save Changes Button */}
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!formState.isDirty}
            onClick={() => {
              const formValues = form.getValues();
              onUpdate(formValues);
              form.reset(formValues);
            }}
            className="gap-2 w-full"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </Form>
  );
}
