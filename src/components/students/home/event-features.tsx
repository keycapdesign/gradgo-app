import React, { useRef, useEffect, useState } from "react";

import { FeatureCard } from './feature-card';
import { Feature } from './types';

interface EventFeaturesProps {
  features: Feature[];
  eventId?: number;
  contactId?: number;
}

export function EventFeatures({ features, eventId, contactId }: EventFeaturesProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  // Set up intersection observer to handle active dot state
  useEffect(() => {
    if (features.length <= 1 || !carouselRef.current) return;

    const options = {
      root: carouselRef.current,
      rootMargin: '0px',
      threshold: 0.7, // Item is considered visible when 70% in view
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(carouselRef.current?.children || []).indexOf(entry.target);
          setActiveIndex(index);
        }
      });
    }, options);

    // Observe all feature items
    const featureItems = carouselRef.current.querySelectorAll('.snap-center');
    featureItems.forEach((item) => observer.observe(item));

    return () => {
      featureItems.forEach((item) => observer.unobserve(item));
    };
  }, [features.length]);

  // Handle dot click
  const handleDotClick = (index: number) => {
    if (!carouselRef.current) return;

    const items = carouselRef.current.querySelectorAll('.snap-center');
    if (items[index]) {
      const item = items[index] as HTMLElement;
      carouselRef.current.scrollTo({
        left: item.offsetLeft - carouselRef.current.offsetLeft,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    }
  };

  // Handle carousel scroll
  const handleScroll = () => {
    if (!carouselRef.current) return;

    const scrollPosition = carouselRef.current.scrollLeft;
    const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.offsetWidth;
    const threshold = 8; // px, adjust if needed
    setShowLeftGradient(scrollPosition > threshold);
    setShowRightGradient(scrollPosition < maxScroll - threshold);

    // Calculate which item is most visible
    const itemWidth = carouselRef.current.offsetWidth * 0.8; // 80% width
    const index = Math.round(scrollPosition / itemWidth);
    setActiveIndex(index);
  };

  // On mount, set initial gradient visibility
  useEffect(() => {
    if (!carouselRef.current) return;
    const scrollPosition = carouselRef.current.scrollLeft;
    const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.offsetWidth;
    const threshold = 8;
    setShowLeftGradient(scrollPosition > threshold);
    setShowRightGradient(scrollPosition < maxScroll - threshold);
  }, [features.length]);

  if (features.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="relative w-full overflow-hidden">
        {/* Left gradient fade effect */}
        {showLeftGradient && (
          <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background via-background/60 to-transparent pointer-events-none"></div>
        )}

        <div
          ref={carouselRef}
          className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onScroll={handleScroll}
        >
          {features.map((feature) => (
            <div key={feature.id} className="w-[80%] flex-shrink-0 snap-center px-2">
              <FeatureCard feature={feature} eventId={eventId} contactId={contactId} />
            </div>
          ))}
        </div>

        {/* Right gradient fade effect */}
        {showRightGradient && (
          <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background via-background/60 to-transparent pointer-events-none"></div>
        )}

        {/* Pagination dots - only show if we have more than one feature */}
        {features.length > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            {features.map((_, i) => (
              <div
                key={i}
                className={`pagination-dot h-1.5 w-8 rounded-full bg-primary/30 cursor-pointer ${i === activeIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
