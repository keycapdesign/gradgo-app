import { Link } from '@tanstack/react-router';

import { Feature } from './types';
import { trackFeatureClickEvent } from '@/utils/event-tracking';

interface FeatureCardProps {
  feature: Feature;
  eventId?: number;
  contactId?: number;
}

export function FeatureCard({ feature, eventId, contactId }: FeatureCardProps) {
  // Construct the image URL - if it's a relative path, prepend the storage URL
  const imageUrl = feature.background_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/features_images/${feature.background_path}`
    : 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop';

  // Track feature click
  const handleFeatureClick = () => {
    if (eventId) {
      trackFeatureClickEvent(
        feature.id,
        feature.title || 'Unnamed Feature',
        eventId,
        contactId
      ).catch((error) => {
        console.error('Error tracking feature click:', error);
      });
    }
  };

  if (feature.link) {
    return (
      <Link
        to={feature.link}
        target={feature.link.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="block"
        onClick={handleFeatureClick}
      >
        <div className="relative h-72 w-full overflow-hidden rounded-xl transition-transform group hover:scale-[1.02]">
          <img src={imageUrl} alt={feature.title || ''} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
            <h3 className="text-xl font-bold text-white">{feature.title}</h3>
            <p className="text-white/90 mt-1">{feature.subtitle}</p>

            <div className="mt-3 inline-flex items-center text-sm font-medium group-hover:underline text-primary-foreground">
              Learn more
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl">
      <img src={imageUrl} alt={feature.title || ''} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
        <p className="text-white/90 mt-1">{feature.subtitle}</p>
      </div>
    </div>
  );
}
