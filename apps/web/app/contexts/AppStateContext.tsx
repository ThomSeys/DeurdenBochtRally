import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AppStateContextType {
  isOnline: boolean;
  serviceWorkerReady: boolean;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Service Worker status
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setServiceWorkerReady(true);
        setServiceWorkerRegistration(registration);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return "denied";
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        isOnline,
        serviceWorkerReady,
        serviceWorkerRegistration,
        notificationPermission,
        requestNotificationPermission,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

// Convenience hooks
export function useOnlineStatus() {
  const { isOnline } = useAppState();
  return isOnline;
}

export function useServiceWorker() {
  const { serviceWorkerReady, serviceWorkerRegistration } = useAppState();
  return { serviceWorkerReady, serviceWorkerRegistration };
}

export function useNotifications() {
  const { notificationPermission, requestNotificationPermission } = useAppState();
  return { notificationPermission, requestNotificationPermission };
}
