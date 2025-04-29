/**
 * Wallet integration utilities for Apple Wallet and Google Wallet
 */

// Types for wallet pass data
export interface WalletPassData {
  id: string;
  name: string;
  description?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  qrCodeUrl?: string;
  logoUrl?: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

/**
 * Detects the user's device type
 * @returns The device type: 'ios', 'android', or 'other'
 */
export function detectDeviceType(): 'ios' | 'android' | 'other' {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  return 'other';
}

/**
 * Checks if the device supports wallet functionality
 * @returns Boolean indicating if wallet is supported
 */
export function isWalletSupported(): boolean {
  const deviceType = detectDeviceType();

  // iOS devices with Safari support Apple Wallet
  if (deviceType === 'ios' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
    return true;
  }

  // Android devices support Google Wallet
  if (deviceType === 'android') {
    return true;
  }

  // For desktop browsers, we'll provide a fallback
  return true; // Always return true and provide appropriate fallbacks
}

/**
 * Generates an Apple Wallet pass using the server function
 * @param passData Data for the wallet pass
 * @returns Promise that resolves to the URL of the generated pass
 */
export async function generateAppleWalletPass(passData: WalletPassData): Promise<string> {
  try {
    // Import the server function dynamically to avoid SSR issues
    const { generateAppleWalletPassFn } = await import('./wallet-server');

    // Call the server function
    const result = await generateAppleWalletPassFn(passData);

    if (!result.success) {
      throw new Error('Failed to generate Apple Wallet pass');
    }

    return result.passUrl;
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    throw error;
  }
}

/**
 * Generates a Google Wallet pass using the server function
 * @param passData Data for the wallet pass
 * @returns Promise that resolves to the URL or JWT for the Google Wallet pass
 */
export async function generateGoogleWalletPass(passData: WalletPassData): Promise<string> {
  try {
    // Import the server function dynamically to avoid SSR issues
    const { generateGoogleWalletPassFn } = await import('./wallet-server');

    // Call the server function
    const result = await generateGoogleWalletPassFn(passData);

    if (!result.success) {
      throw new Error('Failed to generate Google Wallet pass');
    }

    return result.passUrl;
  } catch (error) {
    console.error('Error generating Google Wallet pass:', error);
    throw error;
  }
}

/**
 * Adds a pass to the user's wallet based on their device type
 * @param passData Data for the wallet pass
 * @returns Promise that resolves when the pass is added (or the process is initiated)
 */
export async function addToWallet(passData: WalletPassData): Promise<void> {
  try {
    const deviceType = detectDeviceType();

    if (deviceType === 'ios') {
      // Generate and open Apple Wallet pass
      const passUrl = await generateAppleWalletPass(passData);
      window.location.href = passUrl;
    } else if (deviceType === 'android') {
      // Generate and open Google Wallet pass
      const passUrl = await generateGoogleWalletPass(passData);
      window.location.href = passUrl;
    } else {
      // For desktop or unsupported devices, provide a download option
      // This could be either type of pass or a PDF/image alternative
      const alternativeUrl = await getWalletAlternative(passData);
      window.open(alternativeUrl, '_blank');
    }
  } catch (error) {
    console.error('Error adding to wallet:', error);
    throw new Error(`Failed to add to wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fallback function for devices that don't support wallet
 * @param passData Data for the wallet pass
 * @returns Promise that resolves to a URL for a downloadable alternative
 */
export async function getWalletAlternative(passData: WalletPassData): Promise<string> {
  try {
    // Import the server function dynamically to avoid SSR issues
    const { generateWalletAlternativeFn } = await import('./wallet-server');

    // Call the server function
    const result = await generateWalletAlternativeFn(passData);

    if (!result.success) {
      throw new Error('Failed to generate wallet alternative');
    }

    return result.alternativeUrl;
  } catch (error) {
    console.error('Error generating wallet alternative:', error);
    throw error;
  }
}
