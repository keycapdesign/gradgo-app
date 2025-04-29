import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Award,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Package,
  QrCode,
  Tag,
  User,
} from 'lucide-react';
import { studentContactQueryOptions } from '@/utils/student-contact';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageWithSuspense } from '@/components/ui/image-with-suspense';

// import { addToWallet, WalletPassData } from '@/utils/wallet'

export const Route = createFileRoute('/_protected/_student/booking/')({
  component: StudentBookingRoute,
  loader: async ({ context }) => {
    // Ensure contact data is loaded
    await context.queryClient.ensureQueryData(studentContactQueryOptions());

    return {
      title: 'Your Booking',
    };
  },
});

function StudentBookingRoute() {
  // Fetch contact data using suspense query
  const { data: contactData } = useSuspenseQuery(studentContactQueryOptions());
  const [isDownloading, setIsDownloading] = useState(false);

  // Extract booking details from the contact data
  const ceremonyName = contactData?.event_name || 'Your Ceremony';
  const eventName = contactData?.event_name || 'Your Event';
  const bookingDate = contactData?.booking_created_at
    ? new Date(contactData.booking_created_at).toLocaleDateString()
    : 'TBD';
  const orderNumber = contactData?.order_number || 'N/A';
  const award = contactData?.award || 'N/A';
  const orderType = contactData?.order_type || 'N/A';
  const bookingLocation = 'Check your email for venue details';
  const qrCodePath = contactData?.qr_code_path || '';

  // Function to download the QR code
  const handleDownloadQRCode = async () => {
    if (!qrCodePath || isDownloading) return;

    setIsDownloading(true);
    try {
      // Get the full URL of the QR code
      const qrCodeUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr_codes/${qrCodePath}`;

      // Fetch the image as a blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${contactData?.full_name || 'booking'}-qr-code.png`;

      // Append to the document, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // // Function to add the QR code to the wallet
  // const handleAddToWallet = async () => {
  //   if (!qrCodePath) return

  //   try {
  //     // Get the full URL of the QR code
  //     const qrCodeUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr_codes/${qrCodePath}`

  //     // Create wallet pass data
  //     const passData: WalletPassData = {
  //       id: contactData?.id?.toString() || 'unknown',
  //       name: contactData?.full_name || 'Student',
  //       description: 'Graduation Booking',
  //       eventName: ceremonyName,
  //       eventDate: bookingDate,
  //       eventLocation: bookingLocation,
  //       qrCodeUrl: qrCodeUrl,
  //       backgroundColor: '#ffffff',
  //       foregroundColor: '#000000'
  //     }

  //     // Add to wallet
  //     await addToWallet(passData)
  //   } catch (error) {
  //     console.error('Error adding to wallet:', error)
  //     alert(`Failed to add to wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  //   }
  // }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* QR Code Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Booking QR Code</CardTitle>
          <CardDescription>Show this at the event for check-in</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {qrCodePath ? (
            <div className="flex flex-col items-center gap-4 overflow-hidden rounded-lg border p-1">
              <ImageWithSuspense
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr_codes/${qrCodePath}`}
                alt="Booking QR Code"
                className="h-64 w-64 object-contain"
                fallbackClassName="h-64 w-64 rounded-md"
              />
              <span className="text-xs max-w-xs text-center text-muted-foreground">
                Show this QR code to a member of staff at gown registration to link your booking.
              </span>
              <div className="flex gap-4">
                {/* Download QR Code */}
                <Button
                  variant="default"
                  onClick={handleDownloadQRCode}
                  disabled={!qrCodePath || isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </>
                  )}
                </Button>
                {/* <Button
                  variant="outline"
                  onClick={handleAddToWallet}
                  disabled={!qrCodePath}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Add to Wallet
                </Button> */}
              </div>
            </div>
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-lg border">
              <div className="text-center">
                <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">QR code not available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="py-0">
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works">
              <AccordionTrigger className="text-lg font-medium">How It Works</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm">
                  <p>
                    Your QR code is your digital ticket for the graduation ceremony. Here's how to
                    use it:
                  </p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>Make sure your phone is charged on the day of the event</li>
                    <li>Have this app open and ready to show your QR code</li>
                    <li>
                      When you arrive, show your QR code to the staff at the check-in desk. Make
                      sure you turn
                    </li>
                    <li>They will scan your code and hand over your graduation gown</li>
                    <li>That's it! You're all set to walk the stage!</li>
                  </ol>
                  <p className="mt-4 font-medium">
                    Pro tip: Download your QR code as a backup in case you don't have internet
                    access at the venue.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader className="">
          <CardTitle className="text-lg">Booking Reference:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-medium">{ceremonyName}</h3>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span>{bookingDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{bookingLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>{contactData?.full_name || 'Your Name'}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>{eventName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Order: {orderNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>Award: {award}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span>Type: {orderType}</span>
              </div>
            </div>

            {/* <div className="rounded-md border bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-medium">Important Information</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please arrive at least 45 minutes before your ceremony start time to allow for check-in, gown collection, and photography.
                  </p>
                </div>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {/* <div className="flex gap-4">
        <Button className="flex-1" variant="outline">
          Add to Calendar
        </Button>
        <Button className="flex-1">Share Details</Button>
      </div> */}
    </div>
  );
}
