/**
 * Service worker registration utility
 */

// Check if service workers are supported
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// Register the service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

// Unregister the service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('Service worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
}

// Update the service worker
export async function updateServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service worker updated');
    }
  } catch (error) {
    console.error('Service worker update failed:', error);
  }
}

// Send a message to the service worker
export function sendMessageToServiceWorker(message: any): void {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

// Initialize service worker
export async function initServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser');
    return;
  }

  try {
    // Register the service worker
    await registerServiceWorker();

    // Set up message event listener
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from service worker:', event.data);
    });
  } catch (error) {
    console.error('Error initializing service worker:', error);
  }
}
