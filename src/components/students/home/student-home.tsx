// Import the graduation pattern image
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Calendar,
  Camera,
  Eye,
  GraduationCap,
  QrCode,
  ShoppingBag,
  Undo,
  Users,
} from 'lucide-react';

import { EventFeatures } from './event-features';
import { GraduationChecklist } from './graduation-checklist';
import { QuickAccessCard } from './quick-access-card';
import { ChecklistItem } from './types';
import { WelcomeCard } from './welcome-card';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';
import { studentContactQueryOptions } from '@/utils/student-contact';
import { selfieQueryOptions } from '@/utils/selfies.server';
import { eventFeaturesQueryOptions } from '@/utils/event-features';
import gradPattern from '@/public/assets/grad_pattern.webp';

export function StudentHome() {
  // Fetch user and contact data using suspense queries
  const { data: userData } = useSuspenseQuery(userWithRolesQueryOptions());
  const { data: contactData } = useSuspenseQuery(studentContactQueryOptions());

  // Fetch event features if we have an event_id
  const eventId = contactData?.event_id;
  const { data: eventFeatures = [] } = eventId
    ? useSuspenseQuery(eventFeaturesQueryOptions(eventId))
    : { data: [] };

  // Fetch selfie data if we have a contact_id
  const contactId = contactData?.contact_id;
  const { data: selfieData } = contactId
    ? useSuspenseQuery(selfieQueryOptions(contactId))
    : { data: null };

  // Get first name from user metadata or contact data
  const firstName = userData?.user_metadata?.first_name || contactData?.first_name || 'Student';

  // Extract booking details from the contact data
  const ceremonyName = contactData?.event_name || 'Your Ceremony';
  const bookingDate = contactData?.booking_created_at
    ? new Date(contactData.booking_created_at).toLocaleDateString()
    : 'TBD';
  // Use a fallback for location since the property names might vary
  const bookingLocation = 'Check your email for venue details';

  // Todo list items
  const todoItems: ChecklistItem[] = [
    { id: 'upload-selfie', label: 'Upload selfie', icon: Camera, link: '/profile' },
    { id: 'collect-gown', label: 'Collected gown', icon: GraduationCap },
    { id: 'visit-studio', label: 'Visited Photography Studio', icon: Camera },
    { id: 'photos-friends', label: 'Taken photos with friends', icon: Users },
    { id: 'ceremony', label: 'Celebrated at the ceremony', icon: GraduationCap },
    { id: 'onstage-photos', label: 'Viewed onstage photos', icon: Eye },
    { id: 'merch', label: 'Looked at the merch', icon: ShoppingBag },
    { id: 'return-gown', label: 'Returned gown', icon: Undo },
  ];

  // Use type assertion to handle the todo_checklist from the view
  // This is necessary because the TypeScript types might not be updated yet
  const baseChecklist = (contactData as any)?.todo_checklist || {};

  // Automatically check off the upload-selfie item if a selfie exists
  const hasSelfie = !!selfieData;
  const todoChecklist = {
    ...baseChecklist,
    // Only override if selfie exists, otherwise use the existing value
    'upload-selfie': hasSelfie ? true : baseChecklist['upload-selfie'],
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Welcome Card with Booking Info */}
      <WelcomeCard
        firstName={firstName}
        ceremonyName={ceremonyName}
        bookingDate={bookingDate}
        bookingLocation={bookingLocation}
        backgroundImage={gradPattern}
      />

      {/* Booking and Schedule Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <QuickAccessCard
          title="Your Booking"
          description="View your QR code and booking details"
          icon={QrCode}
          to="/booking"
        />
        <QuickAccessCard
          title="Schedule"
          description="Check your upcoming events"
          icon={Calendar}
          to="/schedule"
        />
      </div>

      {/* Todo List */}
      <GraduationChecklist
        todoItems={todoItems}
        initialChecklist={todoChecklist}
        contactId={contactData?.contact_id}
      />

      {/* Event Features */}
      {eventFeatures.length > 0 && eventId && (
        <EventFeatures
          features={eventFeatures}
          eventId={eventId}
          contactId={contactData?.contact_id || undefined}
        />
      )}
    </div>
  );
}
