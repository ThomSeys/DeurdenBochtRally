import { useEffect, useState } from 'react';

declare global {
  interface Window {
    ENV?: {
      VAPID_PUBLIC_KEY?: string;
    };
  }
}

export function PushNotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    }
  }

  async function subscribeToPush() {
    try {
      setIsLoading(true);

      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        alert('Je moet notificaties toestaan om updates te ontvangen');
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // You'll need to set this as an environment variable
          window.ENV?.VAPID_PUBLIC_KEY || ''
        ),
      });

      // Send subscription to server
      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subscribe',
          subscription: subscription.toJSON(),
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        alert('✓ Je ontvangt nu push notificaties!');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Er ging iets mis bij het aanmelden voor notificaties');
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'unsubscribe',
            endpoint: subscription.endpoint,
          }),
        });

        setIsSubscribed(false);
        alert('Je ontvangt geen notificaties meer');
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!('Notification' in window)) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-sm text-sm">
        Notificaties zijn geblokkeerd. Check je browser instellingen.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">🔔 Push Notificaties</h4>
          <p className="text-sm text-gray-600">
            {isSubscribed 
              ? 'Je ontvangt updates over de rally' 
              : 'Ontvang live updates tijdens het evenement'
            }
          </p>
        </div>
        <button
          onClick={isSubscribed ? unsubscribe : subscribeToPush}
          disabled={isLoading}
          className={`px-4 py-2 rounded-sm font-medium transition-colors ${
            isSubscribed
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          } disabled:opacity-50`}
        >
          {isLoading ? '...' : isSubscribed ? 'Uitschakelen' : 'Inschakelen'}
        </button>
      </div>
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
