import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Filter, X } from 'lucide-react';
import { fetchAllEvents } from '@/utils/all-events';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  pluralLabel?: string;
  options: FilterOption[];
  useCombobox?: boolean;
}

export interface TableFiltersProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string | null>;
  onFilterChange: (filterId: string, value: string | null) => void;
  onClearFilters: () => void;
  className?: string;
}

export function TableFilters({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  className,
}: TableFiltersProps) {
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [openPopover, setOpenPopover] = useState<Record<string, boolean>>({});

  // Fetch events for the event filter if needed
  const { data: events = [] } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => fetchAllEvents({ data: {} }),
    // Only fetch if there's an event filter with useCombobox=true
    enabled: filters.some((filter) => filter.id === 'event_id' && filter.useCombobox),
  });

  // Count active filters
  useEffect(() => {
    const count = Object.values(activeFilters).filter((value) => value !== null).length;
    setActiveFilterCount(count);
  }, [activeFilters]);

  // Toggle popover state
  const togglePopover = (filterId: string, isOpen: boolean) => {
    setOpenPopover((prev) => ({
      ...prev,
      [filterId]: isOpen,
    }));
  };

  // Render a standard select filter
  const renderSelectFilter = (filter: FilterConfig) => (
    <Select
      key={filter.id}
      value={activeFilters[filter.id] || 'all'}
      onValueChange={(value) => {
        onFilterChange(filter.id, value === 'all' ? null : value);
      }}
    >
      <SelectTrigger className="h-9 min-w-[150px] max-w-[200px]">
        <SelectValue placeholder={filter.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {filter.pluralLabel || filter.label}</SelectItem>
        {filter.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Render a combobox filter (for events)
  const renderComboboxFilter = (filter: FilterConfig) => {
    // For event filter, use the fetched events
    const options =
      filter.id === 'event_id' && events.length > 0
        ? events.map((event: any) => ({
            value: event.id.toString(),
            label: event.name,
          }))
        : filter.options;

    const selectedOption = options.find((option) => option.value === activeFilters[filter.id]);

    return (
      <Popover
        key={filter.id}
        open={openPopover[filter.id]}
        onOpenChange={(isOpen) => togglePopover(filter.id, isOpen)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            role="combobox"
            aria-expanded={openPopover[filter.id]}
            className="h-9 min-w-[150px] max-w-[200px] justify-between"
          >
            <span className="truncate flex-1 text-left">
              {selectedOption?.label || `All ${filter.pluralLabel || filter.label}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={`Search ${filter.pluralLabel || filter.label}...`} />
            <CommandList>
              <CommandEmpty>No {filter.label.toLowerCase()} found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onFilterChange(filter.id, null);
                    togglePopover(filter.id, false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      activeFilters[filter.id] === null ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  All {filter.pluralLabel || filter.label}
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onFilterChange(filter.id, option.value);
                      togglePopover(filter.id, false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        activeFilters[filter.id] === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((filter) =>
        filter.useCombobox ? renderComboboxFilter(filter) : renderSelectFilter(filter)
      )}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 px-2 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}

      {activeFilterCount > 0 && (
        <Badge variant="secondary" className="h-6">
          {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
        </Badge>
      )}
    </div>
  );
}

// Compact version that shows filters in a dropdown
export function CompactTableFilters({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  className,
}: TableFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [openPopover, setOpenPopover] = useState<Record<string, boolean>>({});

  // Fetch events for the event filter if needed
  const { data: events = [] } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => fetchAllEvents({ data: {} }),
    // Only fetch if there's an event filter with useCombobox=true
    enabled: filters.some((filter) => filter.id === 'event_id' && filter.useCombobox),
  });

  // Count active filters
  useEffect(() => {
    const count = Object.values(activeFilters).filter((value) => value !== null).length;
    setActiveFilterCount(count);
  }, [activeFilters]);

  // Toggle popover state
  const togglePopover = (filterId: string, isOpen: boolean) => {
    setOpenPopover((prev) => ({
      ...prev,
      [filterId]: isOpen,
    }));
  };

  // Render a combobox filter (for events)
  const renderComboboxFilter = (filter: FilterConfig) => {
    // For event filter, use the fetched events
    const options =
      filter.id === 'event_id' && events.length > 0
        ? events.map((event: any) => ({
            value: event.id.toString(),
            label: event.name,
          }))
        : filter.options;

    const selectedOption = options.find((option) => option.value === activeFilters[filter.id]);

    return (
      <div key={filter.id} className="space-y-1">
        <label className="text-sm font-medium">{filter.label}</label>
        <Popover
          open={openPopover[filter.id]}
          onOpenChange={(isOpen) => togglePopover(filter.id, isOpen)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              role="combobox"
              aria-expanded={openPopover[filter.id]}
              className="w-full justify-between"
            >
              <span className="truncate flex-1 text-left">
                {selectedOption?.label || `All ${filter.pluralLabel || filter.label}`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder={`Search ${filter.pluralLabel || filter.label}...`} />
              <CommandList>
                <CommandEmpty>No {filter.label.toLowerCase()} found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      onFilterChange(filter.id, null);
                      togglePopover(filter.id, false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        activeFilters[filter.id] === null ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    All {filter.pluralLabel || filter.label}
                  </CommandItem>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onFilterChange(filter.id, option.value);
                        togglePopover(filter.id, false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          activeFilters[filter.id] === option.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-10 bg-background border rounded-md shadow-md p-4 min-w-[250px]">
          <div className="flex flex-col gap-3">
            {filters.map((filter) =>
              filter.useCombobox ? (
                renderComboboxFilter(filter)
              ) : (
                <div key={filter.id} className="space-y-1">
                  <label className="text-sm font-medium">{filter.label}</label>
                  <Select
                    value={activeFilters[filter.id] || 'all'}
                    onValueChange={(value) => {
                      onFilterChange(filter.id, value === 'all' ? null : value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`All ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {filter.label}</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            )}

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearFilters();
                  setIsOpen(false);
                }}
                className="mt-2"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
