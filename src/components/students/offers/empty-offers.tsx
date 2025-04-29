import { Info } from 'lucide-react';

export function EmptyOffers() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Info className="h-12 w-12 text-muted-foreground mb-2" />
      <p className="text-muted-foreground">No special offers available at this time.</p>
    </div>
  );
}
