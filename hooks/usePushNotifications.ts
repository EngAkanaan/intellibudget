import { useState, useEffect, useCallback } from 'react';

// Set VITE_VAPID_PUBLIC_KEY in your .env.local to enable background push.
// Generate a key pair with: npx web-push generate-vapid-keys
// Public key → VITE_VAPID_PUBLIC_KEY (frontend)
// Private key → Supabase secret VAPID_PRIVATE_KEY (edge functions)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(Array.from(rawData, (c) => c.charCodeAt(0)));
}

export interface PushNotificationsHook {
  supported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  notify: (title: string, body: string, url?: string, tag?: string) => void;
}

export function usePushNotifications(): PushNotificationsHook {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window;

  useEffect(() => {
    if (supported) setPermission(Notification.permission);
  }, [supported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);

    // If granted and VAPID key is available, try to subscribe for background push
    if (result === 'granted' && VAPID_PUBLIC_KEY && 'PushManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!existing) {
          await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
      } catch (err) {
        // Background push is optional; silently continue with in-app only
        console.warn('Push subscription skipped (VAPID not configured):', err);
      }
    }

    return result === 'granted';
  }, [supported]);

  // Sends a visible notification via the service worker registration.
  // Works when the app is open AND when it is running in the background as a PWA.
  // Does NOT work when the app is fully closed without a server-side push trigger.
  const notify = useCallback((title: string, body: string, url = '/', tag = 'intellibudget') => {
    if (!supported || Notification.permission !== 'granted') return;

    navigator.serviceWorker.ready
      .then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/icon-192.svg',
          badge: '/favicon.svg',
          tag,
          data: { url },
        });
      })
      .catch(() => {
        // Fallback for browsers that don't support showNotification on the SW registration
        try {
          new Notification(title, { body, icon: '/icon-192.svg' });
        } catch {
          // Notifications not available in this context
        }
      });
  }, [supported]);

  return { supported, permission, requestPermission, notify };
}
