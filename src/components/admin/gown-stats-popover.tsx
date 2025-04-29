import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, GripIcon } from 'lucide-react';
import { breakdownSkus } from '@/utils/gown-breakdown';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define types for our component
interface GownCount {
  gown_id: number;
  ean: string;
  count: number;
}

interface DetailedGownCount {
  ean_pattern: string; // The component EAN
  gown_type: string; // Will be 'composition'
  component_type: string; // Will be 'gown', 'hood', 'cap', or 'bonnet'
  count: number;
}

interface GownStatsPopoverProps {
  gownCounts: GownCount[];
  detailedCounts?: DetailedGownCount[];
  hasMappings?: boolean;
}

// Define the type for our component data
type ComponentData = {
  ean: string;
  count: number;
};

// Define the type for our processed data
type ProcessedData = {
  gowns: ComponentData[];
  hoods: ComponentData[];
  capsAndBonnets: ComponentData[];
  unknown: ComponentData[];
};

export function GownStatsPopover({
  gownCounts,
  detailedCounts = [],
  hasMappings = false,
}: GownStatsPopoverProps) {
  // State for popover size
  const [popoverSize, setPopoverSize] = useState({ width: 500, height: 400 });
  const [isResizing, setIsResizing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const startResizeRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (popoverRef.current) {
      setIsResizing(true);
      startResizeRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: popoverRef.current.offsetWidth,
        height: popoverRef.current.offsetHeight,
      };
    }
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !startResizeRef.current) return;

    const deltaX = e.clientX - startResizeRef.current.x;
    const deltaY = e.clientY - startResizeRef.current.y;

    const newWidth = Math.max(300, startResizeRef.current.width + deltaX);
    const newHeight = Math.max(300, startResizeRef.current.height + deltaY);

    setPopoverSize({
      width: Math.min(800, newWidth),
      height: Math.min(800, newHeight),
    });
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
    startResizeRef.current = null;
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);
  // If no data is provided, don't render anything
  if (
    (!gownCounts || gownCounts.length === 0) &&
    (!detailedCounts || detailedCounts.length === 0)
  ) {
    return null;
  }

  // Process the detailed counts into a format we can display
  const processDetailedCounts = (): ProcessedData => {
    // If no detailed counts, return empty arrays
    if (!detailedCounts || detailedCounts.length === 0) {
      return { gowns: [], hoods: [], capsAndBonnets: [], unknown: [] };
    }

    // Create collections for each component type
    const gowns: ComponentData[] = [];
    const hoods: ComponentData[] = [];
    const capsAndBonnets: ComponentData[] = [];
    const unknown: ComponentData[] = [];

    // Group counts by component type and EAN
    const gownMap: Record<string, number> = {};
    const hoodMap: Record<string, number> = {};
    const capBonnetMap: Record<string, number> = {};
    const unknownMap: Record<string, number> = {};

    // Process each detailed count
    detailedCounts.forEach((item) => {
      if (item.count <= 0) return;

      // Add to the appropriate map based on component type
      switch (item.component_type) {
        case 'gown':
          gownMap[item.ean_pattern] = (gownMap[item.ean_pattern] || 0) + item.count;
          break;
        case 'hood':
          hoodMap[item.ean_pattern] = (hoodMap[item.ean_pattern] || 0) + item.count;
          break;
        case 'cap':
        case 'bonnet':
          capBonnetMap[item.ean_pattern] = (capBonnetMap[item.ean_pattern] || 0) + item.count;
          break;
        case 'unknown':
        default:
          unknownMap[item.ean_pattern] = (unknownMap[item.ean_pattern] || 0) + item.count;
          break;
      }
    });

    // Convert maps to arrays
    Object.entries(gownMap).forEach(([ean, count]) => {
      gowns.push({ ean, count });
    });

    Object.entries(hoodMap).forEach(([ean, count]) => {
      hoods.push({ ean, count });
    });

    Object.entries(capBonnetMap).forEach(([ean, count]) => {
      capsAndBonnets.push({ ean, count });
    });

    Object.entries(unknownMap).forEach(([ean, count]) => {
      unknown.push({ ean, count });
    });

    // Sort by count (descending)
    gowns.sort((a, b) => b.count - a.count);
    hoods.sort((a, b) => b.count - a.count);
    capsAndBonnets.sort((a, b) => b.count - a.count);
    unknown.sort((a, b) => b.count - a.count);

    return { gowns, hoods, capsAndBonnets, unknown };
  };

  // Process the basic gown counts when no detailed counts are available
  const processBasicCounts = (): ProcessedData => {
    if (!gownCounts || gownCounts.length === 0) {
      return { gowns: [], hoods: [], capsAndBonnets: [], unknown: [] };
    }

    // Group by EAN
    const gownMap: Record<string, number> = {};

    gownCounts.forEach((item) => {
      if (!item.ean) return;
      gownMap[item.ean] = (gownMap[item.ean] || 0) + item.count;
    });

    // Convert to array
    const gowns = Object.entries(gownMap).map(([ean, count]) => ({ ean, count }));

    // Sort by count (descending)
    gowns.sort((a, b) => b.count - a.count);

    return {
      gowns,
      hoods: [],
      capsAndBonnets: [],
      unknown: [],
    };
  };

  // Process fallback counts using the breakdown function
  const processFallbackCounts = (): ProcessedData => {
    if (!gownCounts || gownCounts.length === 0) {
      return { gowns: [], hoods: [], capsAndBonnets: [], unknown: [] };
    }

    try {
      // Convert gownCounts to the format expected by breakdownSkus
      const skuList = gownCounts.map((item) => ({ ean: item.ean, count: item.count }));

      // Use the breakdown function to estimate components
      const breakdown = breakdownSkus(skuList);

      return {
        gowns: breakdown.gowns.map((item) => ({ ean: item.sku, count: item.count })),
        hoods: breakdown.hoods.map((item) => ({ ean: item.sku, count: item.count })),
        capsAndBonnets: breakdown.caps.map((item) => ({ ean: item.sku, count: item.count })),
        unknown: [],
      };
    } catch (error) {
      console.error('Error in fallback breakdown:', error);
      return processBasicCounts(); // Fallback to basic counts if breakdown fails
    }
  };

  // Determine which data to use
  const processedData =
    hasMappings && detailedCounts.length > 0 ? processDetailedCounts() : processFallbackCounts(); // Use the fallback function for estimated component breakdown

  // Render the component
  return (
    <Popover>
      <PopoverTrigger>
        <span className="underline cursor-pointer">Gowns Checked Out</span>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        className="p-0 overflow-auto"
        align="center"
        style={{
          width: `${popoverSize.width}px`,
          height: `${popoverSize.height}px`,
          position: 'relative',
        }}
      >
        <ResizablePanelGroup direction="vertical" className="h-full">
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-lg">
              {hasMappings ? 'Gown Component Breakdown' : 'Estimated Gown Component Breakdown'}
            </h4>
            <p className="text-sm text-muted-foreground">
              Details of currently checked out gown components
            </p>

            {!hasMappings && (
              <Alert className="border-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Estimated Components</AlertTitle>
                <AlertDescription className="text-xs">
                  This event doesn't have gown compositions or schema set up, so these component
                  breakdowns are estimates and might not accurately reflect the checked out items.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <ResizablePanel defaultSize={80}>
            <ScrollArea className="h-full rounded-md p-4">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Gowns Column */}
                <ResizablePanel defaultSize={25} minSize={15}>
                  <div className="space-y-3 pr-2">
                    <h5 className="text-sm font-medium border-b pb-1">Gowns</h5>
                    {processedData.gowns.length > 0 ? (
                      <ul className="text-xs space-y-2">
                        {processedData.gowns.map((item, i) => (
                          <li key={i} className="flex justify-between">
                            <span className="truncate mr-2">{item.ean}</span>
                            <span className="font-medium">{item.count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No gowns checked out</p>
                    )}
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Hoods Column */}
                <ResizablePanel defaultSize={25} minSize={15}>
                  <div className="space-y-3 px-2">
                    <h5 className="text-sm font-medium border-b pb-1">Hoods</h5>
                    {processedData.hoods.length > 0 ? (
                      <ul className="text-xs space-y-2">
                        {processedData.hoods.map((item, i) => (
                          <li key={i} className="flex justify-between">
                            <span className="truncate mr-2">{item.ean}</span>
                            <span className="font-medium">{item.count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No hoods checked out</p>
                    )}
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Caps & Bonnets Column */}
                <ResizablePanel defaultSize={25} minSize={15}>
                  <div className="space-y-3 px-2">
                    <h5 className="text-sm font-medium border-b pb-1">Caps & Bonnets</h5>
                    {processedData.capsAndBonnets.length > 0 ? (
                      <ul className="text-xs space-y-2">
                        {processedData.capsAndBonnets.map((item, i) => (
                          <li key={i} className="flex justify-between">
                            <span className="truncate mr-2">{item.ean}</span>
                            <span className="font-medium">{item.count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No caps or bonnets checked out
                      </p>
                    )}
                  </div>
                </ResizablePanel>

                {/* Unknown Column - Only show if there are unknown items */}
                {processedData.unknown.length > 0 && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={25} minSize={15}>
                      <div className="space-y-3 pl-2">
                        <h5 className="text-sm font-medium border-b pb-1">Unknown</h5>
                        <ul className="text-xs space-y-2">
                          {processedData.unknown.map((item, i) => (
                            <li key={i} className="flex justify-between">
                              <span className="truncate mr-2">{item.ean}</span>
                              <span className="font-medium">{item.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Resize handle in the bottom-right corner */}
        <div
          className="absolute bottom-1 right-1 w-5 h-5 cursor-se-resize flex items-center justify-center bg-background border border-border rounded-sm hover:bg-accent"
          onMouseDown={handleResizeStart}
          style={{ touchAction: 'none' }}
        >
          <GripIcon className="h-3 w-3 text-muted-foreground" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
