import { Download, Loader2, Printer, ShoppingCart, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface GalleryHeaderProps {
  title: string;
  subtitle?: string;
  selectedCount: number;
  onCheckoutClick: () => void;
  onExitClick?: () => void;
  onDownloadClick?: () => void;
  checkoutButtonText?: string;
  checkoutButtonIcon?: 'cart' | 'printer' | 'download';
  showExitButton?: boolean;
  showDownloadButton?: boolean;
  downloadButtonDisabled?: boolean;
  purchasedCount?: number;
}

export function GalleryHeader({
  title,
  subtitle,
  selectedCount,
  onCheckoutClick,
  onExitClick,
  onDownloadClick,
  checkoutButtonText = 'Checkout',
  checkoutButtonIcon = 'cart',
  showExitButton = true,
  showDownloadButton = false,
  downloadButtonDisabled = false,
  purchasedCount = 0,
}: GalleryHeaderProps) {
  return (
    <div className="sticky w-full top-0 z-50 p-4 bg-background">
      <div className="flex bg-secondary dark:bg-gradgo-900 border rounded-xl items-center justify-between p-4 shadow-md">
        <div className="flex items-center">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {showExitButton && onExitClick && (
            <Button variant="ghost" size="icon" onClick={onExitClick}>
              <X className="h-5 w-5" />
            </Button>
          )}

          {/* Download button - only shown in student gallery */}
          {showDownloadButton && onDownloadClick && (
            <Button
              onClick={onDownloadClick}
              variant="outline"
              disabled={downloadButtonDisabled || purchasedCount === 0}
              className="relative flex items-center gap-2 h-10 px-4"
              size="sm"
            >
              {downloadButtonDisabled ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download</span>
              {purchasedCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {purchasedCount}
                </span>
              )}
            </Button>
          )}

          {/* Checkout button */}
          <Button
            onClick={onCheckoutClick}
            variant="default"
            disabled={selectedCount === 0}
            className="relative flex items-center gap-2 h-10 px-4"
            size="lg"
          >
            {checkoutButtonIcon === 'printer' && <Printer className="h-5 w-5" />}
            {checkoutButtonIcon === 'cart' && <ShoppingCart className="h-5 w-5" />}
            {checkoutButtonIcon === 'download' && <Download className="h-5 w-5" />}
            <span>{checkoutButtonText}</span>
            {selectedCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground text-sm font-medium text-primary">
                {selectedCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
