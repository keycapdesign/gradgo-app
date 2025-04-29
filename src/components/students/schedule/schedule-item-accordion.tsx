import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

import { ScheduleItem } from './types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ScheduleItemAccordionProps {
  item: ScheduleItem;
}

export function ScheduleItemAccordion({ item }: ScheduleItemAccordionProps) {
  // Parse timestamp
  const timestamp = item.timestamp ? new Date(item.timestamp) : null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value={item.id}
        className="border-none bg-accent dark:bg-card rounded-lg overflow-hidden mb-2"
      >
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center w-full">
            <div className="w-20 text-sm text-muted-foreground">
              {timestamp ? format(timestamp, 'h:mm a') : 'TBD'}
            </div>
            <div className="flex items-center flex-1">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">{item.title || 'Untitled Event'}</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3 border-t border-border/30">
          <div className="pl-20">
            <p className="text-sm mb-2">{item.description || 'No description available.'}</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
