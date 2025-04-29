import { useEventStore } from '@/stores/event-store';

export function AnalyticsHeader() {
  const selectedEvent = useEventStore((state) => state.selectedEvent);

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
      <p className="text-muted-foreground mb-6">
        View analytics and usage statistics for{' '}
        {selectedEvent ? `"${selectedEvent.name}"` : 'your events'}
      </p>
    </div>
  );
}
